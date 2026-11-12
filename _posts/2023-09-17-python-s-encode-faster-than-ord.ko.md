---
title: "Python s.encode가 문자마다 ord를 검사하는 것보다 빠르다"
date: 2023-09-17 15:00
categories: dev
tags: ["python", "performance"]
lang: ko
locale: ko_KR
ref: python-s-encode-faster-than-ord
permalink: /ko/python-s-encode-faster-than-ord.html
machine_translated: true
original_url: /python-s-encode-faster-than-ord.html
---

```
In [6]: s = """\
   ...: try:
   ...:     'abcdefg'.encode('ascii')
   ...: except UnicodeError:
   ...:     print("Not ascii')
   ...: else:
   ...:     print("Ascii')
   ...: """

In [7]: timeit(s)
7.98 ns ± 0.0542 ns per loop (mean ± std. dev. of 7 runs, 100,000,000 loops each)
```

timeit은 위 코드에 7.98 ns, 아래 코드에 590 ns를 보고했습니다 — 그 숫자가 맞다면 약 73배 빠릅니다. 다만 7글자 리터럴의 encode plus try/except에 8ns는 수상할 만큼 빨라 보입니다. 최적화된 경로나 상수 폴딩된 경로를 재고 있을 수도 있습니다. 이 숫자들은, 예를 들어 가변 문자열을 받는 함수로 하거나 `python -m timeit`으로, 다시 재보기 전에는 73배를 확정으로 보기 어렵습니다.

```
In [8]: timeit(all(ord(c) < 128 for c in 'abcdefg'))
590 ns ± 3.65 ns per loop (mean ± std. dev. of 7 runs, 1,000,000 loops each)
```

이게 당연한가? 제게는 헷갈립니다. 문자열을 인코딩하는 것과 문자열을 순회하는 것이 비슷해 보이기 때문입니다. 제 최선의 추측은, 문자를 인코딩하는 것은 이미 있는 맵에 매핑하는 것 같고, 순회는 산술 연산의 연속일 것이라는 겁니다. 하지만 그렇게까지 달라야 하나? 그래서 파고들기로 했습니다.

`dis`로 코드를 분해해 봅시다.

```
In [9]: import dis

In [10]: def by_ord(s):
    ...:     return all(ord(c) < 128 for c in 'abcdefg')
    ...: 

In [11]: def by_encode(s):
    ...:     try:
    ...:         s.encode('ascii')
    ...:     except UnicodeError:
    ...:         print('Not Ascii')
    ...:     else:
    ...:         print('Ascii')
    ...: 
```

먼저 `by_ord`의 디스어셈블리는 여기입니다.

```
In [12]: dis.dis(by_ord)
  1           0 RESUME                   0

  2           2 LOAD_GLOBAL              1 (NULL + all)
             14 LOAD_CONST               1 (<code object <genexpr> at 0x7f89e0d7d330, file "<ipython-input-10-48d9a15cff78>", line 2>)
             16 MAKE_FUNCTION            0
             18 LOAD_CONST               2 ('abcdefg')
             20 GET_ITER
             22 PRECALL                  0
             26 CALL                     0
             36 PRECALL                  1
             40 CALL                     1
             50 RETURN_VALUE

Disassembly of <code object <genexpr> at 0x7f89e0d7d330, file "<ipython-input-10-48d9a15cff78>", line 2>:
  2           0 RETURN_GENERATOR
              2 POP_TOP
              4 RESUME                   0
              6 LOAD_FAST                0 (.0)
        >>    8 FOR_ITER                23 (to 56)
             10 STORE_FAST               1 (c)
             12 LOAD_GLOBAL              1 (NULL + ord)
             24 LOAD_FAST                1 (c)
             26 PRECALL                  1
             30 CALL                     1
             40 LOAD_CONST               0 (128)
             42 COMPARE_OP               0 (<)
             48 YIELD_VALUE
             50 RESUME                   1
             52 POP_TOP
             54 JUMP_BACKWARD           24 (to 8)
        >>   56 LOAD_CONST               1 (None)
             58 RETURN_VALUE
```

처음 두 블록은 그냥 함수를 호출하는 것이니 무시합시다. 눈에 띄는 부분은 하나, 14에서 제너레이터 표현식을 가져오려 한다는 것입니다.
마지막 블록이 순회가 일어나는 곳입니다. 로드된 상수 'abcdefg'가 주어지면, 이 블록은 순회하고(8: `FOR_ITER`), 소진되면 None을 반환합니다(56: `LOAD_CONST`, 58: `RETURN_VALUE`).
순회 동안 스택 맨 위 아이템이 변수 `c`에 저장된 뒤 `ord`를 호출하고(12: `LOAD_GLOBAL`), `128`과 비교합니다(40: `LOAD_CONST`, 42: `COMPARE_OP`).
처음에는 바이트코드 한 줄이 몇 마이크로초 걸릴 거라고 가정했고, 그러면 이 루프는 72마이크로초 이상이 됩니다. 그건 성립하지 않습니다: 측정된 timeit은 590나노초로, 그 추정보다 약 120배 작습니다. 줄당 마이크로초 가정은 여기선 스케일이 틀립니다.

```
In [13]: dis.dis(by_encode)
  1           0 RESUME                   0

  2           2 NOP

  3           4 LOAD_FAST                0 (s)
              6 LOAD_METHOD              0 (encode)
             28 LOAD_CONST               1 ('ascii')
             30 PRECALL                  1
             34 CALL                     1
             44 POP_TOP

  7          46 LOAD_GLOBAL              3 (NULL + print)
             58 LOAD_CONST               2 ('Ascii')
             60 PRECALL                  1
             64 CALL                     1
             74 POP_TOP
             76 LOAD_CONST               0 (None)
             78 RETURN_VALUE
        >>   80 PUSH_EXC_INFO

  4          82 LOAD_GLOBAL              4 (UnicodeError)
             94 CHECK_EXC_MATCH
             96 POP_JUMP_FORWARD_IF_FALSE    19 (to 136)
             98 POP_TOP

  5         100 LOAD_GLOBAL              3 (NULL + print)
            112 LOAD_CONST               3 ('Not Ascii')
            114 PRECALL                  1
            118 CALL                     1
            128 POP_TOP
            130 POP_EXCEPT
            132 LOAD_CONST               0 (None)
            134 RETURN_VALUE

  4     >>  136 RERAISE                  0
        >>  138 COPY                     3
            140 POP_EXCEPT
            142 RERAISE                  1
ExceptionTable:
  4 to 44 -> 80 [0]
  80 to 128 -> 138 [1] lasti
  136 to 136 -> 138 [1] lasti
```

여기서는 처음 두 블록이 함수 선언, try 문, 실행을 가리키니 무시할 수 있습니다.
세 번째 블록이 인코딩이 일어나는 곳입니다. `s.encode('ascii')`가 겨우 몇 줄로 끝나는 것을 볼 수 있습니다.
생각하게 하는 것은 `encode` 호출이 얼마나 걸릴까입니다. 메서드 호출마다 크게 달라질 수 있으니, 우리의 가정은 산술 비교나 스택 pop 같은 단순한 실행에만 참일 수 있습니다. 더 들어가지는 않겠지만, 대부분의 빌트인 함수는 C 코드로 구현되어 있어서 파이썬에서 순회하는 것보다 훨씬 빠를 것 같습니다.
try-except-else 블록에 대해서는 이야기하지 않았으니 생각할 여지는 있습니다. try-except 블록은 일반 함수 실행보다 성능에 나쁘니 피해야 한다는 지식에 익숙해져 있었는데, 여기서는 큰 부담처럼 보이지 않습니다.
