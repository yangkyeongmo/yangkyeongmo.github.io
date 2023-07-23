---
title: "Mypy의 동작 방식: #2 파일 파싱"
date: 2023-07-23 15:00
categories: dev
tags: ["python"]
---

# Introduction

이 포스트에서는 [mypyind](https://github.com/yangkyeongmo/mypyind)를 작성하면서 mypy에 대해 부차적으로 공부했던 내용들을 정리했습니다.

이 포스트는 아래 포스트들로 연결됩니다.

[Mypy의 동작 방식: #1 진행 전 최적화](./2023-07-18-mypy-1-pre-optimization.md)

[Mypy의 동작 방식: #2 파일 파싱](./2023-07-23-mypy-2-parsing.md)

[Mypy의 동작 방식: #2-side mypy는 AST가 왜 필요할까?](./2023-07-23-mypy-2-1-why-ast.md)

[Mypy의 동작 방식: #3 의미 분석](./2023-07-24-mypy-3-semanal.md)

[Mypy의 동작 방식: #4 타입 체크(현재 글)](./2023-07-24-mypy-4-typecheck.md)

# Overview

// Fill this after writing all parts

# 클래스 구조

## TypeChecker

## ExpressionChecker

## ConditionalTypeBinder

## PatternChecker

## SubtypeVisitor

# 예시

## a: int = b

## if isinstance

# Wrap up
