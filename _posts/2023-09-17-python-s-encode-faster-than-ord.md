---
title: "Python s.encode is faster than checking ord by character"
date: 2023-09-17 15:00
categories: dev
tags: ["python", "performance"]
published: false
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

timeit reported 7.98 ns for the code above and 590 ns for the code below — about 73 times faster, if those numbers are right. 8ns looks suspiciously fast for an encode plus try/except of a 7-character literal, though; it may be measuring an optimized or constant-folded path. These numbers need to be remeasured, for example with a function that takes a variable string or with `python -m timeit`, before treating the 73x as settled.

```
In [8]: timeit(all(ord(c) < 128 for c in 'abcdefg'))
590 ns ± 3.65 ns per loop (mean ± std. dev. of 7 runs, 1,000,000 loops each)
```

Is this obvious? For me, this is confusing because both encoding a string and iterating over a string seems similar. My best guess is that encoding a character would be like mapping to existing map, and iterating would be a sequence of arithmetic operations. But should it differ that much? That's why I decided to dig in.

Let's decompose the codes using `dis`.

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

First, disassembly of `by_ord` is here.

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

Let's ignore first two blocks since it's just calling a function. Only one notable part is that it's trying to retrieve a generator expression in 14.
Last block is where iteration happens. Given loaded constant 'abcdefg', this block will iterate(8: `FOR_ITER`), and return None if it's exhausted(56: `LOAD_CONST`, 58: `RETURN_VALUE`).
During the iteration, item on the top of the stack is stored to variable `c`, then calls `ord`(12: `LOAD_GLOBAL`), compare with `128`(40: `LOAD_CONST`, 42: `COMPARE_OP`).
I first assumed each bytecode line would take a few microseconds, which would put this loop at 72 microseconds or more. That doesn't hold: the measured timeit is 590 nanoseconds, about 120 times smaller than that estimate. A microsecond-per-line assumption is the wrong scale here.

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

For here, we could ignore first two blocks since they point to function declaration, try statement and execution.
The third block is where encoding is happening. You could see that `s.encode('ascii')` is done with just a few lines.
What makes me ponder is that how much time calling `encode` would take. Since each call to method might vary greatly, our assumptions might be only true for simple executions like arithmetic comparisons or popping stack. I wouldn't go further, but it seems most builtin functions are implemented in C code, which would be much faster than iterating on python.
There's room for consideration because we didn't discuss about try-except-else block. I've been familiarized about the knowledge that we should avoid using try-except block because it's negative to performance compared to normal function execution, but here it doesn't seem like too much burden.
