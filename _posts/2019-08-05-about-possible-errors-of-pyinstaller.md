---
title: "PyInstaller를 사용하며 마주칠 수 있는 에러들"
date: 2019-08-05 18:35
categories: dev
tags: [python]
---
목차
===
> * 1.Pyinstaller
> * 2.가능한 에러들


1. PyInstaller
======================

PyInstaller?
------------
> PyInstaller freezes (packages) Python applicaitions into stand-alone executables, under Windows, GNU/Linux, ...

PyInstaller는 Python 파일을 stand-alone 파일로 만들어줍니다.

stand-alone이라고 하면, 외부 의존 없이 구동될 수 있다는 의미로, python(인터프리터)을 설치하지 않은 환경에서도 동작할 수 있습니다.

따라서 컴퓨터를 모르는 사람에게 (실행 가능한) 파이썬 코드를 전달해줄 때 꽤 유용하게 사용할 수 있고, 그 외 사용하기 나름의 사용방법이 있습니다. 제 경우는 CLI에서 파이썬을 실행할 줄 모르시는 의뢰인에게 전달할 때 사용하거나, GUI 프로그램은 exe로 전달하는 것이 편하기 때문에 사용하고 있습니다.


어떻게 가능한가?
----------------
PyInstaller가 이렇게 stand-alone한 프로그램을 전달할 수 있는 것은, python 코드와 python 인터프리터를 한 exe, 또는 한 폴더 안에 복사해넣기 때문입니다.

이를 위해서는 python utility인 Freeze를 이용하는 것으로 보입니다.

Freeze를 이용해서 묶인 모듈을 "Frozen module"이라고 하는데, PyInstaller가 어떤 코드를 frozen module로 만들어서 폴더나 exe 안에 포함시키는 것 같습니다.

stand-alone한 프로그램으로 만들려면 의존성 역시 해결되어야하는데, import문으로 선언된 의존성은 해결할 수 있다고 합니다.

(동적으로 선언된 의존성이나 sys.path의 런타임 변경은 인식할 수 없다고 하니 주의하셔야겠습니다.)


복사했으면 끝?
--------------
이제 코드, 인터프리터, 모듈 등이 모두 준비되었다면 bootloader가 실행 과정을 돕습니다.

bootloader는 실행 파일의 시작에 불려져서, 임시 폴더를 만들고 임시 환경을 만들며 인터프리터를 복사해서 코드를 실행하게 합니다.


OS에 독립적인가?
----------------
공식 문서에 따르면 OS에 독립적이지는 않을 수 있다고 합니다.

이것이 python 코드 자체에 의한 것일 수도 있고(ex: 파일 시스템 차이), 현재 환경을 이용해서 exe를 만들기 때문일 수도 있겠습니다.

우선 공식 문서에서는 환경(OS, 32/64비트 등)에 따라 다른 버전을 만들어서 배포할 것을 권장하고 있습니다.

참고로, 현재 환경에서 사용중인 Python 인터프리터를 복사해서 사용하는 것이다 보니, Python 버전에도 신경쓰셔야 합니다.


2. 가능한 에러들
==================

아래에서는 PyInstaller를 사용하며 마주친 에러들을 설명합니다.

추후 추가될 수 있습니다.

들어가기에 앞서, PyInstaller 사용 시 생성되는 .spec 파일을 살펴보고 인터넷에 관련 지식을 검색하여 사용하는 것을 추천드립니다.

one-file로 생성 시 CLI에서는 실행이 되는데 exe 자체는 에러가 나옴
------------------------------------------------------------------

다음 코드를 os, sys 모듈 이외의 모듈이 import되기 이전에 추가해주시면 됩니다.

```python
...
import os
import sys
if hasattr(sys, 'frozen'):
	os.environ['PATH'] = sys._MEIPASS + ";" + os.environ['PATH']
...
```

<b>hasattr(sys, 'frozen')</b> 은 sys 모듈에 frozen이 포함되었는지를 묻는 구문입니다.

sys에 frozen이 포함되어있다면 현재 모듈이 frozen되었다는 것을 의미합니다.

그 다음 줄에서는 os의 환경 변수에 sys._MEIPASS를 추가합니다.

위에서 언급하였듯 bootloader는 임시 폴더를 생성하는데, 이 폴더의 이름이 _MEIxxxxxxx입니다(xxxxxxx는 어떤 숫자).

sys._MEIPASS는 생성된 임시 폴더를 가리키고, 이를 환경 변수에 추가합니다.


Qt5Core.dll이 없음
------------------

PyQt5를 사용하면서 겪은 문제이지만, 어떤 dll이 없다는 문구가 나온다면 .spec 파일의 binaries에 추가하시면 됩니다.

다음 차례의 에러도 참고하시면 좋습니다.


여러 binary를 추가
------------------

다음과 같이 여러 binary를 추가했을 때 에러가 발생했습니다.

```python
...
a = Analysis(...
		binaries[ 'Qt5Core.dll', 'Qt5Gui.dll', 'Qt5Widgets.dll' ],
		...
		)
...
```

다음과 같이 변경했을 때 에러가 발생하지 않았습니다.

```python
a = Analysis(...
		binaries[ ('Qt5Core.dll', '.'), ('Qt5Gui.dll', '.'), ('Qt5Widgets.dll', '.') ],
		...
		)
...
```

binaries에 파일을 추가할 때, ('파일 이름', '상대 경로')로 추가해야되는 듯 합니다.


numpy.random.common 등이 없다는 에러
------------------------------------

hiddenimports에 추가해서 해결합니다.

제 경우 .spec 파일의 hiddenimports를 다음과 같이 변경했을 때 에러가 나오지 않았습니다.

```python
a = Analysys(...
		hiddenimports=['numpy.random', 'numpy.random.common', 'numpy.random.bounded_integers', 'numpy.random.entropy',]
		...
		)
...
```


