---
title: "Docker Network 정리"
date: 2022-07-24 21:09
categories: dev
tags: []
---

https://docs.docker.com/network/를 참조했음.

## Overview

도커는 여러 컨테이너가 띄워졌을 때 그들이 서로 통신하기 위한 방법을 제공한다.

통신하기 위한 **드라이버**가 여러 종류가 있다.

- bridge: 기본 드라이버, 특정하지 않으면 기본으로 여기에 연결되도록 지정된다.
- host: 호스트의 네트워크에 연결한다.
- overlay: 여러 도커 데몬을 연결해서 swarm service(?)가 서로 통신할 수 있도록 한다. 서로 다른 호스트에서 띄워져있는 도커 컨테이너들이 서로 통신할 수 있게 되는듯.
- none: 아무 네트워크도 사용하지 않는 경우.

## Bridge Network

Bridge network가 보통 많이 쓰는 드라이버인것 같으니 이것만 살펴봤다.

네트워크 이론에서 bridge network 라고 하는 것은 (OSI 7 Layer에서) Layer 2의 장치, 하드웨어나 소프트웨어를 의미한다. 도커에서는 소프트웨어 브릿지를 의미하고, 같은 호스트 위의 여러 컨테이너가 서로 통신할 수 있게 한다. 서로 다른 브릿지는 각각 isolate 한다.

- 디테일: 진짜 bridge network device 를 사용하는 것 일까?
    
    아래 커맨드에서 실제로 레이어2 device가 등록되었음을 알 수 있다. 
    
    ```bash
    ❯ ip link 
    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    2: enp7s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP mode DEFAULT group default qlen 1000
        link/ether ~~~ brd ff:ff:ff:ff:ff:ff
    3: wlp6s0: <BROADCAST,MULTICAST> mtu 1500 qdisc noqueue state DOWN mode DEFAULT group default qlen 1000
        link/ether ~~~ brd ff:ff:ff:ff:ff:ff
    4: br-4f86f0dfd214: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFAULT group default 
        link/ether ~~~ brd ff:ff:ff:ff:ff:ff
    5: br-6b5e955c7af8: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFAULT group default 
        link/ether ~~~ brd ff:ff:ff:ff:ff:ff
    6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFAULT group default 
        link/ether ~~~ brd ff:ff:ff:ff:ff:ff

    ❯ docker network ls                     
    NETWORK ID     NAME              DRIVER    SCOPE
    690986a95ff1   bridge            bridge    local
    4f86f0dfd214   compose_default   bridge    local
    6558d173098a   host              host      local
    6b5e955c7af8   minikube          bridge    local
    5eb49b4b7bb9   none              null      local
    ```
    
    위의 결과에서 `compose_default` 라는 브릿지 네트워크의 ID가 `4f86f0dfd214` 이고, 링크 디바이스 중 이름이 `br-4f86f0dfd214` 인 것이 있다. 네트워크에 연결되는 MAC 주소는 앞 부분이 비슷하긴 한데 다른것 같다 🤔
    

User-defined network(=기본적으로는 bridge 드라이버 사용)가 아래 이유에서 기본 bridge network 보다 낫다.

1. User-defined network는 컨테이너 간 DNS resolution을 제공한다. 예를 들어 alpine1 이라는 컨테이너가 alpine-net 에 붙어있다고 할 때, alpine2 도 alpine-net에 붙어있으면 alpine1 이라는 이름으로 바로 해당 컨테이너의 IP를 알아낼 수 있도록 되어있다.
2. bridge 가 기본으로 생성되는 bridge network 이다보니 여러 관계없는 컨테이너가 한번에 올라가있을 수 있다.
3. bridge 가 기본으로 생성되는 bridge network 라서 환경변수를 공유해야한다.
4. User-defined network 는 configurable bridge 를 사용할 수 있다.

### With Docker-compose

Docker-compose 로 서비스를 띄우면 앱이름_default 네트워크가 뜬다. 이 네트워크 안에서 각 컨테이너는 서로의 이름으로 DNS resolution을 할 수 있다. [https://docs.docker.com/compose/networking/](https://docs.docker.com/compose/networking/)

### 궁금한 것/알게된 것

1. `docker network inspect ~~~` 로 확인해보니 subnet 과 gateway 를 확인할 수 있었고 subnet 에 정의된대로 컨테이너들의 IP 주소가 할당되는 것을 볼 수 있었다. 신기하다!
2. 네트워크와 외부 세계를 분리하지는 않는다는 것도 알게되었다. 예를 들어 컨테이너 안에서 `ping [google.com](http://google.com)` 을 하면 정상작동한다.
3. 컨테이너도 MAC 주소와 IP 주소를 부여받고, bridge network 는 L2 device 에 해당하니까 L2 layer와 통신할 수 있게 하기 위해 MAC 주소와 IP 주소를 부여받은걸까..?
4. MAC 주소는 L2 device에 대해 주어지는 주소라고 생각해서 bridge network 하나가 하나의 MAC 주소를 가지고 있을 거라고 예상했는데 컨테이너 각각이 다른 MAC 주소를 부여받았다. 왜일까?
5. DNS resolution 은 NS record를 가져와서 DNS server와 통신해 가져오는 것이라고 알고 있었다. 여기서는 NS record는 필요없이 DNS server의 기능도 도커 네트워크가 해주는것 같다. 그럼 컨테이너 → DNS resolution → 다른 컨테이너 를 할 수 있겠다.
6. 컨테이너가 다른 컨테이너의 이름으로 요청을 보내면 브릿지 네트워크가 DNS resolution을 수행해 IP 주소를 알아내고, IP 주소가 Layer 3(Transport)로 전달될텐데.. 여기서 어디로 보낼지를 판단하는걸까? 아니면 Layer 2까지 내려보내서 어디로 보낼지 판단하는걸까? 도커 네트워크의 CIDR이 localhost가 아닌 것으로 지정되어있던데, 그 IP 주소를 보고 다시 로컬로 돌아와서 도커 네트워크로 보내야한다는 것을 어떻게 아는걸까?
