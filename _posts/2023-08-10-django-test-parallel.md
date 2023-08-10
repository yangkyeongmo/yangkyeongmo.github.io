---
title: "Django test 병렬 실행해 테스트 실행 시간 단축하기"
date: 2023-08-10 11:00
categories: dev
tags: ["python", "django"]
---

# 소개

아래에서 알게된 내용을 회사의 큰 모노레포에 적용했을 때, “로컬에서” 전체 유닛테스트 실행 시 편차가 있으나 **96초**가 걸리던 실행 시간을 **프로세스 4개 사용 시 30초**로 단축되었습니다. 프로세스 4개를 썼으니 당연하긴 합니다.

Django가 connection 관리를 할 수 있는 DB(MySQL 등)만 사용하는 레포의 경우에는 “로컬 환경에서” 병렬 옵션으로 실행 시간을 크게 단축시킬 수 있을 것으로 보입니다.

이 동작을 하기 위해서는 DB에 database를 N개 만들어야한다는 단점이 있습니다. 때문에 CI/CD에서 이 옵션을 실행할 시 경우에 따라 schema import 시간에 의한 overhead가 더 클 수 있습니다.

## 실행 가이드

아래는 실행 예시입니다. 기존에 실행하던 테스트 옵션에 `--parallel N` 을 추가합니다. 이는 생성되는 프로세스 개수를 의미합니다.

```bash

> python manage.py test .
# .. 생략 ..
Ran 2351 tests in 96.912s

> python manage.py test . --parallel 4
# .. 생략 ..
Ran 2351 tests in 28.098s
```

# 분석

아래는 왜 병렬 테스트가 테스트 정상 동작에 문제가 없을지에 대한 분석입니다.

Django test가 기반하는 python의 unittest는 대략 이런 형태로 구조화되어있습니다.

- Test runner: Test suite를 실행, 테스트 실행과 output rendering 담당
    - Test Suite: test case의 집합, 함께 실행되어야 할 test case들을 aggregate한 것
        - Test case: 테스트 실행의 단위
            - 테스트 함수: 실제 실행되는 테스트
- 사족
    - Pytest는 `assert x == y` 를 테스트에 사용하는 방식으로 테스트가 진행되는데, unittest는 그렇지 않고 `self.assertEqual` 과 같은 형태로 테스트를 해야합니다. 위 구조로 생각해봤을 때 test runner가 output 렌더링을 담당하고 있고, 이 기능을 활용하려면 위로 전달되는 형태가 되어야하기 때문에 `self.assertXXX` 와 같은 함수 호출로만 예쁜 output을 얻을 수 있는듯 합니다.

Django test는 python unittest의 기본 설정을 가져와서 사용하는데, 기본적으로 사용하는 `DiscoverRunner` 를 보면 이렇게 구성되어있습니다.

```python
class DiscoverRunner:
    """A Django test runner that uses unittest2 test discovery."""

    test_suite = unittest.TestSuite
    parallel_test_suite = ParallelTestSuite
    test_runner = unittest.TextTestRunner
    test_loader = unittest.defaultTestLoader
    reorder_by = (TestCase, SimpleTestCase)
```

DiscoverRunner는 test suite를 만들 때, `parallel` 옵션이 켜져있으면 `parallel_test_suite` 를 활용해서 test suite를 만듭니다. 이 `ParallelTestSuite` 안에 subsuite 필드로 여러 test suite가 들어있는 형태로 만들어집니다.

```python
class ParallelTestSuite(unittest.TestSuite):
		init_worker = _init_worker
		# ...

    def __init__(self, subsuites, processes, failfast=False, buffer=False):
        self.subsuites = subsuites
        self.processes = processes
				# ...
        super().__init__()
```

`ParallelTestSuite`는 테스트 실행 시 `multiprocessing` 라이브러리로 프로세스를 띄우고 각 subsuite를 분배합니다.

```python
# ...
pool = multiprocessing.Pool(
    processes=self.processes,
    initializer=self.init_worker.__func__,
    initargs=[
        counter,
        self.initial_settings,
        self.serialized_contents,
        self.process_setup.__func__,
        self.process_setup_args,
    ],
)
args = [
    (self.runner_class, index, subsuite, self.failfast, self.buffer)
    for index, subsuite in enumerate(self.subsuites)
]
test_results = pool.imap_unordered(self.run_subsuite.__func__, args)
# ...
```

프로세스를 띄울 때 `self.init_worker` 를 사용하는데요, 기본 사용하는 `self.init_worker` 에는 이런 함수가 연결되어있습니다.

```python
def _init_worker(
    counter,
    initial_settings=None,
    serialized_contents=None,
    process_setup=None,
    process_setup_args=None,
):
    # ...
    for alias in connections:
        connection = connections[alias]
        if start_method == "spawn":
            # Restore initial settings in spawned processes.
            connection.settings_dict.update(initial_settings[alias])
            if value := serialized_contents.get(alias):
                connection._test_serialized_contents = value
        connection.creation.setup_worker_connection(_worker_id)
```

`connection.creation.setup_worker_connection(_worker_id)` 에서 호출하는 `setup_worker_connection` 에서는 database name 뒤에 `_worker_id` 를 suffix로 붙이는 작업이 포함되어있습니다.

때문에 원래 settings에 저장된 database 이름이 `XXX` 라면 각 프로세스는 database 이름을 `XXX_n` 으로 알고 connection을 형성합니다.

각 프로세스가 서로 다른 DB를 보고있어 각 test suite가 서로 영향을 주지 않고 실행될 것임을 가정할 수 있겠습니다.

# 참조

- Django 레포
- [https://docs.python.org/3/library/unittest.html](https://docs.python.org/3/library/unittest.html)
