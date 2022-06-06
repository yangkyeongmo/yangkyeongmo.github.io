---
title: "Python3 의 PEG 파서"
date: 2021-10-30 20:35
categories: dev
tags: ["python"]
---

# Objective

- Parser grammar를 해석할 수 있다.

 Python 3.9 에서 PEG 파서를 도입했다는 언급을 찾을 수 있음. ([https://www.python.org/dev/peps/pep-0617/](https://www.python.org/dev/peps/pep-0617/)) 흥미로운건 같은 문서의 Performance and validation 부분에서는 기존 파서의 10% 이내의 메모리 사용량과 속도를 달성했다는 언급이다. ([https://www.python.org/dev/peps/pep-0617/#toc-entry-29](https://www.python.org/dev/peps/pep-0617/#toc-entry-29))

> We have tuned the performance of the new parser to come within 10% of the current parser both in speed and memory consumption. While the PEG/packrat parsing algorithm inherently consumes more memory than the current LL(1) parser, we have an advantage because we don't construct an intermediate CST.

 이 부분에서 언급하는 PEG/packrat 파싱 알고리즘은 무엇이고, 기존 파싱 알고리즘은 어땠길래 이런 차이가 발생한 것일까? 사실 파이썬측에서 주장하는 성능 개선은 PEG 파서로 바꿨기 때문이 아니라 CST가 제거된 것에서 발생했다는 것 같지만, LL 파서와 PEG 파서의 차이를 알아보면 이 문서를 더 자세히 이해할 수 있을것 같다. 앞으로 Python 3.10 이상에서 나올 문법적인 부분을 이해할 수 있는건 덤.

# LL(1) parser

 LL(1) parser는 LL(k) parser 중 k=1인 것이다. LL(k) parser는 LL parser 중 하나인데, 여기서 LL은 Left-to-right, Left most derivative를 의미한다. LL(k) parser는 k개의 lookahead를 들고있는 parser를 의미한다. LL(1) parser는 하나의 lookahead만 들고있는데, input 중 첫 번째 값만 보고 파싱을 한다는 것을 의미한다. LL parser는 context-free language에 대한 top-down parser 중 하나이다.

- 왜 "중 하나"라고 했냐면 LR, LALR 등 여러 파서가 존재한다.

## parser

> A **parser** is a software component that takes input data (frequently text) and builds a [data structure](https://en.wikipedia.org/wiki/Data_structure) – often some kind of [parse tree](https://en.wikipedia.org/wiki/Parse_tree), [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) or other hierarchical structure, giving a structural representation of the input while checking for correct syntax.

 Parsing은 input에 어떤 규칙에 따른 구조를 부여하는 것을 의미하고, parser는 parsing을 하는 알고리즘을 의미하는것 같음. 

 의미적으로는 이렇고 Python 구현에서는 token generator와 code generator 사이에서 parse tree를 만들어주는 프로그램을 의미함. Token generator가 input string을 보고 tokenize를 해주면 token들을 가지고 parser가 AST를 만들어준다. Code generator는 AST를 받아서 byte code를 만듬.

![Image](/assets/img/bcb439be-e82b-468c-bcac-5e1e2cdb2e6f.png)

## top-down parser

> **Top-down parsing** in [computer science](https://en.wikipedia.org/wiki/Computer_science) is a [parsing](https://en.wikipedia.org/wiki/Parsing) strategy where one first looks at the highest level of the [parse tree](https://en.wikipedia.org/wiki/Parse_tree) and works down the parse tree by using the rewriting rules of a [formal grammar](https://en.wikipedia.org/wiki/Formal_grammar).

Top-down parser는 parse tree의 제일 윗 부분에서 아래로 내려가며 formal grammar의 규칙을 적용하는 방식을 의미함.
예를 들자면 input이 `aefgh`이고, 문법 규칙들은 `A → aBC, B → bd | ef, C → ce | gh` 이고 A가 parser의 시작점이라고 하자.
트리는 대략 이런 모습일 것이다.

```
A -> aBC -> abdC -> abdce
                 \-> abdgh
         -> aefC -> aefce
                 \-> aefgh
```

 이 트리를 parse tree 라고도 하는것 같다.

## formal grammar

 언어의 기본 구성 요소를 어떻게 구성할 수 있는지 알려주는 규칙. Formal language의 생성 규칙의 집합으로 구성된다.

## Parsing with LL(k) parser

 LL(k) parser로 파싱을 하려면 input buffer, stack, parsing table의 세 가지가 필요하다. Input buffer는 말 그대로 입력 토큰들이 존재하는 곳이다. LL(k) parser는 input buffer에 있는 토큰 중 k개를 확인할 수 있는데, 확인하되 소모하지는 않는다.

 Stack은 해석된 규칙을 쌓아두는 자료 구조임. Stack에 쌓일 수 있는 요소는 non-terminal, terminal 또는 empty string인데 여기서 non-terminal은 규칙을 통해서 해석될 수 있는 토큰을 의미하고 terminal은 더이상 규칙을 적용할 수 없는 토큰을 의미한다. 초기에 Stack에는 시작 심볼과 EOI(End of input)이 존재한다. EOI는 input buffer의 끝에도 존재해서 stack과 input buffer를 모두 들여다봤을 때 EOI가 나오면 종료로 볼 수 있다.

 시작 심볼이 stack에 있는 상태에서, 파서는 두 가지 행동을 취할 수 있다.

1. Stack의 제일 위에 있는 값에 대해 규칙을 적용한 결과 X가 non-terminal일 때. 그 결과를 다시 stack에 차례대로 넣고 다시 제일 위 값을 뽑는다.
2. X가 terminal 혹은 empty string 일 때. Input buffer의 앞에서부터 k개 토큰이 X와 일치하면 일치하는 토큰을 input stream에서 제거하고 stack에서도 제거한다. 다르다면 input을 거부한다.

 진행하다가 stack에서 뽑은 값이 EOI이면 파싱을 중지하고 성공처리한다.

```
Input buffer: '1' - '+' - '2' - '+' - '3'
Stack: [S, $]
```

### Parsing table

 실제로 파서를 구현하기 위해서는 규칙을 적용할 방법이 필요한데, parsing table을 구현해서 규칙을 참고하도록 한다. Parsing table은 이런 식으로 구현된다.

- 행: Stack에서 뽑은 제일 윗 값
- 열: input token들
- 값: 적용할 규칙

 열에는 가능한 모든 input 조합을 넣어야할 것이므로 parsing table의 크기는 k에 대해 지수함수적으로 비례한다.

```
Parsing table:
-   |   a   |   b   |   c   |   d   |   e   |
---------------------------------------------
A   |   1   |   -   |   -   |   -   |   -   |
---------------------------------------------
B   |   -   |   2   |   2   |   -   |   -   |
---------------------------------------------
C   |   -   |   -   |   -   |   3   |   3   |
---------------------------------------------
```

 LL(1) 파서는 parsing table을 구현하기 위해 FIRST와 FOLLOW 함수를 사용한다. 개념적으로만 이해하려면 FIRST만 알고있으면 되는데, FIRST는 A를 해석했을 때 최종적으로 얻을 수 있는 output의 첫 번째 token이다. 예를 들어 A → Bd, B → Ce, C → df 라는 규칙이 있다고 했을 때, A는 최종적으로 dfef 라는 글자가 되므로 FIRST(A) = d이다. 

# PEG parser

PEG는 parsing expression grammar의 약자로, parsing expression을 사용한 grammar를 말한다. 여기서 Parsing expression은 regular expression과 비슷하게 string을 인식하는 pattern 같은 것이라고 볼 수 있을것 같다. PEG parser도 top-down parser 중 하나이고 

## Parsing expression Grammar

 PEG의 기본 요소는 다른 파서와 마찬가지로 non-terminal, terminal, empty string임. PEG에서 rule은 `A <- e` 형태로 표시하는데, e가 parsing expression에 해당한다. LL이 `A -> alpha` 형태로, A는 무조건 alpha로 바꾼다는 형태였는데 PEG의 경우는 대략 parsing expression e가 만족되면 A를 변경한다는 정도로 볼 수 있을것 같다. 인식의 주체가 다름. Parsing expression의 최소 구성요소, atomic parsing expression은 terminal, non-terminal, empty string으로 구성되고 parsing expression을 이 정도의 규칙에 따라서 조합할 수 있다.

- sequence: e = e1e2
- ordered choice: e = e1 | e2
- zero or more: e = e1*
- one or more: e = e1+
- optional: e = e1?
- and: e = &e1
- not: e = !e1

 Sequence는 e1이 만족하고 나서 e2가 만족되어야한다. e1이 실패하면 e2는 조사하지 않는다. Ordered choice는 e1이 만족하면 정지하고, e1가 만족하지 않으면 e1을 조사하기 시작한 지점으로 input buffer를 backtrack해서 그 지점부터 시작해 e2를 조사한다. 

 LL parser 계열과 PEG parser의 가장 큰 차이점이 ordered choice에서 나타난다. 여러 가지 choice가 있을 때 LL parser 계열은 모든 경우를 고려하다가 FIRST(e)가 두 경우 이상에서 같은 것이 나오면 모호해지는 반면 ordered choice는 제일 첫 match를 선택한다. 이렇다보니 PEG에서는 모호함이 없이 parse tree가 단 하나로 정해진다.

 Zero or more나 one or more에서도 LL grammar와 PEG의 차이를 볼수 있는데 LL(k) grammar는 유한한한 lookahead를 사용하는 반면 PEG grammar는 input 개수에 비례하는 lookahead를 사용할 수 있기 때문에 메모리 사용량이 input에 비례한다.

 다른 expression들은 조건이 만족하면 input을 소모하는 반면 and나 not expression은 semantic predicate 라고 불리는 input 을 소모하지 않는 expression이다. 흔히 알고있는 boolean expression과 비슷하게, and 는 조건이 만족하면 pass하고 아니면 앞으로 계속 backtrack하도록 보낸다(바로 정지시키는것 아님!)

## Parsing with PEG parser

## 한계

 Lookahead를 unlimited하게 사용하다보니 exponential time performance를 보일 수 있음. 이를 보완하기 위해서 packrat parser를 사용한다.

### packrat parser

 Parse tree를 내려가면서 각 input 위치에 대해 parse function을 최대 한 번만 적용하도록 모든 결과를 memoize함. 메모리 사용량은 엄청 많아지는대신 실행이 항상 linear time안에 종료된다.

# Python은 왜 PEG 파서로 넘어갔나

## 현재 LL(1) parser로 해결하기 어려운 문제

 일단 left recursion이 안 됨. LL(1)으로 하면 left recursion 했을 때 무한정 반복되다보니 중간에 끊어주지 않으면 활용할 수 없다.

 문법을 수정하면 parse tree의 모양이 바뀌다보니까 code generator도 수정해야한다고 한다. 문제는 code generator가 수정하기 꽤 어렵다고 한다. 그래서 2005년 쯤에 code generator가 수용하는 AST를 놓고 parser가 만드는 CST를 만들어서 CST를 AST로 변환하는 번역기 프로그램을 또 만들었다고 한다. 이거 덕분에 code generator를 수정하지 않고도 문법을 수정할 수 있긴 했는데 이제는 번역기 프로그램을 수정해야한다고 한다. 이게 6천줄 정도의 C 코드여서 유지보수하기가 굉장히 어려웠다고 함. 특히 walrus opertor 만들면서 크게 느꼈다고 한다. 게다가 CST와 AST가 메모리에 둘 다 올라가있어야하는건 덤.

## PEG로 넘어갔을 때 이점들

 left recursion 가능하다. 이게 클래식한 PEG로는 원래 불가능한데, recursion 한계를 걸면 가능하다고 한다. 설명이 딱히 없어서 잘 모르지만 첫 번째 match에서 left recursion이 발생했을 때, 최대 recursion에 도달하면 그냥 버리고 다음 match로 이동하는 방식이라고 했던것 같다. LL 에서는 ordered choice라던가 backtrack 하는게 없으니까 아마 불가능했을 것. 이걸 구현한 이론적 베이스가 있는데 그쪽에 따르면 이론적으로 가능하다고 한다.

 귀도가 발표할 때만 해도 C로 컴파일했을 때 속도는 거의 비슷하고 메모리는 조금 더 먹었다고 한다. 메모리는 요새 싸니까 별 문제가 안 된다고 생각했다나봄. PEG 릴리즈 발표한 PEP에 따르면 원래 파서보다 성능이 10% 정도 된다고 하는데 실제로 그런지는 잘 모르겠다.

 메모리는 더 먹어도 LL(1) 파서보다 더 강력하게 해석할 수 있다. 위에서 본 것처럼 PEG는 expression 기반으로 해석하고 infinite lookahead 사용하기 때문.

 LL 사용하는 것보다 문법이 더 자연스러워지는데, 원래 LL 사용했을 때 문법적으로 문제가 있는 부분은 약간 변경해서 사용하는 게 있었다고 한다. PEG 사용하면 문법적으로 해소되는 부분이 있다보니 minor tweak들을 사용하지 않아도 자연스럽게 문법을 나타낼 수 있다고 한다. 이게 우리에게 실질적으로 도움을 주는 부분은 문법 문서를 가지고 실제 구현을 예측할 때인데, 문법 문서가 구현과 동일하다고 얘기는 하지만 사실 그렇지 않다고 한다.

 Grammar action 이라는 것을 사용해서 AST를 바로 생성할 수 있는것도 장점이다. 이 덕분에 PEG 파서를 사용하면 CST와 번역기 프로그램을 사용하지 않아도 되는데 유지보수 측면에서 이점이 있을것이라고 함. 
