---
title: "Mypy의 동작 방식: #3 의미 분석"
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

[Mypy의 동작 방식: #3 의미 분석(현재 글)]({% post_url 2023-07-24-mypy-3-semanal %})

[Mypy의 동작 방식: #4 타입 체크]({% post_url 2023-07-24-mypy-4-typecheck %})

# Overview

이 글에서는 Mypy의 동작 방식 중 하나인 의미 분석(Semantic Analysis)에 대해 다룹니다.
Mypy는 Python 코드의 타입 체크를 지원하는 정적 타입 검사기입니다.
이를 위해서는 코드를 AST(Abstract Syntax Tree)로 변환하고, 이후에 AST를 분석하여 타입 체크를 수행합니다.
이때 AST를 분석하는 과정에서는 SemanticAnalyzer 클래스를 중심으로 SymbolTable, SymbolTableNode, SymbolNode 등의 객체를 사용하여 변수, 함수, 클래스 등의 이름과 범위를 저장하고 참조합니다.

# 의미 분석?

Semantic analysis는 컴파일러 설계 중 한 단계입니다.
Semantic analysis를 직역하면 의미 분석인데, 코드의 의미를 분석한다고 보면 내용이 통합니다.

컴파일러의 목적은 high-level 언어로 작성된 코드를 기계가 이해할 수 있는 코드로 만들어내는 것입니다.
이 목적을 달성하기 위해서는 AST의 각 노드가 구체적으로 어떤 대상을 가리키는지 이해해야합니다.

예를 들면 이렇습니다.

```python
# a.py
걔 = 두식이()
...
```

```python
# b.py
from a import 걔
응답 = 걔.알지()
```

위와 같은 코드에서 `b.py`의 "걔"가 어떤 대상을 가리키는지는 코드를 구조화한 내용만 보고서는 파악할 수 없습니다.
구체적인 대상을 파악하기 위해서는 다른 파일의 namespace 등을 참조해서 내용을 채워 넣어야합니다.
만약 `a.py` 모듈에 "걔"라는 변수가 "두식이()"를 지칭한다는 사실이 저장되어있다면 `b.py` 모듈에서 이 저장된 정보를 사용해 해석할 수 있습니다.
이 때 변수가 저장되는 자료구조를 "symbol table" 이라고 하고, 변수는 "symbol node"로 저장됩니다.

Mypy의 semantic analysis 단계에서는 변수 등의 정확한 의미를 알아내고 저장해둔 뒤 이후 타입 체크에서 사용할 수 있도록 합니다.
이 단계에서 주로 문법이 맞는지나 타입이 일치하는지 등을 체크합니다.

# 클래스 구조

Mypy의 semantic analysis는 `SemanticAnalyzer` 클래스를 중심으로 진행됩니다.

## SemanticAnalyzer

Semantic analysis를 돌리기 이전 단계에서 mypy는 코드 구조를 나타내는 AST를 얻었습니다. 이후에 타입 체크를 하기 위해서 mypy는 이 단계에서 AST의 각 노드가 구체적으로 어떤 대상을 나타내는지 정보를 저장합니다.

mypy에서는 이 클래스가 visitor pattern으로 구현되어있습니다.
Python의 문법은 고정적이지 않고 이후로도 변경될 가능성이 있습니다. 이는 즉 Python의 문법으로 만든 AST의 형태가 변할 수도 있음을 의미합니다.
의미 분석 역할을 담당하는 `SemanticAnalyzer` 클래스가 이 구조에 의존한다면 변경이 너무 잦을 것 같습니다.

`SemanticAnalyzer`는 visitor pattern의 일반적인 구현과 비슷하게 구현되어있습니다.
각 노드 타입 별로 `visit_XXX` 함수가 정의되어 있습니다.

살펴보면 이런 형태입니다.

```python
class SemanticAnalyzer(...):
    # ...
    def visit_class_def(self, defn: ClassDef) -> None:
        ...
    # ...
    def visit_assignment_stmt(self, stmt: AssignmentStmt) -> None:
        ...
    # ...
```

## SymbolTable

`SymbolTable`은 일종의 namespace 역할을 합니다.

`SemanticAnalyzer`는 모듈마다 정의된 symbol table을 들고있습니다.
함수같은 local scope 에서 정의된 내용은 `locals`라는 변수 안에 따로 저장됩니다.
locals는 list로 정의되어있어서 function scope가 하나씩 들어갈 때마다 이 변수에 scope가 추가되고 나올때마다 scope가 제거됩니다.

Mypy의 semantic analysis는 만들어진 AST 노드들에 이름을 채워넣고, symbol table을 만들고 일부 체크를 하는 단계입니다.
여기서 symbol table은 하나의 namespace입니다.
이 namespace는 파일, 클래스, 함수 단위로 지정됩니다.
이 때 글로벌 변수들은 global namespace에 따로 지정되기도 합니다.

```
SemanticAnalyzer
    globals: SymbolTable
    locals: List[SymbolTable]
```

## SymbolTableNode

`SymbolTable`이라는 dictionary의 값으로 실제로 들어가는건 `SymbolTableNode`입니다.
`SymbolTableNode`는 `SymbolNode`에 정의된 범위를 추가한 것이라고 보셔도 됩니다.

```
SymbolTable
    - SymbolTableNode
        - SymbolNode
        - scope(global, local, member)
    - ...
```

## SymbolNode

`SymbolNode`는 AST 노드를 다르게 표현한 것이기도 하고, 또 그렇기 때문에 코드 조각 하나를 다르게 표현한 것이기도 합니다.
`SemanticAnalyzer`가 코드를 해석하면서 전역 정의를 발견하면 globals에 대상의 이름과 `SymbolNode`를 매핑해둡니다.

# 예시

## a = b

의미 분석의 동작은 예시를 통해 보겠습니다. 미리 알려드리자면 실제로는 순서가 조금 다를 수 있는데, 이해하기 쉽게 재구성했습니다.

이 `a = b` 라는 예시 문장 자체는 `AssignmentStatement`, 그러니까 할당하는 statement에 해당합니다

그럼 `SemanticAnalyzer`가 `visit_assignment_statement` 에서 이 statement를 해석합니다.

이 함수 안에서 `SemanticAnalyzer`가 `a`의 fullname 정보를 해석하는데요, 이 정보가 `SymbolNode`라는 새로운 객체로 감싸져서 `NameExpr`에 할당됩니다.
이 때 만들어지는 `SymbolNode`는 구체적으로는 변수를 나타내는 `Var` 객체이겠습니다.
이 과정에서 `NameExpr`이 전역 변수인지 지역 변수인지 같은 다른 정보도 할당됩니다.

여기까지 오면 이렇게 표현할 수 있겠습니다.

```
a -> NameExpr
    - Var(name='a', fullname='some.module.a', ...)
b -> NameExpr
    - Var(name='b', fullname='some.module.b', ...)
```

`SemanticAnalyzer`가 의미 분석을 해서 fullname같은 정보를 얻은건 좋은데, 효율적으로 하려면 이미 해석한 정보는 넣어둬야겠죠?
그 정보가 `SymbolTable`에 들어갑니다. `SymbolTable`은 이름과 `SymbolNode`를 매핑한 테이블이에요.
이게 있어야 같은 모듈 내에서도, 아니면 다른 모듈을 해석할 때에도 현재 모듈의 변수에 대한 레퍼런스를 제공할 수 있습니다.

이 SymbolTable은 하나의 namespace, 예를 들어서 클래스 범위나 함수 범위마다 하나씩 있다고 보시면 됩니다.

그런데 위에서 보았듯 `SymbolTable`이 `SymbolNode`를 직접 매핑하지는 않구요, `SymbolTableNode`라는 객체와 매핑됩니다.
이 `SymbolTableNode`가 나타내는건 `SymbolNode`와 그것이 정의된 범위입니다.

왜냐면 저장할 때 전역 정의가 된 `a`와 함수 안에서 지역 정의가 된 `a`가 있을 때 둘은 같은 모양으로 나타납니다.
그래서 `SymbolTableNode`라는 객체가 대상이 정의된 범위도 포함하면서 `SymbolNode`를 참조하는 형태로 생성됩니다.

예를 들어, 이런 코드가 있을 때
```python
a = 1
def f():
    a = 2
```

`a = 1`에서 `a`는 전역 변수이고, `a = 2`에서 `a`는 함수 `f`의 지역 변수입니다.
이 둘은 이름이 같아서 `SymbolNode`로는 구분할 수 없습니다.
그래서 `SymbolTableNode`라는 객체를 만들어서 `SymbolNode`와 `scope`라는 정보를 함께 저장합니다.
`scope`는 `SymbolNode`가 정의된 범위를 나타내는 정보입니다.

표현해보면 이렇습니다.
```
SymbolTable(globals)
    a -> SymbolTableNode
        - SymbolNode
            - Var(name='a', fullname='some.module.a', ...)
        - scope: global
SymbolTable(locals)
    a -> SymbolTableNode
        - SymbolNode
            - Var(name='a', fullname='some.module.a', ...)
        - scope: local
```

이것을 `SymbolTable`에 할당하면 이후에 `SemanticAnalyzer`가 다른 대상을 해석할 때 변수 `a`를 참조할 수 있게 됩니다.

여기까지는 이렇게 표현할 수 있겠습니다.

```
SemanticAnalyzer
    SymbolTable
        a -> SymbolTableNode
            - SymbolNode
                - Var(name='a', fullname='some.module.a', ...)
            - scope: global
        b -> SymbolTableNode
            - SymbolNode
                - Var(name='b', fullname='some.module.b', ...)
            - scope: global
```

# Wrap up

이번 포스트에서는 mypy의 semantic analysis가 어떻게 동작하는지 살펴봤습니다.

그렇다면 이 정보를 가지고 mypy는 어떻게 타입 체크를 할까요?

다음 포스트([Mypy의 동작 방식: #4 타입 체크]({% post_url 2023-07-24-mypy-4-typecheck %}))에서는 이 semantic analysis의 결과를 가지고 타입 체크를 하는 방법을 살펴보겠습니다.
