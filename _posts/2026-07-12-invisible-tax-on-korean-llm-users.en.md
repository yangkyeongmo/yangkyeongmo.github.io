---
title: "The invisible tax on Korean LLM users"
date: 2026-07-12 15:00
categories: dev
tags: ["llm"]
published: false
lang: en
locale: en_US
ref: invisible-tax-on-korean-llm-users
permalink: /en/invisible-tax-on-korean-llm-users.html
---

It seems like the performance and cost gaps between languages in LLMs still haven't been overcome. LLMs are being developed by English-speaking users, so it's hard to expect non-English-speaking users to be taken care of across the whole training process. In the past, GPT-4.5's performance on multilingual MMLU (0-shot) was 89.6% for English and 86.0% for Korean, they say. Lower than English, but higher than GPT-4o's Korean score (82.9%).[^1] I checked whether it's improved recently, and the gap is still there.

Tokenizers are also mostly trained in the English-speaking world, so differences in token counts keep showing up. Will this trend probably keep going for a while? We're paying an invisible tax while talking with LLMs in Korean.

When I posted the above on Blind, I learned the opinion that on open models there's no difference between languages. I guess we really shouldn't just trust AI answers.

[^1]: OpenAI, [GPT-4.5 System Card](https://cdn.openai.com/gpt-4-5-system-card-2272025.pdf) (2025-02-27), Table 16 "MMLU Language (0-shot)". English (untranslated original) GPT-4.5 0.896, GPT-4o 0.887; Korean GPT-4.5 0.8603, GPT-4o 0.8289. I checked recent gaps on [Artificial Analysis Multilingual](https://artificialanalysis.ai/models/multilingual).
