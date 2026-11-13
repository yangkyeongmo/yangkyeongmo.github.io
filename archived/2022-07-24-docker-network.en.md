---
title: "Docker Network notes"
date: 2022-07-24 21:09
categories: dev
tags: []
layout: post
lang: en
locale: en_US
ref: docker-network
permalink: /en/docker-network.html
machine_translated: true
original_url: /archived/2022-07-24-docker-network.html
---

I referred to https://docs.docker.com/network/.

## Overview

Docker provides a way for several containers to communicate with each other when they're up.

There are several kinds of **drivers** for communicating.

- bridge: the default driver; if you don't specify, it's set to connect here by default.
- host: connects to the host's network.
- overlay: connects several docker daemons so swarm service(?) can communicate with each other. Seems like docker containers running on different hosts can communicate with each other.
- none: when you don't use any network.

## Bridge Network

Bridge network seems to be the driver people usually use a lot, so I only looked at this.

In network theory, a bridge network means a Layer 2 (in the OSI 7 Layer) device, hardware or software. In docker it means a software bridge, and it lets several containers on the same host communicate with each other. Different bridges each isolate.

- Detail: does it actually use a real bridge network device?
    
    From the command below you can tell a layer 2 device was actually registered.
    
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
    
    In the result above, the bridge network named `compose_default` has ID `4f86f0dfd214`, and among the link devices there's one named `br-4f86f0dfd214`. The MAC address connected to the network is similar in the front part but seems different 🤔
    

A user-defined network (= by default uses the bridge driver) is better than the default bridge network for the reasons below.

1. A user-defined network provides DNS resolution between containers. For example if a container named alpine1 is attached to alpine-net, and alpine2 is also attached to alpine-net, it's set up so you can find that container's IP right away by the name alpine1.
2. Since bridge is the bridge network created by default, several unrelated containers can be up at once.
3. Since bridge is the bridge network created by default, you have to share environment variables.
4. A user-defined network can use a configurable bridge.

### With Docker-compose

If you bring up a service with Docker-compose, an appname_default network comes up. Inside this network each container can do DNS resolution by each other's name. [https://docs.docker.com/compose/networking/](https://docs.docker.com/compose/networking/)

### Things I wonder / things I learned

1. Checking with `docker network inspect ~~~`, I could see the subnet and gateway, and I could see that the containers' IP addresses were assigned as defined in the subnet. Neat!
2. I also learned that it doesn't separate the network from the outside world. For example if you `ping [google.com](http://google.com)` inside a container, it works.
3. Containers also get a MAC address and an IP address, and a bridge network corresponds to an L2 device, so was the MAC address and IP address given so it can communicate with the L2 layer..?
4. I thought a MAC address is an address given for an L2 device, so I expected one bridge network would have one MAC address, but each container got a different MAC address. Why?
5. I knew DNS resolution as fetching an NS record and communicating with a DNS server to get it. Here it seems the docker network also does the DNS server's job without needing an NS record. Then you could do container → DNS resolution → another container.
6. If a container sends a request by another container's name, the bridge network would do DNS resolution to find the IP address, and that IP address would be passed to Layer 3 (Network, IP).. here does it decide where to send it? Or send it down to Layer 2 and decide where to send it there? The docker network's CIDR was set to something other than localhost, so how does it know it has to come back to local looking at that IP address and send it to the docker network?
