---
title: "Logging에서의 fstring 성능 문제와 pylint w1203"
date: 2023-08-10 11:00
categories: dev
tags: ["python"]
---

# W1203?

W1203, “logging-fstring-interpolation” 은 로깅을 할 때 fstring 사용을 자제할 것을 나타내는 옵션입니다.

예를 들어 이건 안 되고,

```python
logging.error(f"Python version: {sys.version}")
```

이건 됩니다.

```python
logging.error("Python version: %s", sys.version)
```

# 왜?

왜 그럴까요?

성능 때문이라고 하네요. 보통은 로깅이 성능에 영향을 주지 않지만, 파일 시스템을 개발하는 파이썬 개발자가 trace 로그를 찍었을 때 fstring 때문에 성능 저하가 있었다는 보고가 있었습니다([Github issue](https://github.com/pylint-dev/pylint/issues/2395#issuecomment-510605045)).

위 보고와 같은 이슈의 원 발안자는 로그를 백만번 찍었을 때 % 인코딩과 fstring에 큰 차이가 없었고, 대신 .format을 쓸 때만 성능 차이가 났다고 하네요([Github issue](https://github.com/pylint-dev/pylint/issues/2395#issue-348786471)).

위 이슈 발안자의 성능 테스트를 그대로 첨부합니다. 차례대로 fstring, .format, % 인코딩입니다.

```python
num_times = 10,000:
(0.016536445124074817, 0.02152163698337972, 0.018616185057908297)

num_times = 100,000:
(0.16004435811191797, 0.20005284599028528, 0.1561291899997741)

num_times = 1,000,000:
(1.641325417906046, 2.0023047979921103, 1.6249939629342407)
```

그렇다면 pylint에서 fstring을 어떤 성능 이슈때문에 금지한걸까요?

궁금해서 찾아보았는데, fstring이나 .format을 사용할 경우 **미리 string을 만들어버리기 때문**이라고 합니다. 때문에 로깅을 하지 않는 경우도 string을 만들어버려서 불필요한 overhead가 발생할듯 하네요. 특히 fstring의 파라미터로 전달되는 값이 아주 클 경우 overhead가 크게 발생할 수 있겠습니다.

pylint 문서에서는 이렇게 얘기하고 있습니다. 여기서의 “**interpolation**”이 string을 해석하는 과정을 의미하는듯 합니다.

> *You can use % formatting but leave interpolation to the logging function by passing the parameters as arguments. ([ref](https://pylint.pycqa.org/en/latest/user_guide/messages/warning/logging-format-interpolation.html))*
