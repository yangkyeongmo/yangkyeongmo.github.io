---
title: "Errors you might run into using PyInstaller"
date: 2019-08-05 18:35
categories: dev
tags: ["python"]
layout: post
lang: en
locale: en_US
ref: about-possible-errors-of-pyinstaller
permalink: /en/about-possible-errors-of-pyinstaller.html
machine_translated: true
original_url: /archived/2019-08-05-about-possible-errors-of-pyinstaller.html
---

Contents
===
> * 1.Pyinstaller
> * 2.Possible errors


1. PyInstaller
======================

PyInstaller?
------------
> PyInstaller freezes (packages) Python applicaitions into stand-alone executables, under Windows, GNU/Linux, ...

PyInstaller turns Python files into stand-alone files.

Stand-alone means it can run without external dependencies, and it can work even in an environment where python (the interpreter) is not installed.

So it can be used quite usefully when delivering (runnable) Python code to someone who doesn't know computers, and there are other usage methods depending on how you use it. In my case I use it when delivering to a client who doesn't know how to run Python from the CLI, or because for GUI programs it's convenient to deliver as an exe.


How is it possible?
----------------
The reason PyInstaller can deliver a stand-alone program like this is because it copies the python code and the python interpreter into one exe, or into one folder.

PyInstaller doesn't use the standard library's Freeze utility; it makes executables with its own dependency analysis and a C bootloader.

The bundled modules are also called "Frozen modules", which is including the code PyInstaller analyzed into a folder or exe.

To make it a stand-alone program, dependencies also have to be resolved, and they say dependencies declared with import statements can be resolved.

(They say dynamically declared dependencies or runtime changes to sys.path cannot be recognized, so you should be careful.)


Once you've copied, is that it?
--------------
Now if the code, interpreter, modules, etc. are all ready, the bootloader helps the execution process.

The bootloader is called at the start of the executable, creates a temp folder, creates a temp environment, copies the interpreter, and has it run the code.


Is it OS-independent?
----------------
According to the official docs, it may not be OS-independent.

This could be due to the python code itself (ex: filesystem differences), or because it makes the exe using the current environment.

First of all the official docs recommend making different versions according to the environment (OS, 32/64-bit, etc.) and distributing them.

For reference, since it copies and uses the Python interpreter currently in use in the current environment, you should also pay attention to the Python version.


2. Possible errors
==================

Below I explain errors I ran into while using PyInstaller.

May be added later.

Before getting into it, I recommend looking at the .spec file created when using PyInstaller and searching related knowledge on the internet to use it.

When creating as one-file it runs in the CLI but the exe itself errors
------------------------------------------------------------------

Add the following code before any modules other than the os, sys modules are imported.

```python
...
import os
import sys
if hasattr(sys, 'frozen'):
	os.environ['PATH'] = sys._MEIPASS + ";" + os.environ['PATH']
...
```

<b>hasattr(sys, 'frozen')</b> is a statement asking whether frozen is included in the sys module.

If frozen is included in sys, it means the current module has been frozen.

The next line adds sys._MEIPASS to os's environment variables.

As mentioned above the bootloader creates a temp folder, and this folder's name is _MEIxxxxxxx (xxxxxxx is some number).

sys._MEIPASS points to the created temp folder, and adds it to the environment variables.


Qt5Core.dll is missing
------------------

It's a problem I ran into while using PyQt5, but if a message comes up that some dll is missing, add it to binaries in the .spec file.

It's also good to refer to the next error.


Adding several binaries
------------------

An error occurred when I added several binaries as follows.

```python
...
a = Analysis(...
		binaries[ 'Qt5Core.dll', 'Qt5Gui.dll', 'Qt5Widgets.dll' ],
		...
		)
...
```

When I changed it as follows the error didn't occur.

```python
a = Analysis(...
		binaries[ ('Qt5Core.dll', '.'), ('Qt5Gui.dll', '.'), ('Qt5Widgets.dll', '.') ],
		...
		)
...
```

When adding files to binaries, it seems you have to add them as ('file name', 'relative path').


Error that numpy.random.common etc. are missing
------------------------------------

Fix it by adding them to hiddenimports.

In my case, when I changed hiddenimports in the .spec file as follows the error didn't come out.

```python
a = Analysys(...
		hiddenimports=['numpy.random', 'numpy.random.common', 'numpy.random.bounded_integers', 'numpy.random.entropy',]
		...
		)
...
```


