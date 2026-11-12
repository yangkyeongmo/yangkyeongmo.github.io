---
title: "whisper-cpp"
date: 2023-06-15 15:00
categories: dev
tags: []
published: false
---

`Whisper.cpp` is a high-performant cpp port of openai's whisper. By using this ported version, we could transcribe an audio sample in realtime.

# Experiments
Here's the sample video: https://www.youtube.com/watch?v=dyxY6GRTiIs&t=371s
And here's the transcript from this command: `./stream -m ./models/ggml-base.en.bin -t 8 --step 500 --length 5000 -f output.txt`

```
 market for that product on Etsy.
 market for that product on Etsy you'll be able to
 market for that product on Etsy still be able to ask the seven.
 market for that product on Etsy you'll be able, have to have a shop of fun.
 market for that product on Etsy, you'll be able to ask the 7 Shopify.
 market for that product on Etsy, you'll be able to ask the seller to do entire
 market for that product on Etsy, you'll be able to ask the seller to do an idea which is so.

 Sellers.
 - We all know...
 We all know oceans...
 We all know oceans is the best possible.
 We all know oceans is the best.
 We all know oceans is the best.
 We all know oceans is the best. That's why it costs impact.
 sellers. We all know oceans is the best. That's why it costs impact like

 like so much.
 I like so much sorry
 So much are anti-cated.
 like so much are anti-cated selling me.
 like so much our entire catered selling these job for.
 like so much are in dedicated selling these shop for the.
 Like, so much are in dedicated selling this shop for this dark...
 like so much are in tiddicated selling this shop for those dog errands on

 It's done over a million years.
 It's down over a million us in the past.
 done over a million us'd in the Paris.
 It's done over a million dollars in the Paris.
 done over a million us in the Paris.
 done over a million us in the Paris. This custom has been made in
 done over a million us in the Paris. This custom has been made in 2014.
 done over a million us in the pairs. This custom has demated the 40 toys and wraps up

 There are more shops like that.
 There are more shops like we're
 There are more shops like 'Where's another?'
 there are more shops like where's some other, but there's
 There are more shops like where's another one?
 There are more shops like where's another?
 There are more shops like where's another I
 There are more shops like where's another?

 and
 and we have...
 And we had to stick
 and we had to take over the...
 and we had to take over the tree.
 and we had to take over the rear.
 and we had to take over the years.
 and we had to take over the years.

 (mumbles)
 My dog was so dumb.
 No!
 It's a chag explanation, but we're not going to do that.
 I'm not going to say that in the same ages.
 So we are only saying the changes.
 Those are only zen pages.
 Our own mood is in ages.

 different.
 different of which.
 different of the
 different.
 different of the slip.

```
It really sucks :(

I guessed that it might be because of my computer's performance, since the github repo suggested a better performance.
Maybe the step length was wrong. Sometimes it guessed correctly even when step length was 500(ms), but the transcript went wrong after some iteration.

Here's output from this command: `./stream -m ./models/ggml-base.en.bin -t 16 --step 1500 --length 5000`

```
 Yes, there is really low competition.
 and you can make a really high profit margin,
 Images are probably very difficult to make. And you're probably right.
 If there's a much easier method to get similar results.
 Now the easiest method would be to buy the design directly from the design.
 for someone who already knows how to make it on a website like 5.
 If you did this, you could basically test out selling the product for your product.
 for yourself without having to worry about learning anything new.
 The second option obviously uses AI, but it's not
 not perfect so you would have to use a little bit of your own ability.
 to make this work. I went back into mid-journey, Mr. Attorney.
 trying to craft a prompt that would give me a portrait like Vovia.
 ones that sell. And honestly, this was pretty
 pretty easy to achieve. I took for a pet in a military unit.
 uniform and then just added some detail words to
 to the end of the prompt to see what kind of results I could get.
 to me these images look great and exactly like what
 like what I would want if I ordered one. But as I mentioned,
 are a few issues. First is that the uniforms and back
 backgrounds won't always generate exactly the same because the AI
 doesn't really do that. The second is you can't really use
 use the customer's photo to generate the pet's face.
 Their mid journey has rolled off some features like the blend mode to...
 to merge images that you might want to use together.
 but I really couldn't get this to work right.
 probably be too generated an image with a body that you liked.
 and then use Photoshop to remove the pet's head.
 and replace it with your customer's pet's image.
 and then apply a watercolor filter to hide any imperfection.
 like all of the other shops do. Again, you'd need to use your
 Use your own grilling at brain here to figure out all of the steps and skills in
 involved, but there's a lot of potential here to make much more
 more than a traditional nine to five income. Plus there's a lot of room here.
 here for scaling a larger Shopify brand that you might be able to
 to sell one day. Should I make an entire video going over this business?
 this idea or one of the ideas in this video let me know in a comment.
 comment section. The next idea came to me because I spend money
```

Now it does seem kind of okay. When I was comparing with the video in realtime, it almost seemed good. It's not guessing some special words well, like midjourney, but it does seem fine to me.
