---
title: "How Mypy Works: #3 Semantic Analysis"
date: 2023-07-24 15:00
categories: dev
tags: ["python"]
lang: en
locale: en_US
ref: mypy-3-semanal
permalink: /en/mypy-3-semanal.html
machine_translated: true
original_url: /mypy-3-semanal.html
---

# Introduction

This post is a collection of things I studied about mypy on the side while writing [mypyind](https://github.com/yangkyeongmo/mypyind), which finds callers of a specific function in a large-scale Python project.

This is additional explanation for a [pycon talk](/en/i-present-on-pycon-2023.html).

This post is connected to the posts below.

[How Mypy Works: #1 Pre-optimization](/en/mypy-1-pre-optimization.html)

[How Mypy Works: #2 File Parsing](/en/mypy-2-parsing.html)

[How Mypy Works: #2-side Why Does Mypy Need AST?](/en/mypy-2-1-why-ast.html)

[How Mypy Works: #3 Semantic Analysis (current post)](/en/mypy-3-semanal.html)

[How Mypy Works: #4 Type Checking](/en/mypy-4-typecheck.html)

# Overview

This post covers Semantic Analysis, one of the ways Mypy works.
Mypy is a static type checker that supports type checking of Python code.
For that, it converts the code into an AST(Abstract Syntax Tree), and afterward analyzes the AST to perform type checking.
In the process of analyzing the AST at that point, it stores and references names and scopes of variables, functions, classes, and so on using objects like `SymbolTable`, `SymbolTableNode`, `SymbolNode`, centered on the `SemanticAnalyzer` class.

# Semantic analysis?

Semantic analysis is one stage in compiler design.
If you literally translate Semantic analysis it's meaning analysis, and if you look at it as analyzing the meaning of the code, the content makes sense.

The purpose of a compiler is to turn code written in a high-level language into code a machine can understand.
To achieve this purpose, you have to understand specifically what each node of the AST points to.

For example, like this.

```python
# a.py
걔 = 두식이()
...
```

```python
# b.py
from a import 걔
응답 = 걔.알지()
```

In code like the above, you can't figure out what "걔" in `b.py` points to just by looking at the structured content of the code.
To figure out the specific target, you have to fill in the content by referencing things like another file's namespace.
If the fact that the variable "걔" in the `a.py` module refers to "두식이()" is stored, the `b.py` module can interpret using this stored information.
The data structure where variables are stored at this point is called a "symbol table", and variables are stored as a "symbol node".

In Mypy's semantic analysis stage, it finds out the exact meaning of things like variables and stores it so it can be used in type checking afterward.
This stage is not a stage that checks syntax or type compatibility; it's a stage that fills the symbol table, binds names, and checks some semantic errors.

# Class structure

Mypy's semantic analysis proceeds centered on the `SemanticAnalyzer` class.

## SemanticAnalyzer

In the stage before running Semantic analysis, mypy obtained an AST that represents the code structure. Afterward, to type-check, mypy stores information in this stage about specifically what each node of the AST represents.

In mypy this class is implemented as a visitor pattern.
Python's syntax is not fixed and there's a possibility it will change afterward as well. That means the form of the AST made from Python's syntax could also change.
If the `SemanticAnalyzer` class, which is in charge of the semantic analysis role, depends on this structure, it seems like changes would be too frequent.

`SemanticAnalyzer` is implemented similarly to a typical implementation of the visitor pattern.
A `visit_XXX` function is defined for each node type.

If you look at it, it's a form like this.

```python
class SemanticAnalyzer(...):
    # ...
    def visit_class_def(self, defn: ClassDef) -> None:
        ...
    # ...
    def visit_assignment_stmt(self, stmt: AssignmentStmt) -> None:
        ...
    # ...
```

## SymbolTable

`SymbolTable` plays a kind of namespace role.

`SemanticAnalyzer` holds a symbol table defined per module.
Content defined in a local scope like a function is stored separately in a variable called `locals`.
locals is defined as a list, so each time a function scope goes in, a scope is added to this variable, and each time it comes out the scope is removed.

Mypy's semantic analysis is a stage that fills in names on the AST nodes that were made, creates a symbol table, and does some checks.
Here the symbol table is one namespace.
This namespace is specified at the file, class, and function unit.
At this point global variables are also sometimes specified separately in the global namespace.

```
SemanticAnalyzer
    globals: SymbolTable
    locals: List[SymbolTable]
```

## SymbolTableNode

What actually goes in as the value of the dictionary called `SymbolTable` is `SymbolTableNode`.
You can also look at `SymbolTableNode` as `SymbolNode` with a defined scope added.

```
SymbolTable
    - SymbolTableNode
        - SymbolNode
        - scope(global, local, member)
    - ...
```

## SymbolNode

`SymbolNode` is also a different expression of an AST node, and so it's also a different expression of one code fragment.
When `SemanticAnalyzer` finds a global definition while interpreting code, it maps the target's name and a `SymbolNode` in globals.

# Example

## a = b

We'll look at how semantic analysis works through an example. I'll let you know in advance that in reality the order might be a bit different; I reorganized it to make it easier to understand.

This example sentence `a = b` itself corresponds to `AssignmentStatement`, that is, a statement that assigns.

Then `SemanticAnalyzer` interprets this statement in `visit_assignment_statement`.

Inside this function `SemanticAnalyzer` interprets `a`'s fullname information, and this information is wrapped as a new object called `SymbolNode` and assigned to `NameExpr`.
The `SymbolNode` created at this point would specifically be a `Var` object that represents a variable.
In this process other information is also assigned, like whether the `NameExpr` is a global variable or a local variable.

Once we get here we could express it like this.

```
a -> NameExpr
    - Var(name='a', fullname='some.module.a', ...)
b -> NameExpr
    - Var(name='b', fullname='some.module.b', ...)
```

It's good that `SemanticAnalyzer` did semantic analysis and got information like fullname, but to do it efficiently, information that's already been interpreted should be put away, right?
That information goes into `SymbolTable`. `SymbolTable` is a table that maps names and `SymbolNode`s.
This has to be there to be able to provide references to the current module's variables even within the same module, or when interpreting another module.

You can look at this SymbolTable as existing one per namespace, for example per class scope or function scope.

But as we saw above `SymbolTable` doesn't map `SymbolNode` directly, and it's mapped with an object called `SymbolTableNode`.
What this `SymbolTableNode` represents is a `SymbolNode` and the scope it was defined in.

Because when storing, a globally defined `a` and an `a` that's locally defined inside a function appear in the same shape.
So an object called `SymbolTableNode` is created in a form that also includes the scope where the target was defined, while referencing the `SymbolNode`.

For example, when there's code like this
```python
a = 1
def f():
    a = 2
```

In `a = 1`, `a` is a global variable, and in `a = 2`, `a` is a local variable of the function `f`.
These two have the same name so you can't distinguish them as `SymbolNode`.
So we create an object called `SymbolTableNode` and store `SymbolNode` together with information called `scope`.
`scope` is information that represents the scope where the `SymbolNode` was defined.

If we express it, it's like this.
```
SymbolTable(globals)
    a -> SymbolTableNode
        - SymbolNode
            - Var(name='a', fullname='some.module.a', ...)
        - scope: global
SymbolTable(locals)
    a -> SymbolTableNode
        - SymbolNode
            - Var(name='a', fullname='some.module.a', ...)
        - scope: local
```

If we assign this to `SymbolTable`, afterward when `SemanticAnalyzer` interprets another target it becomes able to reference the variable `a`.

Up to here we could express it like this.

```
SemanticAnalyzer
    SymbolTable
        a -> SymbolTableNode
            - SymbolNode
                - Var(name='a', fullname='some.module.a', ...)
            - scope: global
        b -> SymbolTableNode
            - SymbolNode
                - Var(name='b', fullname='some.module.b', ...)
            - scope: global
```

# Wrap up

In this post we looked at how mypy's semantic analysis works.

Then how does mypy type-check with this information?

In the next post ([How Mypy Works: #4 Type Checking](/en/mypy-4-typecheck.html)), we'll look at how it type-checks with the result of this semantic analysis.
