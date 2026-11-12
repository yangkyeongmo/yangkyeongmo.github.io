---
title: "Catching signals with Ctrl+C, docker stop, and trap"
date: 2022-08-27 21:48
categories: dev
tags: ["bash", "docker", "signal"]
published: false
lang: en
locale: en_US
ref: trap-signals
permalink: /en/trap-signals.html
---

A node server like the one below doesn't stop even if you type Ctrl+C.

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

A node server, if you don't specify otherwise, seems to be set not to handle SIGINT. Officially `SIGTERM` and `SIGINT` are set to use the default handler in non-windows environments ([ref](https://nodejs.org/api/process.html)), and if terminal raw mode is on, pressing Ctrl+C doesn't generate SIGINT ([ref](https://nodejs.org/api/tty.html#readstreamsetrawmodemode)).

But when I containerized the code above with docker and brought it up, the process didn't die on Ctrl+C, but when I removed it with `docker stop` the process dies after a certain amount of time. The `docker stop` command first sends `SIGTERM` and then sends `SIGKILL`.

According to [the document I referred to](https://dsa.cs.tsinghua.edu.cn/oj/static/unix_signal.html), `SIGTERM` seems to be a signal you're allowed to catch, and it's similar to `SIGINT`. Its purpose being process termination is the same as `SIGKILL`. According to the same document, `SIGKILL` is a signal you cannot catch or ignore. For `SIGKILL`, they say you cannot cleanup before the process terminates. Through this I could explain why, when `docker stop` sent `SIGKILL` after a certain time, the process always terminated.

## One step further

You can use the `trap` command to catch a specific signal and run another command.

A trap table is a table sitting in memory so the user can use a syscall; if a user-mode process registers the trap table's location in memory, the OS reads that location in kernel mode and fires the syscall. Maybe the terminal holds the trap table's location separately?

The script below runs the `date` command when SIGINT occurs. As a result, if you send SIGINT with Ctrl+C, the date command is called.

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

But if you type Ctrl+D the script exits as below. That's because Ctrl+D doesn't send a POSIX signal; it means EOF. In the script above it was set to read input, and if you signal EOF with Ctrl+D the input is finished and the process exits.

```
~/src/study/docker$ bash test.sh
^C2022. 08. 27. (토) 21:48:51 KST
User input:
Exiting now
```

The script below doesn't exit even if you type Ctrl+D. That's because it isn't a form that exits when it receives input.

```bash
#!/bin/bash

trap date SIGINT

while [ 1 ];
do
        sleep 1
done
```

The material on [this site](https://mug896.github.io/bash-shell/trap.html) looks useful.
