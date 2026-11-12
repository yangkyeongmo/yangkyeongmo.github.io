---
title: "Error where Docker Elasticsearch can't read rt.jar"
date: 2023-06-15 15:00
categories: dev
tags: ["docker", "elasticsearch"]
published: false
lang: en
locale: en_US
ref: docker-elasticsearch-rt-jar
permalink: /en/docker-elasticsearch-rt-jar.html
machine_translated: true
original_url: /docker-elasticsearch-rt-jar.html
---

```
Fixing base permissions...
Fixing config permissions...
Launching elasticsearch instance...
/usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar: error reading zip file
/usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar: error reading zip file
/usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar: error reading zip file

Exception: java.lang.NoClassDefFoundError thrown from the UncaughtExceptionHandler in thread "main"
/usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar: error reading zip file
```

The error above kept happening.

```
root@f872347f3949: /var/lib/elasticsearch # ls /usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar -al
-rw-r--r-- 1 root root 34830838 Aug 12  2019 /usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar
```

The file is there.

[Someone who hit the same error](https://github.com/pires/kubernetes-elasticsearch-cluster/issues/84), and they solved it with a version upgrade.

There's an opinion: `Modify "mem_limit" setting to be not lower than elasticsearch's Xms/Xmx.`

"mem_limit"?

I looked up [whether you can use mem_limit in docker-compose](https://stackoverflow.com/questions/28837544/can-i-use-mem-limit-in-docker-compose-and-how), and in docker-compose v3 you use the form below. It's in the [version changes](https://docs.docker.com/compose/compose-file/compose-versioning/#version-2x-to-3x).

```
deploy:
  resources:
    limits:
      memory: 60m
```

Changing it didn't fix it.

While looking at [why Java can't read rt.jar](https://stackoverflow.com/questions/16860573/why-can-java-not-read-rt-jar), there was a comment `It looks like your copy of rt.jar has become corrupted: some program has overwritten it with garbage. To fix it you should get a fresh copy from somewhere, or reinstall the JDK.`, so I deleted the elasticsearch image and pulled again and it works.
