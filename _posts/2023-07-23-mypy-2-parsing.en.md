---
title: "How Mypy Works: #2 File Parsing"
date: 2023-07-23 15:00
categories: dev
tags: ["python"]
lang: en
locale: en_US
ref: mypy-2-parsing
permalink: /en/mypy-2-parsing.html
machine_translated: true
original_url: /mypy-2-parsing.html
---

# Introduction

This post is a collection of things I studied about mypy on the side while writing [mypyind](https://github.com/yangkyeongmo/mypyind), which finds callers of a specific function in a large-scale Python project.

This is additional explanation for a [pycon talk](/en/i-present-on-pycon-2023.html).

This post is connected to the posts below.

[How Mypy Works: #1 Pre-optimization](/en/mypy-1-pre-optimization.html)

[How Mypy Works: #2 File Parsing (current post)](/en/mypy-2-parsing.html)

[How Mypy Works: #2-side Why Does Mypy Need AST?](/en/mypy-2-1-why-ast.html)

[How Mypy Works: #3 Semantic Analysis](/en/mypy-3-semanal.html)

[How Mypy Works: #4 Type Checking](/en/mypy-4-typecheck.html)

# Overview

For mypy to do type checking, in [the first stage](/en/mypy-1-pre-optimization.html) it decided the order of modules to visit.

Then it would need to do type checking, so how should it interpret the code to be able to type-check?

Before type checking it turns the code into an AST (Abstract Syntax Tree).

# It uses the ast library to make an AST

For mypy to interpret code, the code has to be made into a structured form. To structure it, mypy converts the code to an AST.

The detailed reason it converts to an AST rather than some other structure is in [How Mypy Works: #2-side Why Does Mypy Need AST?](/en/mypy-2-1-why-ast.html).

To look at the reason simply: the computer languages we use often are based on a formal grammar, and a sentence made with a formal grammar can be interpreted in tree form. What you get when you change the interpreted result to show only the structural form is an AST.

In Python, a PEG parser became the default from 3.9, and the existing LL(1) parser was removed in 3.10. [Ref](https://peps.python.org/pep-0617/) This post won't explain these parsers in detail, but both are similar to or based on context free grammar (CFG). So Python code can also be made into an AST and interpreted.

In Python, the [ast library](https://docs.python.org/3/library/ast.html) lets you turn code into an ast.

# It makes a new object that adds information to the AST nodes that were made

mypy makes an AST so that later stages can interpret the code structurally.

After parsing the code with the ast library you'd get a tree, and it visits each node of this tree with a class called `ASTConverter`.

## ASTConverter

ASTConverter visits each node of the AST made with the ast library (the components of the ast tree) and makes a new object.  This class is implemented with the visitor pattern. Like a typical visitor pattern implementation, a function is defined for each node type, like `visit_ClassDef`.

- If you're not familiar with the visitor pattern yet, [refactoring guru's introduction to the visitor pattern](https://refactoring.guru/design-patterns/visitor) is a good reference.

Inside this function it puts in the name, full name, type information, and so on, making a new class so mypy can interpret it easily later.

If you actually look, it's in a form like this.

```python
class ASTConverter:
    # ...
    def visit_ClassDef(self, n: ast3.ClassDef) -> ClassDef:
        ...
    # ...
    def visit_Call(self, n: Call) -> CallExpr:
        ...
    # ...
```

The XXX in visit_XXX means the type in the ast library, and the return type means the type of the object mypy newly made.

The meaning of an ast node and the node mypy newly made isn't hugely different, but the object mypy newly made has additional information so it's easier to interpret later.

For example [ast's Call only shows the function name, arg, kwargs](https://docs.python.org/3/library/ast.html#ast.Call), whereas mypy also needs the expression being called, so it also stores callee, i.e. the target being called (the function being called).

# Wrap up

In this post we looked at mypy making an AST to interpret code.

Then why does mypy need an AST?
I'll look at that in the next post ([How Mypy Works: #2-side Why Does Mypy Need AST?](/en/mypy-2-1-why-ast.html)).

We looked at how to make an AST at this stage, so how do we use the AST?
I'll look at that in a later post ([How Mypy Works: #3-side How Does Mypy Use AST?](/en/mypy-3-semanal.html)).
