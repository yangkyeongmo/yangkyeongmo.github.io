---
title: "Elasticsearch ConnectionRefuse 에러 해결하기"
date: 2022-07-25 21:01
categories: dev
tags: ["elasticsearch"]
---

## Situation

회사에서는 Python과 Django로 서버를 만들고 pytest로 테스트를 하고있다. docker-compose를 사용해서 여러 컨테이너를 한 번에 띄우고 새 컨테이너 안에서 pytest를 돌리는 식인데, 재택을 간혹 하게 되면서 집에 있는 데스크탑을 사용하니 이상하게 테스트가 안 됐다. 맥북은 잘 되고 집의 데스크탑만 안 되는 것으로 봐서 데스크탑의 환경이 문제인것 같았다.

Elasticsearch에 연결을 실패하는 것이 문제였다. 일부 테스트가 로컬에서 사용하는 ES를 참조해서 진행하는데, 이 때 연결에 실패했다.

## Behaviour

우선 연결에 실패하는 주소를 확인했다. `[http://elasticsearch:9200](http://elasticsearch:9200)` 같은 주소였다.

당시 Docker의 user-defined network 가 auto DNS resolution 을 해준다는 것을 몰랐기 때문에 이 주소 자체가 문제인 것으로 생각했다. 하지만 같은 주소를 맥북에서도 사용하고 있으므로 문제가 없을 것이라 생각했다.

그러던 중 개발자 면접 단골 질문인 “브라우저에 [google.com](http://google.com) 을 입력하면 일어나는 일”을 생각해보고 HTTP 요청을 보낼 때 DNS resolution을 해서 domain name을 IP 주소로 바꿔야한다는 것을 생각해봤다. 그렇다면 어디선가 “elasticsearch” 라는 이름에 대해 DNS resolution을 해 준다는 뜻이 되겠다.

관련해서 docker가 해줄 것으로 생각하고 조사해봤고, docker의 user-defined bridge network 가 DNS resolution을 해주고 있었다. [관련 내용을 정리했다.](/docker-network.html)

하지만 컨테이너 내부에 들어가서 같은 네트워크에 속한 컨테이너의 이름으로 ping을 해봤을 때 정상적으로 DNS resolution이 되는 것이 확인됐다.

Docker network에는 이상이 없는 것으로 가정하고 진행했다. 그렇다면 elasticsearch 컨테이너 안에 들어가면 어떻게 되어있을까가 문득 궁금해졌다.

Attach 해서 들어가봤더니 맥북에서는 거의 로그가 없이 잠잠했던 것과는 다르게 집의 데크스탑에서는 elasticsearch 컨테이너가 로그를 실시간으로 많이 띄우고 있었다. 확인해보니 메모리 관련 에러가 있어 elasticsearch 를 띄우지 못하고 계속 초기화하려 했다가 끝나는 과정을 반복하고 있었다. 관련 내용은 아래 링크에서 참조했다.

[https://security-log.tistory.com/37](https://security-log.tistory.com/37)

## Impact

결국 문제는 sysctl을 변경하는 것으로 해결되어 맥북과 동일하게 테스트할 수 있는 환경을 만들 수 있었다.

이런 식으로 딥 다이브 하면서 네트워크 지식을 복기하고 Docker network에 대해 알아갈 수 있어서 즐거웠다.

즐거움을 만드는 학습 방식에 대한 실마리도 찾았다. 추상적인 이론을 먼저 학습하며 머릿속에 그리고, 스스로에게 말하며 설명하고, 종이에 쓰는 것을 같이 하면서 내 방식대로 요약하는 것을 먼저 했다. 그런 다음에 실습을 하니 실습할 때는 ‘아까 배웠던게 실제로 이렇구나!’ 라는 감탄을 느낄 수 있어 재밌었고, 실습하기 전에는 ‘실제로 이럴까? 어떻게 확인할 수 있을까?’ 하는 호기심을 느낄 수 있어 재밌었다.
