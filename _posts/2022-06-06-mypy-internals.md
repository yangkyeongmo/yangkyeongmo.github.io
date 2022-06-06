---
title: "Mypy internals"
date: 2022-06-06 13:25
categories: dev
tags: ["python"]
---

mypy가 타입 체크를 하는 과정(중 일부)에 대해 코드를 확인해 정리한 내용입니다.

# 해석 과정 개요

1. 파일/디렉토리를 읽는다.
2. dependency graph를 만든다.
3. graph를 scc로 구분한다.
4. scc를 dependency 순서로 topsort한다. (root를 맨 나중에)
5. 각 scc마다 아래 동작을 한다.
    1. stale한 scc를 만났을 때 fresh한 scc를 미리 처리한다.
    2. stale한 scc에 대해서 아래 동작을 한다.
        1. 파일을 파싱한다. (consistency check)
        2. semantic analysis를 돌린다.
        3. 타입 체크를 한다.

# dependency graph를 만든다.

이 단계에서는 BuildSource를 State로 변환해 Graph에 저장한다. BuildSource 는 모듈, State 는 모듈 + 상태값으로 볼 수 있다. Graph는 모듈 이름과 State를 매핑한 딕셔너리이다. 아래 과정을 통해 Graph를 초기화한다.

1. Graph를 {모듈 이름: State} 가 되도록 구성한다.
2. 각 State에 모듈이 가지고있던 의존성을 추가한다.
    1. 모듈의 anscestor, direct dependency에 대해서 아래 동작을 한다. Indirect dependency는 캐싱된 후 변경되면 제대로 추론할 수 없을 가능성이 있어 배제함.
        1. 모듈을 찾을 수 없거나 이미 추가되었으면 다음 모듈로 넘어간다.
        2. 해당 모듈을 State로 만든다.
            1. 해당 모듈과 원본 모듈과의 관계가 State에 기록됨.
        3. Graph에 추가한다.
        4. 2번에서 처리할 모듈들의 리스트의 맨 뒤에 만들어진 State를 포함시킨다.
            1. dependency 처리하면 그 dependency에 대해서 다시 동일한 동작 한다는 의미임. BFS 접근.

이 단계가 완료되면 Graph 안에 대상 파일들이 들어가있는 상태가 된다.

# graph를 scc로 구분한다.

코드나 문서에 의도가 명확히 나와있지는 않지만, 의존성 그래프를 SCC로 재구성하는 것은 순환 참조를 잘 다루기 위함인듯 하다. 위 그림에서도 드러나듯이 순환이 있는 그래프를 SCC들로 구분하고, 각 SCC를 노드 하나로 보면 전체 그래프를 DAG(Directed Acyclic Graph)이 되어 비교적 다루기 쉬워진다.

## SCC?

![SCC 예시 그림](/assets/img/mypy-internals/scc.png "SCC 예시 그림")

> A strongly connected subgraph, S, of a directed graph, D, such that no vertex of D can be added to S and it still be strongly connected. Informally, a maximal subgraph in which every vertex is reachable from every other vertex. [ref](https://xlinux.nist.gov/dads/HTML/stronglyConnectedCompo.html)

# scc를 dependency 순서로 topsort한다.

제일 먼저 처리해야할 노드를 먼저 처리하기 위해서 그래프를 의존성을 기준으로 위상정렬한다. 제일 먼저 처리해야할 노드를 leaf 노드라고 했을 때, leaf에서 root 방향으로 처리하면 다음 단계에서 알아야할 참조값들이 이번 단계에서 드러나게 된다. 이 때 leaf 노드는 더이상 fan-out이 없는 노드, 예를 들어 typing 같은 기본 모듈이고 root 노드는 fan-in이 없는 노드, 예를 들어 application 에서 작성한 모듈이라고 생각해두자.

## 팁

### 처리 순서 확인하기

`--verbose` 옵션을 키면 어떤 SCC가 어떤 순서로 처리되는지 확인할 수 있음.

### 캐싱하지 않기

`--cache-dir=/dev/null` 옵션으로 캐싱을 사용하지 않도록 해야 매번 확인할 수 있음.

#### 예시

```
> mypy ~/src/buzzvil/adserver/action/constants.py --verbose --cache-dir=/dev/null
LOG:  Found 6 SCCs; largest has 34 nodes
LOG:  Processing SCC of size 34 (typing_extensions typing types sys subprocess posixpath pathlib os.path os mmap io importlib.metadata importlib.machinery importlib.abc importlib genericpath email.policy email.message email.header email.errors email.contentmanager email.charset email ctypes contextlib collections.abc collections codecs array abc _typeshed _collections_abc _ast builtins) as inherently stale
LOG:  Processing SCC singleton (enum) as inherently stale
LOG:  Processing SCC singleton (common) as inherently stale
LOG:  Processing SCC singleton (action) as inherently stale
LOG:  Processing SCC singleton (common.constants) as inherently stale
LOG:  Processing SCC singleton (action.constants) as inherently stale
```

### 생성된 그래프 확인하기

`--dump_graph` 옵션을 사용하면 이 단계까지 거쳐 만들어진 의존성 그래프를 확인할 수 있다!

#### 예시

```
> mypy action/constants.py --cache-dir=/dev/null --dump-graph
[["n0", 101825, ["_ast", "typing_extensions", "types", "ast", "abc", "typing", "_typeshed", "builtins", "sys", "_weakrefset", "mmap", "array", "collections"],
     {"_ast": 5288, "typing_extensions": 2910, "types": 5356, "ast": 1155, "abc": 1155, "typing": 17947, "_typeshed": 4464, "builtins": 48266, "sys": 3524, "_weakrefset": 2181, "mmap": 1797, "array": 3023, "collections": 4759},
     {}],
 ["n1", 43, ["common"],
     {"common": 43},
     {}],
 ["n2", 76933, ["common.constants"],
     {"common.constants": 76933},
     {"n0": 5}],
 ["n3", 0, ["action"],
     {"action": 0},
     {}],
 ["n4", 415645, ["action.constants"],
     {"action.constants": 415645},
     {"n0": 5, "n2": 5}]
]
```

#### 해석

- Leaf 노드가 n0 노드이다. ast, abc, typing, sys 같은 모듈들이 순환참조를 하고있기 때문에 한 SCC 안에 들어있다.
- 그 아래로 의존성 순서대로 모듈들이 이어진다. 각 모듈에 순환참조가 없기 때문에 SCC 안에 모듈이 하나씩만 있다.
- Root 노드가 맨 아래의 n4 노드이다. 대상 모듈인 action.constants 가 위치해있다.
- 맨 뒤의 {"n0": 5, "n2": 5} 는 이 노드의 의존성을 의미한다. n0, n2 노드에 의존성이 있다. 숫자는 priority를 의미하는데 5는 from X import Y 같은 형태로 import된 것을 의미한다.
- priority 는 자세히 확인하진 않았지만 SCC 내에서의 처리 순서를 결정하는데 사용하는 정보인듯 하다. 

# stale한 scc를 만났을 때 fresh한 scc를 미리 처리한다.

## stale? fresh?

mypy는 이전에 처리한 내용을 캐싱해둔다. 새로 실행할 때 캐싱이 되어있다고 확인된 모듈은 fresh, 아닌 모듈은 stale로 구분한다.

scc 전체가 fresh하면 캐시에서 정보를 가져오고(=”처리”), 아닌 scc는 해석 단계로 넘어간다.

## 팁

캐시가 .mypy_cache에 json 파일 형태로 저장되어있다. State에 들어가는 내용이 저장되어있음.

### 예시

아래 예시를 보면 mypy가 해석한 내용을 대략 확인해볼 수 있다.

```
{
	".class": "MypyFile",
	"_fullname": "action.constants",
	"future_import_flags": [],
	"is_partial_stub_package": false,
	"is_stub": false,
	"names": {
		".class": "SymbolTable",
			"CPL_CHECK_EXCLUDED_FB_PAGES": {
				".class": "SymbolTableNode",
				"kind": "Gdef",
				"node": {
					".class": "Var",
					"flags": ["has_explicit_value"],
					"fullname": "action.constants.CPL_CHECK_EXCLUDED_FB_PAGES",
					"name": "CPL_CHECK_EXCLUDED_FB_PAGES",
					"type": {".class": "Instance", "args": ["builtins.int"], "type_ref": "builtins.list"}}},
	...
}
```

# 파일을 파싱한다.

파일 내용을 가져와서 AST 노드 트리로 만드는 과정임. ast 라이브러리가 파싱해준다.

## AST?

![AST 예시 그림](/assets/img/mypy-internals/ast-example.png)

> In computer science, an abstract syntax tree (AST), or just syntax tree, is a tree representation of the abstract syntactic structure of text (often source code) written in a formal language. Each node of the tree denotes a construct occurring in the text. [ref](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

## ast 라이브러리? 

> ast 모듈은 파이썬 응용 프로그램이 파이썬 추상 구문 문법의 트리를 처리하는 데 도움을 줍니다.
ast.PyCF_ONLY_AST를 플래그로 compile() 내장 함수에 전달하거나, 이 모듈에서 제공된 parse() 도우미를 사용하여 추상 구문 트리를 생성할 수 있습니다. 결과는 클래스가 모두 ast.AST에서 상속되는 객체들의 트리가 됩니다. 내장 compile() 함수를 사용하여 추상 구문 트리를 파이썬 코드 객체로 컴파일할 수 있습니다. [ref](https://docs.python.org/ko/3/library/ast.html)

```
Python 3.10.4 (main, Apr  8 2022, 17:35:13) [GCC 9.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import ast
>>> p = ast.parse('print("hello, buzzvil!")')
>>> print(ast.dump(p, indent=4))
Module(
    body=[
        Expr(
            value=Call(
                func=Name(id='print', ctx=Load()),
                args=[
                    Constant(value='hello, buzzvil!')],
                keywords=[]))],
    type_ignores=[])
```

## 단계 설명

여기서 타입체크나 의미분석을 하는건 아니고 AST 노드를 mypy에서 지정한 클래스로 변환하기 위한 적절한 동작을 한다.

예를 들어 이런 식.

```python
def visit_Return(self, n: ast3.Return) -> ReturnStmt:
    node = ReturnStmt(self.visit(n.value))
    return self.set_line(node, n)
```

여기까지 오면 대상 모듈에 대해서 mypy 가 알아들을 수 있는 형태의 AST가 만들어진 상태가 된다.

# semantic analysis

mypy에서 Semantic analysis는 크게 보자면 SymbolTable에 SymbolTableNode을 채워넣는 과정이다. 주요하게 참여하는 객체들은 그림과 같다. 편의상 관계의 대부분이 생략되었음.

![Semantic Analysis object relation](/assets/img/mypy-internals/semantic-analysis.png)

## 해석

### 객체들

- State: 분석 대상이 되는 SCC의 모듈 하나.
- BuildManager : 전 과정에서 상태값을 들고있는 객체.
- SemanticAnalyzer : semantic analysis 담당. Visitor 패턴.
- SymbolTable : namespace - SymbolTableNode 의 매핑.
- SymbolTableNode : AST 노드에 해당하는 SymbolNode가 어떤 종류인지 지정. 같은 노드가 global, member, local로 정의되었을 수 있어서 종류를 나눈다.
- SymbolNode: mypy 버전 AST 노드라고 생각하면 유사함.
- MypyFile : 파일 하나. AST에서 module과 비슷.
- TypeInfo : 클래스 정의와 1:1 대응되는 타입 정의 묶음.
### 분석 과정
- State는 분석 대상이 되는 모듈을 의미한다. 위에서 서술되었던 대로, State는 모듈 + 상태값이라고 보면 편하다.
- State는 “tree” 라는 SymbolNode 를 들고있다. “tree”는 모듈을 나타내는 AST의 root를 의미한다.
- State는 BuildManager를 들고있다. BuildManager 는 빌드 전 과정에서 사용해야할 상태값들을 들고있다.
- BuildManager는 사용해야할 SemanticAnalyzer 를 참조하고 있다.
- SemanticAnalyzer는 “globals” 라는 전역 SymbolTable과, 함수 별로 정의되는 SymbolTable 의 리스트인 “locals”, 현재 어떤 타입의 범위에 들어와있는지를 나타내는 “type” 이라는 TypeInfo를 들고있다.
- SymbolTable은 특정 네임스페이스를 나타내는 딕셔너리이다. 이름과 SymbolTableNode를 매핑한다. 예를 들어 c 라는 constant가 정의되었다고 한다면 SymbolTable에 {'c': SomeSymbolTableNode} 같은 형태로 저장된다.

SemanticAnalyzer가 State의 tree를 visit 하면서 분석 과정이 시작된다. SemanticAnalyzer가 Visitor 패턴으로 되어있기 때문에, 특정 타입의 노드를 어떻게 처리하는지 보고싶다면 visit_~~~ 를 찾아보면 된다.

각 타입의 노드가 각각의 로직을 따르지만 결국은 python에서 정의하는 것과 크게 다르지 않다. 구체적으로 하나씩 살펴보기에는 많으니 함수 하나에서 시작하여 대략 어떻게 되는지 확인하자.

- e.g. x = y 라는 statement가 있으면 mypy는 이 statement를 어떻게 처리할까? (설명 WIP)
    - [mypy code](https://github.com/python/mypy/blob/master/mypy/semanal.py#L2055)

이 과정이 끝나면 분석 대상의 SymbolTable이 채워진다.

# 타입 체크

expression AST 노드를 타입과 매핑하는 역할. 각 subexpression AST 노드에 대해서 type을 추론한다. 아래는 타입 체크 단계에서 객체간 관계로 편의상 대부분 생략되었음.

![Type check object relation](/assets/img/mypy-internals/type-check.png)

## 해석

### 객체들

- TypeChecker: 타입 체크 담당. Visitor.
- ConditionalTypeBinder: Conditional type을 추적함. 
- Frame: 실행 시점을 의미함. 현재 실행 시점에 알아둬야할 타입들을 저장.
- ExpressionChecker: 노드가 들고있는 expression 의 타입 체크를 담당. Visitor.
- PatternChecker: 패턴을 확인해야할 경우 타입 체크 담당. Visitor.
- Scope: 현재 처리 중인 범위를 저장.
- PartialTypeScope: list() 같이 내부 타입이 아직 정해지지 않은 타입이나 None으로 지정된 타입을 PartialType 이라고 함.

### 분석 과정

- State는 이전 단계에서 사용한 객체와 동일한 것을 의미한다.
- TypeChecker가 SymbolNode 타입의 노드에 대해서 타입 검사를 수행한다.
- 노드가 expression을 포함할 경우 ExpressionChecker가 그에 대해 타임 검사를 수행한다. 예를 들어 AssigmentStmt(e.g. x=y is None)의 경우 rvalue가 expression이다.
- PatternChecker는 패턴 매칭에 대해 타입 검사를 수행한다. 아직은 match-case 외에 사용처가 없다.
- Isinstance 등 특정 시점에 변수의 타입이 결정될 때가 있다. ConditionalTypeBinder는 변수의 타입이 분기마다 달라질 경우에 대한 타입 정보를 저장하고 있다.
- ConditionalTypeBinder는 Frame을 stack 안에 여러 개 들고있다.
- Frame은 특정 실행 시점을 의미한다. Frame에는 이름 대 타입 매핑이 저장되어있다. 예를 들어 if isinstance(x, Type) 분기로 내려간 경우, 현재 실행 시점을 의미하는 Frame에는 x에 대해서 Type 이 저장되어있다.
- Scope는 현재 어떤 범위에 있는지의 정보를 담고있다. 특정 모듈을 처리중인 경우 module에 현재 모듈 이름이 들어가는 방식이다.

타입 체크도 각각 다르게 접근하기 때문에 그 가짓수가 많아 일반화하거나 하나씩 살펴보기가 쉽지 않다. 예시 몇 개만 추려서 보되, 아래 궁금한 점에 초점을 맞춰 살펴보자.

1. x = y 라는 statement가 있으면 타입 체크를 어떻게 할까?(설명 WIP)
    - [mypy code](https://github.com/python/mypy/blob/master/mypy/checker.py#L2210)
2. if isinstance(variable, Type): 아래에서는 variable의 타입을 무조건 Type 으로 생각한다. 어떻게 하는걸까?(설명 WIP)
    - [mypy code](https://github.com/python/mypy/blob/master/mypy/checker.py#L3592)
3. 외부 라이브러리에서 정의한 타입은 어떻게 가져다 쓰는걸까?(설명 WIP)
    - > … The answer is that mypy comes bundled with stub files from the the typeshed project, which contains stub files for the Python builtins, the standard library, and selected third-party packages.
        - [mypy wiki](https://mypy.readthedocs.io/en/stable/getting_started.html#stubs-files-and-typeshed)

# Ideas

- 순환참조를 확인하기 위해 --dump-graph 옵션을 활용할 수 있겠다.
- 참조한 값의 정확한 정의를 확인해야할 때 Semantic analysis 단계에서 채운 SymbolTable에 저장된 내용을 사용할 수 있겠다.
