---
title: "whisper-cpp"
date: 2023-06-15 15:00
categories: dev
tags: []
lang: ko
locale: ko_KR
ref: whisper-cpp
permalink: /ko/whisper-cpp.html
machine_translated: true
original_url: /whisper-cpp.html
---

`Whisper.cpp`는 openai의 whisper를 고성능으로 포팅한 cpp 포트입니다. 프로젝트가 오디오 샘플을 실시간으로 받아 적을 수 있다고 해서, 그걸 시도해 봤습니다.

# Experiments
샘플 영상은 여기: https://www.youtube.com/watch?v=dyxY6GRTiIs&t=371s
그리고 이 명령의 짧은 발췌입니다: `./stream -m ./models/ggml-base.en.bin -t 8 --step 500 --length 5000 -f output.txt`

```
 market for that product on Etsy.
 market for that product on Etsy you'll be able to
 market for that product on Etsy still be able to ask the seven.
 market for that product on Etsy you'll be able, have to have a shop of fun.
 market for that product on Etsy, you'll be able to ask the 7 Shopify.
 ...
 We all know oceans is the best possible.
 We all know oceans is the best. That's why it costs impact.
 ...
 It's done over a million years.
 It's down over a million us in the past.
 done over a million us'd in the Paris.
 It's done over a million dollars in the Paris.
```

나머지 실행도 이런 식이었습니다 — 몇 번 반복하고 나면 단어가 오디오에서 점점 더 멀어졌습니다.

정말 별로입니다 :(

깃허브 저장소가 더 나은 성능을 제시했으니, 내 컴퓨터 성능 때문일 수도 있겠다고 추측했습니다.
스텝 길이가 잘못됐을 수도 있습니다. 스텝 길이가 500(ms)여도 가끔은 맞게 맞혔지만, 몇 번 반복하고 나면 전사가 틀어졌습니다.

이 명령의 짧은 발췌입니다: `./stream -m ./models/ggml-base.en.bin -t 16 --step 1500 --length 5000`

```
 Yes, there is really low competition.
 and you can make a really high profit margin,
 Images are probably very difficult to make. And you're probably right.
 ...
 The second option obviously uses AI, but it's not
 not perfect so you would have to use a little bit of your own ability.
 to make this work. I went back into mid-journey, Mr. Attorney.
 trying to craft a prompt that would give me a portrait like Vovia.
```

이 실행의 나머지도 같은 결이었습니다: 대체로 따라갈 만하고, 일부 특수한 단어는 여전히 틀렸습니다.

이제는 좀 괜찮은 것 같기도 합니다. 영상과 실시간으로 비교할 때는 거의 좋아 보이기도 했습니다. midjourney 같은 특수한 단어는 잘 못 맞히지만, 제게는 괜찮아 보입니다. 그래서 첫 설정은 제 실행에서 실시간 전사에 쓸 수 없었고, 두 번째는 대략 괜찮은 정도였을 뿐 — 프로젝트가 말하는 실시간 주장만큼 믿을 만하지는 않았습니다.
