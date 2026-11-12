---
title: "docker-compose vs docker compose"
date: 2023-01-20 15:00
categories: dev
tags: []
published: false
---

# 개요

## 궁금했던 이유

사내 문서에 Test DB 생성 시 `Use Docker Compose V2` 체크를 해제해달라는 부분이 있었다. 그럼 Docker compose v1 을 쓰는건가? 싶어서 v1과 v2에 어떤 차이가 있길래 v1을 쓰는건지 궁금했다.

나중에 다시 찾아보니 test db 생성을 위한 docker compose 파일은 v3.1을 사용하고 있었다. 체크박스를 해제하는데에 어떤 의미가 있었던걸까? Docker desktop engine 이 말하는 Docker Compose v2 와 docker-compose.yml 의 버전이 의미하는 것은 다를까?

# `Use Docker Compose V2` 의 의미

아래는 [https://www.docker.com/blog/announcing-compose-v2-general-availability/](https://www.docker.com/blog/announcing-compose-v2-general-availability/) 에서 발췌한 내용.

> In most cases, you won’t need to do anything. Docker Desktop versions 3.4+ have Compose V2 installed automatically. On Docker Desktop version 4.4.2+, we enable aliasing of `docker-compose` syntax to `docker compose` by default. This lets you use V2 as a drop-in replacement for V1 while requiring minimal (if any) updates to your scripts.
> 
> You can see if you’re using aliasing via the “General” settings tab in Docker Desktop, by checking whether “Use Docker Compose V2” is selected. Please reference the “[What do I need to do if I’m still using Compose V1](https://www.docker.com/blog/announcing-compose-v2-general-availability/#still-using-compose-v1)” section of this blog for more information on migration. If you encounter any incompatibilities, please submit them [here](https://github.com/docker/compose/issues).

즉 `Use Docker Compose v2` 는 `docker-compose` 를 `docker compose` 로 aliasing 하는지를 확인하는 방편. Aliasing을 위한 기능인듯하다.

(노트에는 여기에 실험 결과 스크린샷이 있었음.)

실험해본 결과.

실제로 실험해보니 `Use Docker Compose v2` 옵션을 체크하니 `docker-compose` 로 해도 `docker compose` 와 동일한 출력이 나온다.

## `docker-compose` 와 `docker compose` 의 차이

[https://stackoverflow.com/a/66516826](https://stackoverflow.com/a/66516826) Brandon Mitchell 이라는 docker captain 으로 등록된 분 답변을 사용.

docker compose v1(python) 에서 `docker-compose` 를 사용했고 docker compose v2(go) 에서 `docker compose` 를 사용했다고 한다.

`docker-compose` 가 유용하게 사용되면서 도커 프로젝트의 일부로 편입되어서 그런듯..?

# 다른 점

생각했던 v1/v2 버전은 Docker compose file 의 스펙 버전이었던듯 하다. Compose file 포맷의 버전 과 docker compose 버전이 구분되고 있는듯함. 예를 들어 docker-compose.yml 첫 줄에 적는 version 은 포맷의 버전인듯.

[https://docs.docker.com/compose/compose-file/compose-versioning/](https://docs.docker.com/compose/compose-file/compose-versioning/)

## Docker compose v2 사용의 이점

[https://www.docker.com/blog/announcing-compose-v2-general-availability/](https://www.docker.com/blog/announcing-compose-v2-general-availability/)

### 더 빠른 신규 기능 제공

위에서 구분했듯 compose file 스펙과 compose CLI 버전은 다르다. V2 GA 블로그는 아래를 새 기능으로 적고 있지만, GPU 예약이나 profile은 compose file 스펙 쪽 기능이고, v2 CLI만의 이점이라고 보기는 어렵다.

-   GPU 인스턴스 사용하도록 세팅 가능: 서버 측에서는 많이 사용할지 모르겠지만 docker compose 로 딥러닝 훈련 구성할 때 사용할 수 있을듯
-   profile: 특정 컨테이너가 현재 세팅된 profile 에 따라 실행 여부 결정됨.
    -   여러 서버를 같은 compose file 로 관리할 수도 있게 되는듯?

등등.

### Cloud integration 이 더 쉬워짐

ECS와의 integration 이 더 쉬워졌다. 예시가 있는데 나중에 따라해보면 좋을것 같다.

[GitHub - docker/compose-cli: Easily run your Compose application to the cloud with compose-cli](https://github.com/docker/compose-cli#examples)

### Go 로 만들어짐

다른 docker 프로젝트들은 go 로 되어있어서 docker-compose 만 outlier 였다고 함.

### cross platform binary 제공이 쉬워짐

cross platform 지원을 위해 binary 만들 때 python은 native 한 기능이 아니기 때문에 binary 제공이 어려웠음. Go로 옮기면서 binary를 더 쉽게 제공할 수 있게 됨. raspberry pi 같은 임베디드 환경에서 pip install 하지 않고도 binary 설치만으로 docker compose 를 사용할 수 있게 됨.

-   한 발 더 나가보자면 의존성을 최소화하고싶을 때, 서버에 docker compose binary 만 설치해서 사용할 수 있을듯.

### compose file 없이 커맨드 실행 가능

신규 기능 중 하나. 원래는 docker compose file 이 있어야만 docker compose 커맨드를 실행할 수 있었는데, compose file 과 같은 위치에 있지 않아도 docker compose 를 프로젝트 명 지정으로 사용할 수 있음.

## 언제 V1 지원이 끝나나?

(노트에는 여기에 도커 컴포즈 로드맵 이미지가 있었음.)

도커 컴포즈의 로드맵.

새 Docker Desktop에서는 **2023년 4월부터** v2 에서 opt-out 할 수 없다고 한다. 즉 새 버전에서는 `docker compose` 를 사용하지 않도록 하는건 불가한데, `docker-compose` 를 유저가 `docker compose` 로 alias 하는것 자체는 가능함. V1 지원 자체는 2023년 6월까지다. 쉽게 말하면 새 Desktop에서는 4월부터 `docker compose` 만 쓰게 되고, V1 지원은 6월에 끝난다.

## 궁금증

-   그럼 deprecate 됐고 python 으로 되어있는 docker-compose(=v1) 을 왜 강제하고있는거지?
