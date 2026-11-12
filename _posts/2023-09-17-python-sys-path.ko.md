---
title: "Python sys-path"
date: 2023-09-17 15:00
categories: dev
tags: ["python"]
lang: ko
locale: ko_KR
ref: python-sys-path
permalink: /ko/python-sys-path.html
---

# When this becomes problem
이런 디렉터리 구조를 생각해 보자. 다른 설정 없이 이 구조만 막 적어 둔 상태다. `src/main.py`가 `from src.dir import main`으로 `src/dir/main.py`를 호출하는 게 가능할까?
```
src
	- main.py
	- dir
		- main.py
test
	- some test codes...
```

답은 아니다. 아래 같은 코드로는 에러가 난다.
```python
# in src/main.py
from src.dir.main import func

func()
```

```python
# in src/dir/main.py
def func():
	print('hello!')
```

```
Traceback (most recent call last):
  File "/~~~/tmp/src/main.py", line 10, in <module>
    from src.dir.main import func
ModuleNotFoundError: No module named 'src'
```

# Why is it problem?
왜일까? Python은 패키지를 import할 장소를 `sys.path`에서 정한다. `sys.path`를 직접 호출해서 들여다보면, 대략 이런 것이 반환된다.

```
Python 3.11.1 (main, Jan 30 2023, 20:46:40) [GCC 11.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import sys
>>> sys.path
['', '/~~~/python/3.11.1/lib/python311.zip', '/~~~/python/3.11.1/lib/python3.11', '/~~~/python/3.11.1/lib/python3.11/lib-dynload', '/~~~/lib/python3.11/site-packages']
```

스크립트를 실행하고 그 프로세스에서 `sys.path`를 보면, 모든 파일이 아니라 엔트리포인트 스크립트의 디렉터리가 `sys.path[0]`으로 들어가서, 그 스크립트가 근처 모듈을 import할 수 있게 된다.

```
['/~~~/tmp/src', '/~~~/.asdf/installs/python/3.11.1/lib/python311.zip', '/~~~/.asdf/installs/python/3.11.1/lib/python3.11', '/~~~/.asdf/installs/python/3.11.1/lib/python3.11/lib-dynload', '/~~~/.cache/pypoetry/virtualenvs/tmp-~~~-py3.11/lib/python3.11/site-packages']
```

여기서 이건 `src/main.py`에서 온 것이다. `/~~~/tmp/src`는 `main.py`가 들어 있는 디렉터리이고, `sys.path`에도 있다.

처음으로 돌아가자. 왜 `from src.dir.main import func`로 `src/dir/main.py`를 import하는 데 실패했을까? `src.dir.main`이 `/~~~/tmp/src`에 등록되어 있지 않기 때문이다. `src` 안에 `src`라는 다른 디렉터리가 있고 거기에 `dir/main.py`가 들어 있었다면, 첫 코드는 성공한다.

이 문제를 피하는 한 방법은 루트 경로를 `sys.path`에 넣어서 파이썬 인터프리터가 의도한 모듈을 찾게 하는 것이다.
예를 들어 이런 코드를 넣을 수 있다.
```python
import sys
from pathlib import Path
p = Path(__file__).parent.parent  # grandparent directory is root
sys.path.insert(0, str(p.absolute()))
```

# But.. I had no problem without that code in Django.
맞다. Django 프로젝트를 초기화하고 위와 비슷한 환경에서 실행하면, 같은 에러를 볼 수 있다.
하지만 `python manage.py shell`이나 어떤 django 관련 커맨드를 실행한 뒤에는, 그런 에러가 보이지 않는다.
Django가 프로젝트 루트 디렉터리를 `sys.path`에 정확히 어디에 넣는지는 불분명하지만, django 관련 호출 뒤에는 루트 디렉터리가 `sys.path`에 들어가 있는 것을 볼 수 있다.

# Ref.
"6. Modules." Python documentation, 10 June 2023, docs.python.org/3/tutorial/modules.html#the-module-search-path.
