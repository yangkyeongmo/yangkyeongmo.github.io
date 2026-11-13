---
title: "docker-compose vs docker compose"
date: 2023-01-20 15:00
categories: dev
tags: []
layout: post
lang: en
locale: en_US
ref: docker-compose-vs-docker-compose
permalink: /en/docker-compose-vs-docker-compose.html
machine_translated: true
original_url: /archived/2023-01-20-docker-compose-vs-docker-compose.html
---

# Overview

## Why I was curious

There was a part in internal docs asking to uncheck `Use Docker Compose V2` when creating a Test DB. So are they using Docker compose v1? I wondered what difference there was between v1 and v2 that they would use v1.

When I looked it up again later, the docker compose file for creating the test db was using v3.1. What meaning was there in unchecking the checkbox? Would Docker Compose v2 as spoken of by the Docker desktop engine, and the version that docker-compose.yml means, be different things?

# What `Use Docker Compose V2` means

Below is excerpted from [https://www.docker.com/blog/announcing-compose-v2-general-availability/](https://www.docker.com/blog/announcing-compose-v2-general-availability/).

> In most cases, you won’t need to do anything. Docker Desktop versions 3.4+ have Compose V2 installed automatically. On Docker Desktop version 4.4.2+, we enable aliasing of `docker-compose` syntax to `docker compose` by default. This lets you use V2 as a drop-in replacement for V1 while requiring minimal (if any) updates to your scripts.
> 
> You can see if you’re using aliasing via the “General” settings tab in Docker Desktop, by checking whether “Use Docker Compose V2” is selected. Please reference the “[What do I need to do if I’m still using Compose V1](https://www.docker.com/blog/announcing-compose-v2-general-availability/#still-using-compose-v1)” section of this blog for more information on migration. If you encounter any incompatibilities, please submit them [here](https://github.com/docker/compose/issues).

So `Use Docker Compose v2` is a way to check whether `docker-compose` is aliased to `docker compose`. It seems to be a feature for aliasing.

(The note had a screenshot of experiment results here.)

Results of trying it.

When I actually tried it, checking the `Use Docker Compose v2` option made `docker-compose` produce the same output as `docker compose`.

## Difference between `docker-compose` and `docker compose`

[https://stackoverflow.com/a/66516826](https://stackoverflow.com/a/66516826) Using the answer from someone registered as a docker captain named Brandon Mitchell.

They say docker compose v1 (python) used `docker-compose` and docker compose v2 (go) used `docker compose`.

Seems like that's because `docker-compose` got used usefully and was folded into the docker project..?

# Other differences

The v1/v2 version I had in mind seems to have been the spec version of the Docker compose file. The compose file format version and the docker compose version seem to be distinguished. For example the version you write on the first line of docker-compose.yml seems to be the format version.

[https://docs.docker.com/compose/compose-file/compose-versioning/](https://docs.docker.com/compose/compose-file/compose-versioning/)

## Benefits of using Docker compose v2

[https://www.docker.com/blog/announcing-compose-v2-general-availability/](https://www.docker.com/blog/announcing-compose-v2-general-availability/)

### Faster delivery of new features

As distinguished above, the compose file spec and the compose CLI version are different. The V2 GA blog lists the following as new features, but GPU reservation and profile are compose file spec features, so it's hard to see them as benefits of the v2 CLI alone.

-   Can set it up to use GPU instances: not sure how much it'd be used on the server side, but it seems usable when composing deep learning training with docker compose
-   profile: whether a given container runs is decided according to the currently set profile.
    -   Seems like you could also manage several servers with the same compose file?

and so on.

### Cloud integration got easier

Integration with ECS got easier. There's an example; it'd be nice to follow along later.

[GitHub - docker/compose-cli: Easily run your Compose application to the cloud with compose-cli](https://github.com/docker/compose-cli#examples)

### Made in Go

Other docker projects are in go, so docker-compose alone was an outlier, they say.

### Easier to provide a cross platform binary

When making a binary for cross platform support, python isn't a native feature so providing a binary was hard. Moving to Go made it easier to provide a binary. In embedded environments like a raspberry pi, you can use docker compose just by installing the binary, without pip install.

-   Taking it one step further, when you want to minimize dependencies, you could install only the docker compose binary on the server and use it.

### Can run commands without a compose file

One of the new features. Originally you could only run docker compose commands if you had a docker compose file, but even if you're not in the same location as the compose file you can use docker compose by specifying a project name.

## When does V1 support end?

(The note had a docker compose roadmap image here.)

The docker compose roadmap.

On new Docker Desktop, from **April 2023** you cannot opt out of v2, they say. Meaning on new versions you can't choose not to use `docker compose`, but the user aliasing `docker-compose` to `docker compose` itself is still possible. V1 support itself lasts until June 2023. Simply put, new Desktop only uses `docker compose` from April, and V1 support ends in June.

## Question

-   Then why are they forcing docker-compose (=v1), which is deprecated and written in python?
