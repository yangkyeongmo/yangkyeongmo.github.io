---
title: "Speeding up tests by running Django tests in parallel"
date: 2023-08-10 11:00
categories: dev
tags: ["python", "django"]
layout: post
lang: en
locale: en_US
ref: django-test-parallel
permalink: /en/django-test-parallel.html
machine_translated: true
original_url: /archived/2023-08-10-django-test-parallel.html
---

# Intro

When I applied what I learned below to a large monorepo at work, when running the full unit tests "locally" there was variance, but execution time that took **96 seconds** was cut to **30 seconds using 4 processes**. Using 4 processes, so it's obvious in a way.

For a repo that only uses a DB Django can manage connections for (MySQL etc.), it looks like you could cut execution time a lot with the parallel option "in a local environment".

To do this you have to create N databases on the DB, which is a downside. So when you run this option in CI/CD, depending on the case the overhead from schema import time can be larger.

## How to run

Below is a run example. Add `--parallel N` to the test options you already run. This means the number of processes created.

```bash

> python manage.py test .
# .. omitted ..
Ran 2351 tests in 96.912s

> python manage.py test . --parallel 4
# .. omitted ..
Ran 2351 tests in 28.098s
```

# Analysis

Below is an analysis of why parallel tests shouldn't be a problem for tests running correctly.

Python's unittest, which Django test is based on, is structured roughly like this.

- Test runner: runs the Test suite, responsible for running tests and rendering output
    - Test Suite: a set of test cases, aggregating test cases that should run together
        - Test case: the unit of test execution
            - Test function: the test that actually runs
- Side note
    - Pytest proceeds by using `assert x == y` in tests, but unittest doesn't; you have to test in a form like `self.assertEqual`. Thinking in the structure above, the test runner is responsible for rendering output, and to use that feature it has to be passed upward, so it seems you can only get pretty output through function calls like `self.assertXXX`.

Django test takes python unittest's default settings and uses them; looking at the `DiscoverRunner` used by default, it's composed like this.

```python
class DiscoverRunner:
    """A Django test runner that uses unittest2 test discovery."""

    test_suite = unittest.TestSuite
    parallel_test_suite = ParallelTestSuite
    test_runner = unittest.TextTestRunner
    test_loader = unittest.defaultTestLoader
    reorder_by = (TestCase, SimpleTestCase)
```

When DiscoverRunner makes a test suite, if the `parallel` option is on it uses `parallel_test_suite` to make the test suite. It's made in a form where several test suites sit in this `ParallelTestSuite` as a subsuite field.

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

When running tests, `ParallelTestSuite` brings up processes with the `multiprocessing` library and distributes each subsuite.

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

When bringing up processes it uses `self.init_worker`; the default `self.init_worker` has a function like this connected.

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

In `setup_worker_connection` called from `connection.creation.setup_worker_connection(_worker_id)`, there's work that appends `_worker_id` as a suffix to the database name.

So if the database name stored in the original settings is `XXX`, each process knows the database name as `XXX_n` and forms a connection.

We can assume that because each process looks at a different DB, each test suite will run without affecting the others.

# Refs

- Django repo
- [https://docs.python.org/3/library/unittest.html](https://docs.python.org/3/library/unittest.html)
