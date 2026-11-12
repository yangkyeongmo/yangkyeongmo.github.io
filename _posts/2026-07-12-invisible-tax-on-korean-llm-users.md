---
title: "한국인 LLM 사용자의 보이지 않는 세금"
date: 2026-07-12 15:00
categories: dev
tags: ["llm"]
published: false
lang: ko
locale: ko_KR
ref: invisible-tax-on-korean-llm-users
---

LLM의 언어 간 성능, 비용 차이가 아직 극복되지 않은 것 같다. 아무래도 영어권 사용자에 의해 LLM이 개발되고 있다 보니 훈련 전체 과정에서 비영어권 사용자를 배려할 것을 기대하기는 어렵다. 과거에도 GPT-4.5의 성능이 다국어 MMLU(0-shot) 기준으로 영어는 89.6%일 때 한국어는 86.0%였다고 한다. 영어보다는 낮지만, GPT-4o의 한국어 점수(82.9%)보다는 높은 수치이다.[^1] 최근에 개선되었는지 확인해 보았더니 여전히 차이는 존재한다.

토크나이저도 대체로 영어권에서 훈련되다 보니 토큰 개수의 차이가 계속 발생한다. 이 문제는 아마 당분간은 계속 추세가 유지되지 않을까? 우리는 LLM과 한국어로 대화하면서 보이지 않는 세금을 내고 있는 것이다.

위 내용을 블라인드에 올렸더니, 오픈 모델 기준으로는 언어 간 차이가 없다는 의견을 알게 되었다. 역시 AI 답변만 믿으면 안 되겠구나.

[^1]: OpenAI, [GPT-4.5 System Card](https://cdn.openai.com/gpt-4-5-system-card-2272025.pdf) (2025-02-27), Table 16 "MMLU Language (0-shot)". 영어(번역하지 않은 원문) GPT-4.5 0.896, GPT-4o 0.887; 한국어 GPT-4.5 0.8603, GPT-4o 0.8289. 최근 차이는 [Artificial Analysis Multilingual](https://artificialanalysis.ai/models/multilingual)에서 확인했다.
