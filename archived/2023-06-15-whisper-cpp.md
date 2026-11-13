---
title: "whisper-cpp"
date: 2023-06-15 15:00
categories: dev
tags: []
layout: post
lang: en
locale: en_US
ref: whisper-cpp
---

`Whisper.cpp` is a high-performant cpp port of openai's whisper. The project suggests it can transcribe an audio sample in realtime, so I tried that.

# Experiments
Here's the sample video: https://www.youtube.com/watch?v=dyxY6GRTiIs&t=371s
And here's a short excerpt from this command: `./stream -m ./models/ggml-base.en.bin -t 8 --step 500 --length 5000 -f output.txt`

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

The rest of the run went on like this — words drifting further from the audio after a few iterations.

It really sucks :(

I guessed that it might be because of my computer's performance, since the github repo suggested a better performance.
Maybe the step length was wrong. Sometimes it guessed correctly even when step length was 500(ms), but the transcript went wrong after some iteration.

Here's a short excerpt from this command: `./stream -m ./models/ggml-base.en.bin -t 16 --step 1500 --length 5000`

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

The rest of this run was in the same vein: mostly followable, with some special words still wrong.

Now it does seem kind of okay. When I was comparing with the video in realtime, it almost seemed good. It's not guessing some special words well, like midjourney, but it does seem fine to me. So the first settings were not usable for realtime transcription in my run, and the second was only roughly okay — not as reliable as the project's realtime claim had led me to expect.
