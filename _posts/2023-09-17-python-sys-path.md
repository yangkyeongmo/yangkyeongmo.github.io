---
title: "Python sys-path"
date: 2023-09-17 15:00
categories: dev
tags: ["python"]
published: false
---

# When this becomes problem
Consider this directory structure. You have just written this structure without any other settings. Would it be possible for `src/main.py` call `src/dir/main.py` by using `from src.dir import main`?
```
src
	- main.py
	- dir
		- main.py
test
	- some test codes...
```

The answer is no. With code like below, we would get an error.
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
Why is it? Python decides places to import the package from `sys.path`. If we look into `sys.path` by calling it directly, it would return something like this.

```
Python 3.11.1 (main, Jan 30 2023, 20:46:40) [GCC 11.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import sys
>>> sys.path
['', '/~~~/python/3.11.1/lib/python311.zip', '/~~~/python/3.11.1/lib/python3.11', '/~~~/python/3.11.1/lib/python3.11/lib-dynload', '/~~~/lib/python3.11/site-packages']
```

If we run a script and inspect `sys.path` in that process, the directory of the entry-point script — not of every file — is included as `sys.path[0]`, allowing that script to import modules near it.

```
['/~~~/tmp/src', '/~~~/.asdf/installs/python/3.11.1/lib/python311.zip', '/~~~/.asdf/installs/python/3.11.1/lib/python3.11', '/~~~/.asdf/installs/python/3.11.1/lib/python3.11/lib-dynload', '/~~~/.cache/pypoetry/virtualenvs/tmp-~~~-py3.11/lib/python3.11/site-packages']
```

In here, this came from `src/main.py`. `/~~~/tmp/src` is the directory where `main.py` is included and it's also in `sys.path`.

Let's go back to the beginning. Why did it fail to import `src/dir/main.py` as `from src.dir.main import func`? Because `src.dir.main` is not registered in `/~~~/tmp/src`. If there was another directory named `src` inside `src` and `dir/main.py` was included in there, the first code succeed.

A way to avoid this problem is to include the root path to `sys.path` so that python interpreter would find intended modules.
For example, we could include this code.
```python
import sys
from pathlib import Path
p = Path(__file__).parent.parent  # grandparent directory is root
sys.path.insert(0, str(p.absolute()))
```

# But.. I had no problem without that code in Django.
That's true. When we initialize a django project and run in similar environment as above, then we can see same error.
However, after running `python manage.py shell` or some django related commands, you won't see any error like that.
It's unclear where exactly Django inserts the project root directory into `sys.path`, but we could see root directory is inserted into `sys.path` after the django related calls.

# Ref.
"6. Modules." Python documentation, 10 June 2023, docs.python.org/3/tutorial/modules.html#the-module-search-path.
