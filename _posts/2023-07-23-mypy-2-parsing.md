---
title: "Mypy의 동작 방식: #2 파일 파싱"
date: 2023-07-23 15:00
categories: dev
tags: ["python"]
---

# Introduction

이 포스트에서는 대규모 파이썬 프로젝트에서 특정 함수의 호출자를 찾는 [mypyind](https://github.com/yangkyeongmo/mypyind)를 작성하면서 mypy에 대해 부차적으로 공부했던 내용들을 정리했습니다.

이 포스트는 아래 포스트들로 연결됩니다.

[Mypy의 동작 방식: #1 진행 전 최적화]({% post_url 2023-07-18-mypy-1-pre-optimization %})

[Mypy의 동작 방식: #2 파일 파싱(현재 글)]({% post_url 2023-07-23-mypy-2-parsing %})

[Mypy의 동작 방식: #2-side mypy는 AST가 왜 필요할까?]({% post_url 2023-07-23-mypy-2-1-why-ast %})

[Mypy의 동작 방식: #3 의미 분석]({% post_url 2023-07-24-mypy-3-semanal %})

[Mypy의 동작 방식: #4 타입 체크]({% post_url 2023-07-24-mypy-4-typecheck %})

# Overview

Mypy가 타입 체크를 하기 위해 [첫 번째 단계]({% post_url 2023-07-18-mypy-1-pre-optimization %})에서는 방문할 모듈의 순서를 결정했습니다.

그렇다면 타입 체크를 해야할텐데, 코드를 어떻게 해석해야 타입 체크를 할 수 있을까요?

컴파일러 디자인을 알고 있으시다면 이미 짐작하셨겠지만, 타입 체크를 하기 전 코드를 AST(Abstract Syntax Tree)로 만들어둡니다.

# ast 라이브러리를 활용해 AST를 만든다

mypy가 코드를 해석하기 위해서는 코드가 구조화된 형태로 만들어져야 합니다. 구조화하기 위해 mypy는 코드를 AST로 변환합니다.

다른 구조가 아닌 AST로 변환하는 자세한 이유는 [Mypy의 동작 방식: #2-side mypy는 AST가 왜 필요할까?]({% post_url 2023-07-23-mypy-2-1-why-ast %})에서 살펴보겠습니다.

이유를 간단하게 알아보자면 저희가 자주 사용하는 컴퓨터 언어들은 formal grammar를 바탕으로 했고, formal grammar로 만든 문장은 트리 형태로 해석할 수 있습니다. 해석한 결과를 구조적 형태만 나타내도록 바꾼 것이 AST입니다.

Python은 버전 3.10 부터 PEG parser를 사용합니다. 그 이전에는 LL(1) parser를 사용했습니다. [참조](https://peps.python.org/pep-0617/) 이 포스트에서는 이 parser들을 자세히 설명하지 않겠지만, 둘 모두 context free grammar(CFG)와 비슷하거나 그에 기반합니다. 때문에 Python 코드 역시 AST로 만들어 해석할 수 있습니다.

Python에서는 [ast 라이브러리](https://docs.python.org/3/library/ast.html)를 통해 코드를 ast로 만들어볼 수 있게 해줍니다. 

# 만들어진 AST 노드에 정보를 추가한 새 객체를 만든다

mypy는 이후 과정에서 코드를 구조적으로 해석하기 위해 AST를 만듭니다.

ast 라이브러리로 코드를 파싱하고 나면 트리가 나올텐데요, 이 트리를 `ASTConverter` 라는 클래스로 각 노드를 방문합니다.

## ASTConverter

ASTConverter는 ast 라이브러리로 만든 AST의 각 노드(ast 트리의 구성 요소)를 방문해 새 객체를 만듭니다.  이 클래스는 visitor pattern으로 구현되어 있습니다. Visitor pattern의 일반적인 구현처럼, 각 노드 타입마다 함수가 `visit_ClassDef` 처럼 정의되어있습니다.

- 혹시 아직 visitor pattern에 대해 익숙하지 않으시다면, [refactoring guru의 visitor pattern 소개](https://refactoring.guru/design-patterns/visitor)를 참조하면 좋습니다.

이 함수 안에서 mypy가 이후에 해석하기 편하도록 이름, 전체 이름, 타입 정보 등을 넣어 새로운 클래스로 만들어줍니다.

실제로 살펴보면 이런 형태로 되어있습니다.

```python
class ASTConverter:
    # ...
    def visit_ClassDef(self, n: ast3.ClassDef) -> ClassDef:
        ...
    # ...
    def visit_Call(self, n: Call) -> CallExpr:
        ...
    # ...
```

visit_XXX의 XXX가 ast 라이브러리에서의 타입을 의미하고, 리턴하는 타입이 mypy가 새로 만든 객체의 타입을 의미합니다.

ast의 노드와 mypy가 새로 만든 노드는 의미가 크게 다르지는 않은데, mypy가 새로 만든 객체에는 이후에 해석하기 쉽도록 부가적인 정보가 들어갑니다.

예를 들어 [ast의 Call에는 함수 이름, arg, kwargs만 나타나는데 비해](https://docs.python.org/3/library/ast.html#ast.Call) mypy는 이 호출이 어디서 호출되었는지도 필요하기 때문에 callee, 즉 함수를 호출한 대상도 저장합니다. 

# Wrap up

이번 포스트에서는 mypy가 코드를 해석하기 위해 AST를 만든다는 것을 살펴보았습니다.

그렇다면 mypy는 왜 AST를 필요로 할까요?
그 내용을 다음 포스트([Mypy의 동작 방식: #2-side mypy는 AST가 왜 필요할까?]({% post_url 2023-07-23-mypy-2-1-why-ast %}))에서 살펴보겠습니다.

이 단계에서 AST를 만드는 방법을 살펴보았는데요, 그렇다면 AST를 어떻게 사용할까요?
그 내용을 이후 포스트([Mypy의 동작 방식: #3-side mypy는 AST를 어떻게 사용할까?]({% post_url 2023-07-24-mypy-3-semanal %}))에서 살펴보겠습니다.
