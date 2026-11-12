---
title: "Fixing an Elasticsearch ConnectionRefuse error"
date: 2022-07-25 21:01
categories: dev
tags: ["elasticsearch"]
lang: en
locale: en_US
ref: elasticsearch-connection-refuse
permalink: /en/elasticsearch-connection-refuse.html
---

## Situation

At the company we build servers with Python and Django and test with pytest. We use docker-compose to bring up several containers at once and run pytest inside a new container, but I started working from home occasionally and used the desktop at home, and somehow the tests didn't work. Seeing that the MacBook worked fine and only the desktop at home didn't, it seemed like the desktop environment was the problem.

The problem was failing to connect to Elasticsearch. Some tests proceed by referring to the ES used locally, and the connection failed then.

## Behaviour

First I checked the address that failed to connect. It was an address like `[http://elasticsearch:9200](http://elasticsearch:9200)`.

At the time I didn't know that Docker's user-defined network does auto DNS resolution, so I thought the address itself was the problem. But the same address is used on the MacBook too, so I thought there shouldn't be a problem.

Then I thought about the classic developer interview question "what happens when you type [google.com](http://google.com) in a browser" and thought about how, when you send an HTTP request, you have to do DNS resolution to turn the domain name into an IP address. That would mean somewhere is doing DNS resolution for the name "elasticsearch".

I investigated thinking docker would do it, and docker's user-defined bridge network was doing DNS resolution. [I wrote up the related material.](/en/docker-network.html)

But when I went into a container and pinged by the name of a container on the same network, I confirmed that DNS resolution worked normally.

I proceeded assuming there was nothing wrong with the Docker network. Then I suddenly wondered what it would look like if I went into the elasticsearch container.

I attached and went in, and unlike the MacBook where it had been almost quiet with barely any logs, on the desktop at home the elasticsearch container was printing a lot of logs in realtime. Checking, there was a memory-related error, so it couldn't bring elasticsearch up and kept repeating the process of trying to initialize and then dying. I referred to the related material at the link below.

[https://security-log.tistory.com/37](https://security-log.tistory.com/37)

## Impact

In the end the problem was solved by changing sysctl, and I could make an environment where I could test the same as on the MacBook.

Diving deep like this, reviewing network knowledge and getting to know Docker network, was enjoyable.

I also found a clue about a way of learning that creates enjoyment. I first learned the abstract theory, pictured it in my head, explained it out loud to myself, and wrote it on paper, summarizing it my way. Then when I did the hands-on, I could feel the wow of "so that's what I learned earlier, for real!" which was fun, and before the hands-on I could feel the curiosity of "is it actually like this? how can I check?" which was also fun.
