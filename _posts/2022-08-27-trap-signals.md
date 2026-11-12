---
title: "Ctrl+C와 docker stop, trap으로 시그널 잡기"
date: 2022-08-27 21:48
categories: dev
tags: ["bash", "docker", "signal"]
published: false
lang: ko
locale: ko_KR
ref: trap-signals
---

아래와 같은 node 서버는 Ctrl+C 를 입력해도 정지되지 않는다.

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 80;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

node server 는 별다른 지정을 하지 않으면 SIGINT를 핸들링하지 않도록 되어있는듯 하다. 공식 문서 상으로는 `SIGTERM`, `SIGINT` 는 non-windows 환경에서는 기본 핸들러를 사용하도록 되어있고([참조](https://nodejs.org/api/process.html)) terminal raw mode 가 켜져있으면 Ctrl+C 눌러도 SIGINT 가 발생하지 않는다고 되어있다([참조](https://nodejs.org/api/tty.html#readstreamsetrawmodemode)).

하지만 위 코드를 docker 로 containerize 해 띄우고 Ctrl + C 를 했을때는 프로세스가 죽지 않지만 `docker stop` 으로 제거했을 때는 일정 시간이 지난 후 프로세스가 죽는다. `docker stop` 커맨드는 처음에 `SIGTERM` 을 보내고 그 다음 `SIGKILL` 을 보낸다.

[참조한 문서](https://dsa.cs.tsinghua.edu.cn/oj/static/unix_signal.html)에 따르면 `SIGTERM` 은 catch 해도 되는 시그널인듯 하고 `SIGINT`와 유사하다고 한다. 그 목적이 프로세스 종료인 것은 `SIGKILL` 과 동일하다. 동일한 문서에 따르면 `SIGKILL`은 catch 하거나 ignore 할 수 없는 시그널이라고 한다. `SIGKILL` 의 경우 프로세스 종료 전에 cleanup을 할 수 없다고 한다. 이를 통해 `docker stop` 이 일정 시간 뒤에 `SIGKILL` 을 보냈을 때는 프로세스가 무조건 종료되었던 것을 설명할 수 있게 되었다.

## 한 걸음 더

`trap` 커맨드를 이용해 특정 시그널을 catch 해 다른 명령어를 실행하도록 할 수 있다.

Trap table은 유저가 syscall 을 사용하기 위해 있는 메모리에 올라가있는 테이블으로, user mode의 프로세스가 trap table의 위치를 메모리에 등록해두면 OS가 kernel mode 에서 해당 위치를 읽어 syscall을 발생시킨다. 터미널이 trap table의 위치를 따로 가지고있는건 아닐까?

아래 스크립트는 SIGINT가 발생했을 때 `date` 커맨드를 실행한다. 그 결과 Ctrl+C 로 SIGINT를 보내면 date 커맨드가 호출된다.

```bash
#!/bin/bash

trap date SIGINT

read input
echo User input: $input
echo Exiting now
```

```
~/src/study/docker$ bash test.sh
^C2022. 08. 27. (토) 21:48:51 KST
```

하지만 Ctrl+D를 입력하면 아래와 같이 스크립트가 종료된다. 이는 Ctrl+D 가 POSIX signal 을 보내는 것이 아니라 EOF를 의미하기 때문이다. 위 스크립트에서는 input을 읽도록 했고 Ctrl+D 로 EOF를 알리면 입력이 마무리되어 프로세스가 종료된다.

```
~/src/study/docker$ bash test.sh
^C2022. 08. 27. (토) 21:48:51 KST
User input:
Exiting now
```

아래 스크립트는 Ctrl+D 를 입력해도 종료되지 않는다. input을 받았을 때 종료되는 형태가 아니기 때문이다.

```bash
#!/bin/bash

trap date SIGINT

while [ 1 ];
do
        sleep 1
done
```

이 [사이트](https://mug896.github.io/bash-shell/trap.html)의 자료가 유용해보인다.
