---
title: "f-string performance in logging and pylint w1203"
date: 2023-08-10 11:00
categories: dev
tags: ["python"]
layout: post
lang: en
locale: en_US
ref: logging-fstring-w1202
permalink: /en/logging-fstring-w1202.html
machine_translated: true
original_url: /archived/2023-08-08-logging-fstring-w1202.html
---

# W1203?

W1203, “logging-fstring-interpolation”, is an option that says to hold back on using f-strings when logging.

For example this is not allowed,

```python
logging.error(f"Python version: {sys.version}")
```

and this is.

```python
logging.error("Python version: %s", sys.version)
```

# Why?

They say it's because of performance. Usually logging doesn't affect performance, but there was a report that when a Python developer working on a filesystem printed trace logs, there was a performance drop because of f-strings ([Github issue](https://github.com/pylint-dev/pylint/issues/2395#issuecomment-510605045)).

The original proposer of that same issue said that when they logged a million times there wasn't a big difference between % encoding and f-strings, and instead the performance difference only showed up when using .format ([Github issue](https://github.com/pylint-dev/pylint/issues/2395#issue-348786471)).

I'll attach the original proposer's performance test as-is. In order, f-string, .format, % encoding.

```python
num_times = 10,000:
(0.016536445124074817, 0.02152163698337972, 0.018616185057908297)

num_times = 100,000:
(0.16004435811191797, 0.20005284599028528, 0.1561291899997741)

num_times = 1,000,000:
(1.641325417906046, 2.0023047979921103, 1.6249939629342407)
```

So for what performance issue did pylint ban f-strings?

I got curious and looked it up, and they say it's **because if you use f-strings or .format, the string is built in advance**. So even when you don't actually log, the string gets built and it seems unnecessary overhead would happen. Especially if the value passed as an f-string parameter is very large, the overhead could be big.

The pylint docs say this. “**interpolation**” here seems to mean the process of interpreting the string.

> *You can use % formatting but leave interpolation to the logging function by passing the parameters as arguments. ([ref](https://pylint.pycqa.org/en/latest/user_guide/messages/warning/logging-fstring-interpolation.html))*

For reference, W1202 is logging-format-interpolation for using `.format()`, and f-strings are W1203 (logging-fstring-interpolation).
