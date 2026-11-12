---
title: "Domain, CORS, and performance issues while putting LiveTTS up"
date: 2023-07-16 17:56
categories: dev
tags: ["livetts", "dns", "nginx"]
published: false
lang: en
locale: en_US
ref: livetts-deploy-issues
permalink: /en/livetts-deploy-issues.html
machine_translated: true
original_url: /livetts-deploy-issues.html
---

After that a problem comes up where only I can reach it by domain name. Access worked, so I thought everything was ready and asked for a site test, and they said they couldn't reach the domain. Turns out it was a domain-related issue.

When you turn a domain name into an IP address you go through DNS, and the server that holds the domain name is a name server, NS for short. Each NS can hold different names, so if you set this wrong, people might not find my domain over the internet.

This case is a fitting example. I had already bought the `planmoji.com` domain and registered NS at Gabia. At that time I only used that domain, so only `planmoji.com` and `www.planmoji.com` were registered. At that time I used Route53.

But this time I want to bring the service up as `speak.planmoji.com`. Last time I used Route53, but this time I used Lightsail for convenience. When Lightsail sets up the network it either brings up a new NS or tells you an address for registering NS.

So you get a setup like this.

- Previous info
    - `www.planmoji.com`
    - `planmoji.com`
- New info
    - `speak.planmoji.com`

I had bought the domain at Gabia so I registered NS at Gabia. I knew nothing, so I registered the NS holding the previous info as ranks 1–4 and after that registered the NS holding the new info as ranks 5–8.

So the previous NS that received `speak.planmoji.com` naturally judged it wasn't a separate address but a subdomain of `planmoji.com`, and answered "there's no such thing!"

After that I registered the NS holding the new info as ranks 1–4, waited about 5 minutes, and everyone could see `speak.planmoji.com`.

## CORS

CORS issues keep happening. While developing, HTTPS not working had already been bothering me, and on StackOverflow there's talk that the CORS issue might be okay if you enable HTTPS. I had been meaning to enable it someday anyway, so I decided to try it once. HTTPS setup is in [a post I wrote before](/en/https-setup.html).

After that, trying to fix the CORS issue really made me sweat. I kept getting an error matching [CORSDidNotSucceed](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSDidNotSucceed), and it turned out there was something I'd thought about wrong.

The flow of sending a request to the server is as below.

1. The browser requests a JavaScript file from the server
2. The JavaScript says "request `localhost:8000`"
3. The browser requests "the client's `localhost:8000`"

The browser only knows to request `localhost:8000`. If you do it locally this address means port 8000 on my local, and port 8000 on my computer is looking at the server application, so it works. But of course there's no server on the user's port 8000. So an error happens. That was really careless.

## Performance tuning with Jmeter

### Test plan

1. Load test
    - RPS: 10
    - Time: 6h
    - Workload: Random
2. Spike test
    - RPS: 50
    - Time: 10m
    - Workload: Random

### Test results

(The note had test result images here.)

Test results.

#### 500RPS, 600s, caching

In the first test I sent 0000–9999 at random so there was a lot of caching. At that time it took about 480RPS.

#### 500RPS, 100s, all fresh

In the second test I sent 10000–99999 at random to try fetching everything fresh. At that time about 120RPS happened and errors came out a lot, around 40%.

To see why the errors happened I looked at `/var/log/nginx/errors.log` and there was an error log like below.

```
2023/05/05 12:30:49 [alert] 176093#176093: *59377 768 worker_connections are not enough while connecting to upstream, client: [redacted], server: speak.planmoji.com, request: "GET /api/speak?text=67710 HTTP/1.1", upstream: "http://127.0.0.1:8000/speak?text=67710", host: "speak.planmoji.com"
```

### Analyzing the error cause

When I tested locally, a newly occurring polly request takes about 200ms. A request the client made is handled by one nginx worker taking the connection. If every connection has to wait that long, max RPS is about worker_connections divided by wait time per request. If it's 200ms locally the theoretical upper bound should be around five times worker_connections, but in practice this error happened once RPS went over 150. This calculation alone doesn't seem enough to explain it. If you can't secure a connection, a 500 error happens.

This is an error that would happen in the happy situation of RPS going over 150, so considering the investment cost I don't fix it for now.

## Locale performance

(There was a profiler image in the note.)

After increasing Locale to 20+, entering started taking 10+ seconds. Checking with a profiler, for about 8 seconds it was receiving a request from a domain called `https://api.country.is` and doing a dom paint.

Turns out the `country_ip` package was calling an API on that domain to get the ip, and when I removed it I could confirm the same request didn't happen.

## Reaction after launch

(The note had an analytics image here.)

Reached 25 users in two days after advertising on reddit!!

- Which decreased down to 5 users on 06/09/2023.
- [Reddit post 1](https://www.reddit.com/r/mute/comments/1438yg3/speak_instantly_with_a_tts_i_made_might_help/)
- [Reddit post 2](https://www.reddit.com/r/AssistiveTechnology/comments/1438u3t/i_made_a_texttospeech_website_that_speaks_word_by/)

- Make an app
    - Connection-free version
        - Since 90kbps(=about 12kB/s) mp3 is about 15kb for a word(from guessing a word would take 1~2 seconds), maybe storing up to 60,000 words would take about 100MB. Then, I could provide downloadable language pack.
    - Internet version
        - If one needs something better, they could use premium internet version. This would include more words, more voices or else.
