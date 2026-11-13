---
title: "How Mypy Works: #4 Type Checking"
date: 2023-07-24 15:00
categories: dev
tags: ["python"]
lang: en
locale: en_US
ref: mypy-4-typecheck
permalink: /en/mypy-4-typecheck.html
machine_translated: true
original_url: /mypy-4-typecheck.html
---

# Introduction

This post is a collection of things I studied about mypy on the side while writing [mypyind](https://github.com/yangkyeongmo/mypyind), which finds callers of a specific function in a large-scale Python project.

This is additional explanation for a [pycon talk](/en/i-present-on-pycon-2023.html).

This post is connected to the posts below.

[How Mypy Works: #1 Pre-optimization](/en/mypy-1-pre-optimization.html)

[How Mypy Works: #2 File Parsing](/en/mypy-2-parsing.html)

[How Mypy Works: #2-side Why Does Mypy Need AST?](/en/mypy-2-1-why-ast.html)

[How Mypy Works: #3 Semantic Analysis](/en/mypy-3-semanal.html)

[How Mypy Works: #4 Type Checking (current post)](/en/mypy-4-typecheck.html)

# Overview

Up through the previous post ([How Mypy Works: #3 Semantic Analysis](/en/mypy-3-semanal.html)) we looked at the semantic analysis stage.
Once this stage is done, now it's time to type-check.
Type checking performs type checking using the types defined in the semantic analysis stage.
This process also uses AST. 
The class structure also uses the visitor pattern similarly to the semantic analysis stage.

# Class structure

The type-checking process also uses AST similarly to the semantic analysis stage.
This object also, same as the object from semantic analysis before, defines an interpretation process for each node type.

The objects used mainly are `TypeChecker` and related objects, and `SubtypeVisitor`.
Each class interprets the AST so these classes also use the visitor pattern.
Each class plays a role like the following.

## TypeChecker

`TypeChecker` checks statements, and delegates other specialized type checks to other objects.
In Python a statement means things like an if statement such as `if a: ...`. (Arithmetic operations like `a + b` are expressions.)
The composition inside a Statement can be an expression or a statement.

`TypeChecker` has the following objects that help with type checking.
The objects we'll look at below are all declared as member variables of `TypeChecker`.

```
TypeChecker
  - expr_checker: ExpressionChecker
  - binder: ConditionalTypeBinder
  - pattern_checker: PatternChecker
  - subtype_visitor: SubtypeVisitor
```

### ExpressionChecker

`ExpressionChecker` is in charge of type checking expressions, as the name says.
In Python an expression means things like arithmetic operations such as `a + b`, function calls like `a()`, literals like `1`, variables like `a`, and so on.
When `TypeChecker` interprets a statement, if an expression comes out inside the statement it calls this object.

### ConditionalTypeBinder

`ConditionalTypeBinder` is an object that helps with handling cases where the same definition can be interpreted differently depending on the scope.
If you happen to know that Python manages the call stack with frame objects, it's similar to this class's role.

When you enter some scope, this binder is newly created, one of them.
This some scope can be a block like an if statement or while statement, a class or function definition, and so on.
When a conditional type is specified like when calling isinstance in an if statement, type definitions get stacked one by one on the stack.

The binder internally holds a list of Frames.
These Frames get added one by one when you enter a context that needs a conditional type.

A Frame could be analogized as a viewpoint from which you interpret some target.
The type of a variable interpreted at some viewpoint is stored in a `Frame`, and the type of the same variable interpreted at the next viewpoint can be stored in the next `Frame`.
When type-checking, it uses the very last `Frame` of this list.
Because cases that need Conditional type check are generally many, the binder is used a lot, and it also uses the binder inside `if` statements.

When there's code like this,
```python
if isintance(a, A):
    if isinstance(a, SubA):
        ...
    if isintance(a, SubB):
        ...
```

If we express it, it's like this.
When you enter the second block it appears like this,
```
Frame 1: a: A
Frame 2: a: SubA
```
When you leave the second if isinstance and enter the third block it would appear like this.
```
Frame 1: a: A
Frame 2: a: SubB
```

If we analogize it to the real world, think of a binder that binds paper.
Like when you put paper in the binder the paper stacks in the binder, and when you take paper out the paper comes out of the binder.
This paper corresponds to a frame.
To check the current type definition you check the very last paper, and if you take this paper out you can check the type definition written on the previous paper.

### PatternChecker

`PatternChecker` checks types for patterns, as the name says.
Pattern here means the patterns that appear inside a match statement.
When a match statement comes out this object is called.

### SubtypeVisitor

`SubtypeVisitor` is an object that takes a left-hand side and a right-hand side and checks whether the left-hand side is a subtype of the right-hand side.

If a type is defined in the semantic analysis stage, type information goes into `SymbolNode`, and this type information is as a Type class.

If you think of Python's type, we can also define a type variable, and we can also define an alias.

For example when there's a type definition like this,
```python
T = TypeVar('T')
Alias = Union[int, str]
```

If we express it as a graph we can express it like below.
```
TypeVar
    T
Alias
    Union
        int
        str
```

Like this, Type can also form some structure.
To visit all of this structure, `SubtypeVisitor` also has the visitor pattern applied, as the name says.
Instead this visitor pattern doesn't traverse the AST, it traverses the type structure.

In Python, built-in types like int or str are also implemented as objects, same as classes we define ourselves.
So when type-checking, most types including these built-in types are specified as Instance types.

# Example

## a: int = b

As an example we'll look at the sentence `a: int = b`.

Looking at it as an AST node it's as below.
```
AssignmentStatement
    NameExpression
        Var
            a
    NameExpression
        Var
            b
```

This sentence is a sentence that assigns b to a.
There's a definition that a is an integer type, and we have to check whether b is compatible with a's type.

The left-hand side a is a `NameExpression`, and here it means a variable with the name a.
The right-hand side b is also a `NameExpression`, and here it means a variable with the name b.
A type might not be defined on b yet.

The left-hand side a already has a definition that it's an integer type, and this definition is in an object called `SymbolNode`.
`SymbolNode` is created in the semantic analysis stage, and this object has a name and a type.
This type is as a class called Type, and this class is the class that `TypeChecker` uses.

Since in Python even basic data types are objects, here it assigns in a way that puts integer-related information into a type called Instance.

Let's look at `TypeChecker`'s class structure again for a moment.
```
TypeChecker
    - expr_checker: ExpressionChecker
    - subtype_visitor: SubtypeVisitor
    ...
```

`TypeChecker` traverses the AST similarly to semantic analysis.
`TypeChecker` enters the visit_assignment_stmt function.
Instead here it finds out what the types of the left-hand side and right-hand side are.

But this `TypeChecker` only involves itself in interpreting the statement, and uses `ExpressionChecker` for interpreting the NameExpr of the left-hand side and right-hand side.
`ExpressionChecker` enters the visit_name_expr function.
In this process it checks b's type and assigns it.

Now we've found out what the types of the left-hand side and right-hand side are.
In the assignment `a: int = b`, it checks whether the right-hand side type is a subtype of the left-hand side type. That is, it inspects with `SubtypeVisitor` whether b's type is assignable to a's type.

This time `SubtypeVisitor` receives each type object.
The target to check is the type of the right-hand side (b), and the allowed type is the type of the left-hand side (a).

First let's assume the right-hand side is also an int type.
Then we could express the types like this.
```
a: Instance
    base: int
b: Instance
    base: int
```

Since variable b's type is an Instance type, it does the subtype check in `SubtypeVisitor`'s `visit_Instance` function.

If we look at `visit_Instance` one step more in detail, here it checks whether any of the right-hand side's base types have a fullname that matches the left-hand side's type.

At this point it doesn't check whether the types are exactly identical, it checks whether there's one whose fullname matches.
Even if the right-hand side is int and the left-hand side is object, object is in int's base so it's True.
When it's like this it judges that the right-hand side is a subtype of the left-hand side.

Then `TypeChecker` would receive true here, and when it's like this nothing happens at all.

Then would we also get true returned in a case like this?
```
a: Instance
    base: int
b: Instance
    base: object
```

In this case we get false returned. object is not a subtype of int so `a: int = b` is a type error.

Conversely, what if the left-hand side is object and the right-hand side is int?
```
a: Instance
    base: object
b: Instance
    base: int
```

In this case we get true returned. int's base type is object so the fullname matches the left-hand side, and `a: object = b` is allowed.

Then what about when the right-hand side is str?
```
a: Instance
    base: int
b: Instance
    base: str
```

At this time we get false returned because the right-hand side's str is not a subtype of the left-hand side's int.

If we received false, at this time an alert occurs in mypy.

## if isinstance

If you make mypy assume that some variable is a specific type with if isinstance, it really assumes that type and interprets.

For example if there's code like this,
```python
if isinstance(a, int):
    a = 1
```
Inside the block above mypy assumes a is an int type and interprets.

Let's look at how it makes this assumption.

As we saw above, `TypeChecker` has a conditional type binder that stores conditional types.

When `TypeChecker` visits an if statement it checks whether there's isinstance.
If there's isinstance, it creates information that some expression was defined as some type.
Now before visiting the if block it newly creates one frame and puts the updated type information in here.

If we express it, it's like this.
```
...
Frame N: a: int
```

The last frame holds the information most appropriate for the current context.
When checking types, `TypeChecker` uses this last frame to check types.

# Wrap up

That's how I explained the process by which mypy interprets the types of Python code.
Various objects like `TypeChecker`, `ExpressionChecker`, `ConditionalTypeBinder`, `PatternChecker`, `SubtypeVisitor` are used, and these are implemented using the visitor pattern.
Through these objects mypy can accurately check the types of Python code and prevent type errors in advance.
