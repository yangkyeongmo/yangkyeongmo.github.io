---
title: "Mypy의 동작 방식: #4 타입 체크"
date: 2023-07-24 15:00
categories: dev
tags: ["python"]
---

# Introduction

이 포스트에서는 대규모 파이썬 프로젝트에서 특정 함수의 호출자를 찾는 [mypyind](https://github.com/yangkyeongmo/mypyind)를 작성하면서 mypy에 대해 부차적으로 공부했던 내용들을 정리했습니다.

이 내용은 [pycon 발표]({% post_url 2023-07-27-i-present-on-pycon-2023 %})의 덧붙인 설명입니다.

이 포스트는 아래 포스트들로 연결됩니다.

[Mypy의 동작 방식: #1 진행 전 최적화]({% post_url 2023-07-18-mypy-1-pre-optimization %})

[Mypy의 동작 방식: #2 파일 파싱]({% post_url 2023-07-23-mypy-2-parsing %})

[Mypy의 동작 방식: #2-side mypy는 AST가 왜 필요할까?]({% post_url 2023-07-23-mypy-2-1-why-ast %})

[Mypy의 동작 방식: #3 의미 분석]({% post_url 2023-07-24-mypy-3-semanal %})

[Mypy의 동작 방식: #4 타입 체크(현재 글)]({% post_url 2023-07-24-mypy-4-typecheck %})

# Overview

이전 포스트([Mypy의 동작 방식: #3 의미 분석]{% post_url 2023-07-24-mypy-3-semanal %})까지는 의미 분석 단계에 대해서 살펴보았습니다.
이 단계가 끝나면 이제 타입 체크를 할 차례입니다.
타입 체크는 의미 분석 단계에서 정의된 타입들을 이용해서 타입 체크를 수행합니다.
이 과정에서도 AST를 이용합니다. 
클래스 구조 역시 의미 분석 단계에서와 비슷하게 visitor pattern을 이용합니다.

# 클래스 구조

타입 체크 과정 역시 의미 분석 단계와 비슷하게 AST를 이용합니다.
이 객체에도 이전의 의미 분석 때의 객체와 동일하게 각 노드 타입에 대해서 해석 과정을 정의하고 있습니다.

주요하게 사용되는 객체는 `TypeChecker` 및 연관된 객체들과 `SubtypeVisitor`가 있습니다.
각 클래스는 AST를 해석하므로 이 클래스들 또한 visitor pattern을 이용합니다.
각 클래스는 아래와 같은 역할을 합니다.

## TypeChecker

`TypeChecker`는 statement에 대한 체크를 하고, 그 외에 특화된 타입 체크는 다른 객체에게 위임합니다.
파이썬에서 statement는 `a + b`와 같은 산술 연산이나 `if a: ...`와 같은 if 문 등을 의미합니다.
Statement 안의 구성은 expression이나 statement이 될 수 있습니다.

`TypeChecker`는 타입 체크를 도와줄 아래의 객체들을 가지고 있습니다.
아래에서 살펴볼 객체들은 모두 `TypeChecker`의 멤버 변수로 선언되어있습니다.

```
TypeChecker
  - expr_checker: ExpressionChecker
  - binder: ConditionalTypeBinder
  - pattern_checker: PatternChecker
  - subtype_visitor: SubtypeVisitor
```

### ExpressionChecker

`ExpressionChecker`는 이름 그대로 expression에 대한 타입 체크를 담당합니다.
파이썬에서 expression은 `a()`와 같은 함수 호출이나 `1`과 같은 리터럴, `a`와 같은 변수 등을 의미합니다.
`TypeChecker`가 statement를 해석할 때, statement 안에 expression이 나오면 이 객체를 호출합니다.

### ConditionalTypeBinder

`ConditionalTypeBinder`는 같은 정의가 범위에 따라서 다르게 해석될 수 있는 경우의 처리를 도와주는 객체입니다.
혹시 파이썬에서 frame object로 콜 스택을 관리한다는 것을 아신다면 이 클래스의 역할과 비슷합니다.

어떤 범위에 들어가면 이 바인더가 하나 새로 생깁니다.
이 어떤 범위는 if 문이나 while 문 등의 블록, 클래스나 함수 정의 등이 될 수 있습니다.
if 문에서 isinstance 호출할 때처럼 조건부 타입이 지정되면 타입 정의가 스택에 하나씩 쌓입니다.

binder는 내부적으로 Frame 의 리스트를 들고있습니다.
이 Frame은 conditional type이 필요한 context에 들어가면 하나씩 추가됩니다.

Frame은 어떤 대상을 해석하는 시각이라고 비유할 수 있겠습니다.
어떤 시각에서 해석했던 변수의 타입이 `Frame`에 저장되고, 다음 시각에서 해석한 같은 변수의 타입이 다음 `Frame`에 저장될 수 있습니다.
타입 체크를 할 때는 이 리스트의 제일 마지막 `Frame`을 활용합니다.
Conditional type check가 필요한 경우가 전반적으로 많이 있기 때문에 binder가 많이 활용되는데, `if` statement 안에서도 binder를 활용합니다.

이런 코드가 있을 때,
```python
if isintance(a, A):
    if isinstance(a, SubA):
        ...
    if isintance(a, SubB):
        ...
```

표현해보면 이렇습니다.
두 번째 블록에 진입하면 이렇게 나타나고,
```
Frame 1: a: A
Frame 2: a: SubA
```
두 번째 if isinstance를 벗어나 세 번째 블록에 진입하면 이렇게 나타나겠습니다.
```
Frame 1: a: A
Frame 2: a: SubB
```

현실 세계로 비유해보면 종이를 묶는 바인더를 생각하시면 됩니다.
바인더에 종이를 넣으면 종이가 바인더에 쌓이고, 종이를 빼면 종이가 바인더에서 빠지는 것처럼요.
이 종이가 프레임에 해당합니다.
현재의 타입 정의를 확인하려면 제일 마지막 종이를 확인하면 되고, 이 종이를 빼면 이전 종이에 적힌 타입 정의를 확인할 수 있습니다.

### PatternChecker

`PatternChecker`는 이름 그대로 패턴에 대한 타입을 체크합니다.
여기서 패턴이라는건 match statement 안에 나오는 패턴을 의미합니다.
사실 저는 match 자체를 자주 쓰지 않아서 깊게 보지 않았습니다만, match statement가 나오면 이 객체가 호출됩니다.

### SubtypeVisitor

`SubtypeVisitor`는 좌항과 우항을 받아서 좌항이 우항의 subtype인지를 확인하는 객체입니다.

의미 분석 단계에서 type이 정의되어있다면 `SymbolNode`에 type 정보가 들어가 있는데요, 이 type 정보는 Type 클래스로 되어있습니다.

Python의 type을 떠올려보시면 저희는 type variable을 정의할 수도 있고, alias를 정의할 수도 있습니다.

예를 들어 이런 타입 정의가 있을 때,
```python
T = TypeVar('T')
Alias = Union[int, str]
```

그래프로 표현해보면 아래처럼 표현할 수 있습니다.
```
TypeVar
    T
Alias
    Union
        int
        str
```

이처럼 Type도 어떤 구조를 형성할 수 있습니다.
이 구조를 모두 방문하기 위해서 `SubtypeVisitor`도 이름처럼 visitor 패턴이 적용되어있습니다.
대신 이 visitor 패턴은 AST를 순회하는 것이 아니라 type 구조를 순회합니다.

Python에서는 int나 str 같은 빌트인 타입들도 저희가 직접 정의하는 클래스와 마찬가지로 객체로 구현되어 있습니다.
때문에 타입 체크를 할 때 이런 빌트인 타입들을 포함한 대부분의 타입들이 Instance 타입으로 지정됩니다.

# 예시

## a: int = b

예시로 `a: int = b` 라는 문장을 보겠습니다.

AST 노드로 보면 아래와 같습니다.
```
AssignmentStatement
    NameExpression
        Var
            a
    NameExpression
        Var
            b
```

이 문장은 a에 b를 할당하는 문장입니다.
a가 정수 타입이라는 정의가 되어있는데, b가 a의 타입과 호환되는지를 체크해야합니다.

a라는 좌항은 `NameExpression`이고, 여기서는 a라는 이름을 가진 변수를 의미합니다.
b라는 우항도 `NameExpression`이고, 여기서는 b라는 이름을 가진 변수를 의미합니다.
b에는 아직 타입이 정의되어있지 않았을 수 있습니다.

a라는 좌항은 이미 정수 타입이라는 정의가 되어있는데, 이 정의는 `SymbolNode`라는 객체에 들어있습니다.
`SymbolNode`는 의미 분석 단계에서 만들어지는데요, 이 객체는 이름과 타입을 가지고 있습니다.
이 타입은 Type라는 클래스로 되어있는데, 이 클래스는 `TypeChecker`에서 사용하는 클래스입니다.

파이썬에서는 기본 자료형도 객체로 되어있다보니까, 여기서는 Instance라는 타입에 정수형 관련 정보를 넣는 식으로 할당합니다.

잠깐 `TypeChecker`의 클래스 구조를 다시 살펴보겠습니다.
```
TypeChecker
    - expr_checker: ExpressionChecker
    - subtype_visitor: SubtypeVisitor
    ...
```

`TypeChecker`는 의미 분석 때와 비슷하게 AST를 순회합니다.
`TypeChecker`는 visit_assignment_stmt 함수로 진입합니다.
대신 여기서는 좌항과 우항의 타입이 무엇인지를 알아냅니다.

그런데 이 `TypeChecker`는 statement의 해석에만 관여하고 좌항과 우항의 NameExpr의 해석은 `ExpressionChecker`를 사용합니다.
`ExpressionChecker`는 visit_name_expr 함수로 진입합니다.
이 과정에서 b의 타입을 확인하고 할당합니다.

이제 좌항과 우항의 타입이 무엇인지를 알아내었습니다.
`SubtypeVisitor`를 통해 좌항이 우항의 subtype인지, 그래서 타입이 적절한지 확인합니다.

이번에는 `SubtypeVisitor`가 각 타입 객체를 받습니다.
좌항의 타입은 변수 a에 할당했던 Instance 객체이고, 우항의 타입은 변수 b에 할당된 타입일텐데 이 타입은 Instance 객체일 확률이 높겠습니다.

일단 우항도 int 타입이라고 가정해보겠습니다.
그러면 타입을 이렇게 표현할 수 있겠습니다.
```
a: Instance
    base: int
b: Instance
    base: int
```

변수 a의 타입이 Instance 타입이므로 `SubtypeVisitor`의 `visit_Instance` 함수에서 subtype 체크를 합니다.

`visit_Instance`를 한 단계 디테일하게 보자면 여기서는 좌항의 base 타입들이 우항의 타입과 fullname이 일치하는 것이 있는지 확인합니다.

이 때 타입이 정확히 동일한지가 아니라 fullname이 일치하는 것이 있는지 확인합니다.
이렇게 되면 좌항이 int가 아니고 object 타입이어도 True입니다.
이렇게 되면 좌항이 우항의 subtype이라고 판단합니다.

그렇다면 `TypeChecker`가 여기서는 true를 전달받을텐데요, 이렇게 되면 아무런 일도 일어나지 않습니다.

그렇다면 이런 케이스에도 true를 반환받을까요?
```
a: Instance
    base: int
b: Instance
    base: object
```

이 경우에도 true를 반환받습니다.
이 경우에는 좌항이 int이고 int의 base 타입이 object이므로 우항과 fullname이 일치합니다.

그럼 우항이 str일때는 어떨까요?
```
a: Instance
    base: int
b: Instance
    base: str
```

이 때는 좌항의 int도 int의 base 타입인 object도 str의 subtype이 아니므로 false를 반환받습니다.

false를 전달받았다면, 이 때는 mypy에서 알럿이 발생합니다.

## if isinstance

mypy는 if isinstance로 어떤 변수가 특정 타입이라고 가정하도록 하면 진짜 그 타입으로 가정하고 해석합니다.

예를 들어 이런 코드가 있다면,
```python
if isinstance(a, int):
    a = 1
```
위 블록 안에서 mypy는 a가 int 타입이라고 가정하고 해석합니다.

이 가정을 어떻게 하는지 알아보겠습니다.

`TypeChecker`는 위에서 보았듯 conditional type을 저장하는 conditional type binder가 있습니다.

`TypeChecker`가 if statement를 방문하면 isinstance가 있는지를 확인합니다.
isinstance가 있다면 어떤 expression이 어떤 타입으로 정의되었다는 정보를 만듭니다.
이제 if block을 방문하기 전에 frame을 하나 새로 만들고 여기에 업데이트된 타입 정보를 집어넣습니다.

표현해보면 이렇습니다.
```
...
Frame N: a: int
```

마지막 frame이 가장 현재 맥락에 적절한 정보를 들고있습니다.
`TypeChecker`는 타입을 체크할 때 이 마지막 frame을 활용해서 타입을 체크합니다.

# Wrap up

이렇게 mypy가 파이썬 코드의 타입을 해석하는 과정을 설명해보았습니다.
`TypeChecker`, `ExpressionChecker`, `ConditionalTypeBinder`, `PatternChecker`, `SubtypeVisitor` 등 다양한 객체들이 사용되며, 이들은 visitor 패턴을 사용하여 구현되어 있습니다.
이러한 객체들을 통해 mypy는 파이썬 코드의 타입을 정확하게 체크하고, 타입 에러를 미리 방지할 수 있습니다.
