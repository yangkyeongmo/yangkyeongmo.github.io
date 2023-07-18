---
title: "Mypy의 동작 방식: #1 진행 전 최적화"
date: 2023-07-18 23:00
categories: dev
tags: ["python"]
---

# Overview

Mypy는 타입 체크 과정에 들어가기 전 각 모듈을 해석할 순서를 결정하기 위해 진행 전 최적화를 합니다.

아래 과정으로 요약됩니다.

1. 순환 참조 해결
1. 위상 정렬
1. 캐시 활용

# 순환 참조

먼저 mypy가 각 파일을 효율적으로 처리하려면 순환 참조를 해결해야 합니다. 하지만 순환 참조라니 쉽게 발생하지 않을것 같다는 생각이 먼저 듭니다. 순환 참조가 발생하는 코드를 실행하면 에러가 발생하기도 합니다.

하지만 실제로는 발생하기도 하고, mypy는 순환 참조가 발생한다면 이에 대처할 수 있어야 합니다. 개인적인 의견으로는 mypy는 타입 체크를 하기 위한 툴이지 스크립트를 실행하기 위한 도구가 아니기 때문에 순환 참조를 신경쓰지 않아야할듯 합니다. 순환 참조가 발생하든 말든 해석 대상이 되는 파일이 필요로 하는 타입들을 가져오기 위해서 모든 의미를 파악해야 합니다.

mypy는 순환 참조를 해결하기 위해서 Strongly Connected Component를 활용합니다.

## Strongly Connected Component

![Strongly Connected Component](/assets/img/2023-07-18-mypy-1-pre-optimization/scc.png)

Strongly Connected Component, 혹은 SCC는 directed graph에서 순환 관계가 발생하는 노드들을 하나로 묶은 것입니다.
구체적으로는, 한 노드에서 다시 자기 자신으로 돌아올 수 있다면 SCC의 구성 요소가 될 수 있습니다.
SCC 안의 모든 노드는 각 노드에서 시작해서 다른 모든 노드에 도착할 수 있습니다.
즉 노드 A에서 B로도 도착할 수 있어야하고, B에서 시작해서 A로도 도착할 수 있어야 합니다.
Trivial하게, 노드 하나짜리 그래프는 SCC입니다.

SCC의 좋은 특성은 내부적으로 순환이 발생하는 그래프를 비순환 그래프처럼 만들 수 있다는 것입니다.
순환이 발생하는 그래프의 내부에서 순환이 발생하는 부분들만 SCC로 바꾸고, 하나의 SCC를 하나의 노드라고 생각해봅시다.
그럼 SCC만으로 구성된 그래프는 순환 관계가 생략되었기 때문에 비순환 그래프가 됩니다.
순환 관계에 대해서는 노드 안에서 알아서 처리해주면 됩니다.
혹시나 어떤 그래프가 strongly connected 인지 테스트하는 알고리즘의 시간복잡도가 궁금하시다면 Linear time, O(V+E) 안에 strong connectivity를 테스트할 수 있는 알고리즘이 알려져있습니다.

SCC를 활용해서 전체 그래프를 비순환 그래프로 만들면 이제 순환 참조를 해결할 수 있게 되었습니다. 각 SCC의 구성요소를 해석하고 다음 SCC로 넘어가는 방식으로 하면 모든 파일을 순환 참조 걱정 없이 해석할 수 있게 됩니다.

## Code

코드에서 보면(작성일 기준), mypy가 build에서 시작해 process_graph로 들어갈 때 아래와 같은 내용을 실행합니다.

```python
def process_graph(graph: Graph, manager: BuildManager) -> None:
    """Process everything in dependency order."""
    sccs = sorted_components(graph)
    ...
```

`sorted_components`는 이렇게 구성되어있고...

```python
def sorted_components(
    graph: Graph, vertices: AbstractSet[str] | None = None, pri_max: int = PRI_ALL
) -> list[AbstractSet[str]]:
    ...
    sccs = list(strongly_connected_components(vertices, edges))
    ...
```

SCC를 생성하는 `strongly_connected_components` 에서 SCC를 생성하는데, https://code.activestate.com/recipes/578507/ 를 참조한다고 합니다. [Github](https://github.com/python/mypy/blob/master/mypy/graph_utils.py#L10)

# 위상 정렬

mypy의 최종 목표는 주어진 코드를 해석해서 타입 체크를 하는 것입니다.

일반적으로 저희가 사용하는 코드는 import가 있을텐데요, import로 가져온 코드의 타입 역시 해석해야할 것이므로 가져온 모든 코드도 mypy가 해석해야 합니다.
이 의존성 관계는 계속 반복되어서 최종적으로는 built-in library까지 올라가게 됩니다.

이 형태를 효율적으로 해석하려면 어떻게 해야할까요?
아무것도 의존하지 않는 모듈, 예를 들어 bulit-in 라이브러리부터 시작해서 받는 의존성이 없는 모듈, 예를 들어 application code로 끝나도록 처리하면 쉬울것 같습니다.

때문에 mypy에서는 아무 것도 의존하지 않는 노드부터 시작해서 아무도 의존하지 않는 노드로 끝나도록 그래프를 위상정렬합니다. 노드 내부에서도 같은 방식으로 위상정렬됩니다.

## Code

위의 `process_graph`는 사실 `sccs`의 각 scc를 위상정렬 하는 부분이 아래에 있습니다.

```python
def process_graph(graph: Graph, manager: BuildManager) -> None:
    ...
    sccs = sorted_components(graph)
    ...
    for ascc in sccs:
        scc = order_ascc(graph, ascc)
        ...
    ...
```

# 캐시 활용

mypy는 캐시를 파일로 저장합니다.
mypy를 사용해보신 분들이라면 mypy를 실행했을 때 `.mypy_cache` 폴더가 생성되는 것을 보셨을것 같습니다.
혹시 아직 보지 못 하셨다면, mypy를 실행해 `.mypy_cache`가 생성되는지 확인해봅시다.

mypy는 이미 해석된 파일은 캐시로 저장해서 이후에 재사용하고, 캐시로 저장되지 않은 파일은 새로 해석합니다.
캐시가 없는 모듈을 stale한 모듈이라고 하고, 있는 모듈을 fresh한 모듈이라고 합니다.

아래에서 cache의 예시를 보시겠지만, 저장된 cache는 mypy가 해석한 내용이 그대로 담겨있습니다.
Fresh한 모듈은 이 cache를 그대로 가져다가 해석에 사용할 수 있기 때문에 해석을 새로 수행하지 않고, stale한 모듈만 해석을 새로 수행합니다.

## Example

`.mypy_cache` 에 들어있는 fresh한 모듈의 캐시를 잠시 들여다보겠습니다.

```python
from fastapi import FastAPI  
  
app = FastAPI()  
  
  
@app.get("/")  
async def root():  
    return {"message": "Hello World"}
```

아래는 cache에 들어있는 내용을 일부 첨부했습니다.

코드에서 가져온 FastAPI가 Gdef, global definition 으로 지정되었다는 내용도 있고, `app`의 타입이 `FastAPI` 라는 것이나 `root`, `say_hello`의 함수 정의에 대한 내용도 보이는것 같습니다.
이 내용은 mypy가 해석한 결과를 파일로 저장한 것으로, mypy가 파일을 어떻게 해석했는지 궁금하시거나 디버깅을 해야한다면 이 파일을 들여다보는 것으로도 충분할 수 있습니다.

```json
{
  ".class": "MypyFile",
  "_fullname": "main",
  // ...
  "names": {
    ".class": "SymbolTable",
    "FastAPI": {  // from fastapi import FastAPI
      ".class": "SymbolTableNode",
      "cross_ref": "fastapi.applications.FastAPI",
      "kind": "Gdef"  // 전역 정의됨
    },
    // ...
    "app": {  // app = FastAPI()
      ".class": "SymbolTableNode",
      "kind": "Gdef",  // 전역 정의됨
      "node": {
        ".class": "Var",
        "flags": [
          "is_inferred",
          "has_explicit_value"
        ],
        "fullname": "main.app",  // path를 포함한 전체 이름
        "name": "app",
        "type": "fastapi.applications.FastAPI"
      }
    },
    "root": {  // async def root()
      ".class": "SymbolTableNode",
      "kind": "Gdef",  // 전역 정의됨
      "node": {
        ".class": "Decorator",
        "func": {
          ".class": "FuncDef",
          "abstract_status": 0,
          "arg_kinds": [],
          "arg_names": [],
          "dataclass_transform_spec": null,
          "flags": [
            "is_coroutine",
            "is_decorated"
          ],
          "fullname": "main.root",
          "name": "root",
          "type": null
        },
        "is_overload": false,
        "var": {
          ".class": "Var",
          "flags": [
            "is_ready",
            "is_inferred"
          ],
          "fullname": "main.root",
          "name": "root",
          "type": {
            ".class": "CallableType",
            "arg_kinds": [],
            "arg_names": [],
            "arg_types": [],
            "bound_args": [],
            "def_extras": {
              "first_arg": null
            },
            "fallback": "builtins.function",
            "from_concatenate": false,
            "implicit": true,
            "is_ellipsis_args": false,
            "name": "root",
            "ret_type": {
              ".class": "AnyType",
              "missing_import_name": null,
              "source_any": null,
              "type_of_any": 1
            },
            "type_guard": null,
            "unpack_kwargs": false,
            "variables": []
          }
        }
      }
    }
  },
  "path": "main.py"
}
```


