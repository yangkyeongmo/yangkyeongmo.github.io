---
title: "Docker Elasticsearch에서 rt.jar를 못 읽는 에러"
date: 2023-06-15 15:00
categories: dev
tags: ["docker", "elasticsearch"]
published: false
lang: ko
locale: ko_KR
ref: docker-elasticsearch-rt-jar
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

위와 같은 에러가 계속해서 발생.

```
root@f872347f3949: /var/lib/elasticsearch # ls /usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar -al
-rw-r--r-- 1 root root 34830838 Aug 12  2019 /usr/lib/jvm/java-1.8-openjdk/jre/lib/rt.jar
```

해당 파일은 있음.

[같은 에러를 겪은 사람](https://github.com/pires/kubernetes-elasticsearch-cluster/issues/84)이 있는데 버전 업그레이드로 해결.

`Modify "mem_limit" setting to be not lower than elasticsearch's Xms/Xmx.` 라는 의견 있음.

“mem_limit”?

[docker-compose에서 mem_limit을 쓸 수 있는지](https://stackoverflow.com/questions/28837544/can-i-use-mem-limit-in-docker-compose-and-how)를 찾아보니, docker-compose v3 에서는 아래 형태로 쓴다. [버전 변경사항](https://docs.docker.com/compose/compose-file/compose-versioning/#version-2x-to-3x)에 나와있다.

```
deploy:
  resources:
    limits:
      memory: 60m
```

변경해도 해결 안 됨.

[Java가 rt.jar를 못 읽는 이유](https://stackoverflow.com/questions/16860573/why-can-java-not-read-rt-jar)를 보다가, `It looks like your copy of rt.jar has become corrupted: some program has overwritten it with garbage. To fix it you should get a fresh copy from somewhere, or reinstall the JDK.` 라는 얘기가 있어서 elasticsearch image 지우고 다시 pull 해봤더니 잘 된다.
