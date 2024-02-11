---
title: "One Size Fits All-An Idea Whose Time Has Come and Gone, Michael Stonebraker et. al, 2005"
date: 2024-02-10 11:00
categories: paper
tags: ["data"]
---

# 요약

이 논문에서는 one size fits all이라는, 2005년 시점에서 바라본 DB 시장의 현황을 나타내는 글귀를 중심으로 OLTP DBMS만 사용하거나 한 가지 제품(인터페이스)만 사용해서 모든 workload에 대응하는 것이 왜 무의미한지 주장하고 있음.

논문에서는 stream processing에 다소 무게를 더 싣고 있는데, 본인의 관심사는 왜 한 가지 DB로 모든 workload에 대응할 수 없는지에 있으니 자세한 내용이 궁금하다면 논문을 참조바람.

2005년 시점에서 OLTP DBMS들이 one size fits all로, 모든 케이스에 한 데이터베이스만 사용해도 되도록 홍보를 했나봄. 한 데이터베이스만 사용했을 때 이점이 있다.
1. 유지보수하기 쉬워서 비용이 낮아짐. 어떤 변경이 생겼을 때 관여해야할 부분이 많아진다. 위와 같이 복잡성이 증가함.
2. 호환성 문제. 여러 DB를 사용하면 각각에 대해 호환성을 고려해야 함.
3. 판매하기 쉽다. 세일즈맨들이 물건을 팔 때 물건이 너무 많으면 어떤 것을 추천해야 하는지 알기 어렵다.
4. 홍보하기 쉽다. 마찬가지 이유로.

OLTP database만으로 대응할 수 없는 유즈케이스가 대표적으로 두 가지 등장했고 그 외에도 여러 케이스가 발견되었음.
논문에서 제시하는 큰 두 가지 갈래는 data warehouse와 stream processing임.

[Data warehouse](https://aws.amazon.com/ko/what-is/data-warehouse/)라고 하여 기업이 들고있는 많은 database들을 한 곳에 모아서 ad-hoc 쿼리를 날려 데이터 분석을 하는 시도가 유행했음.
(지금도 데이터 도메인에서 data warehouse를 많이 얘기함.)

이 때 저자가 대부분의 사용 사례는 오버스펙이었다고("dramatically over budget", "ended up delivering only a
subset of promised functionality") 까는데, 그럼에도 ROI는 나왔다고 함.
  - (ROI를 어떻게 측정했는지도 궁금한데, 이 부분은 다음에.)

사족) 빅 데이터 툴(e.g. Spark)까지 사용하지 않아도 될 경우가 많을 수 있다는 주장들을 여럿 찾을 수 있다.
- [Scalability! But at what COST?](https://www.usenix.org/system/files/conference/hotos15/hotos15-paper-mcsherry.pdf): 빅 데이터 툴을 사용하는 것 대비 노트북에서 싱글 스레드로 실행하는 것이 더 빠를 수 있는 사례
- [BIG DATA IS DEAD](https://motherduck.com/blog/big-data-is-dead/): "빅 데이터"라고 할 정도로 많은 데이터를 가진 기업은 잘 없다는 주장 
  - "DuckDB"라는, in-memory OLAP DB를 만드는 회사의 주장이지만 설득력있다.

Data warehouse라는 OLAP 유즈케이스가 등장하면서도 한 데이터베이스만 사용해서 홍보하려는 시도가 있었던 듯. 예를 들어 OLTP DBMS와 OLAP DBMS를 한 프론트엔드에 결합시켜서 한 시스템으로 판매하는 경우.
하지만 OLTP와 OLAP은 유즈케이스가 다르고 특성도 달라서 한 쪽에서 필요한 기능이 다른 쪽에서는 필요하지 않은 경우가 많아 비효율적이다.

OLTP database는 transaction을 보관하는데에 중점이 있고 소규모의 데이터만 가져온다.
데이터가 항상 안전하게 저장되는 것을 목표로 하기 때문에 transaction에 대한 처리가 잘 된다.
서비스에 사용해야하므로 빠른 처리를 목표로 한다.
그러면 B-tree 인덱스가 용이함.

> Data warehouses are very different from OLTP systems. OLTP systems have been optimized for updates, as the main business activity is typically to sell a good or service. In contrast, the main activity in data warehouses  is ad-hoc queries, which are often quite complex. Hence, periodic load of new data interspersed with ad-hoc query activity is what a typical warehouse experiences.

OLAP database는 케이스가 다르다. Data warehouse는 여러 서비스 데이터베이스들을 한 군데에 모아서 ad-hoc한 쿼리를 자주 날려서 확인해보는 식으로 사용한다.

> It is a well known homily that warehouse applications  run much better using bit-map indexes while OLTP users prefer B-tree indexes. The reasons are straightforward:  bit-map indexes are faster and more compact on warehouse workloads, while failing to work well in OLTP environments. As a result, many vendors support both B-tree indexes and bit-map indexes in their DBMS products.

그러려면 read가 빠르게 되어야 하는데 이 때는 B-tree 인덱스보다는 bit-map index를 사용하는 편이 낫다.
- Column oriented storage가 bit-map index를 보통 사용한다고 알고 있음.

OLTP만 쓸 수 없는 다른 예시는 앞에서 얘기한 stream processing.
OLTP database로 stream processing을 하기는 어려운데, 논문에서는 stream processing 전용으로 만든 시스템과 OLTP DBMS를 사용했을 때의 속도 차이를 150배 이상으로 보고하고 있다.
- 저자는 당시 stream processing의 사용 예시로 군사용 혹은 민간 센서 네트워크를 예시로 들었던데 지금 Kafka를 생각해봐도 많이 들어맞는 예시다.

Stream processing engine과 OLTP database의 차이는 inbound, outbound로 표현하고 있다.
OLTP database는 outbound. 일단 데이터를 저장하고 저장된 데이터를 기준으로 쿼리를 만든다.
그런데 stream processing의 유즈케이스는 데이터가 끊임없이 high volume으로 들어오는 경우인데 매번 저장하고 쿼리하려면 데이터를 disk에 저장할 때의 overhead가 커서 성능 저하가 발생한다.

Stream processing engine은 inbound로 표현하고 있다. Streaming으로 들어오는 데이터들을 프로세스 안에서 처리한다. 나중에 correlation을 봐야하는 경우에만 optional하게 DBMS에 저장한다. 이러면 저장에 의한 overhead가 줄어들어서 성능이 많이 좋아진다.

> To avoid such a performance hit, a stream processing engine must provide all three services in a single piece of system software that executes as one multi-threaded process on each machine that it runs. Hence, an SPE must have elements of a DBMS, an application server, and a messaging system. In effect, an SPE should provide specialized capabilities from all three kinds of software “under one roof”.

저자는 stream processing engine에 대한 예측을 하나 덧붙였다. 저자는 stream processing engine의 사용은 application, message queue, DBMS에 이벤트를 전파하는 용도로 일반화될 수 있다고 보고 있다. 이 상황에서 세 컴포넌트들에 SPE(stream processing engine)이 한 이벤트를 중복해서 계속 전파해야하는 문제가 있는데, 이러면 유용한 operation 대비 overhead가 커진다. 때문에 SPE는 이 세 가지 컴포넌트를 모두 포괄할 수 있는 시스템으로 만들어져야 한다고 보고 있다.

그 외에 OLTP만으로 대응할 수 없는 예시로 아래 항목들을 제시했다.
1. 텍스트 검색
2. Scientific database
3. XML database

3번 항목인 XML database의 경우는 잘 알고있지 못 하지만, 이외에는 현재에 와서도 들어맞는 얘기다.

텍스트 검색은 대부분 inverted index를 지원하는 데이터베이스에서 하는 경우가 많다. 텍스트 검색을 전문적으로 해야한다면 Elasticsearch나 Solr를 선택하는 것으로 알고있다.
(사족이지만, 지난 회사 중에서 텍스트 검색을 MySQL로 하고 있는 경우가 있어서 적잖이 충격을 받았었다. 규모가 작은 회사도 아니었다.)

Scientific database의 경우, 본인의 전문 분야는 아니지만, 유전자 분석을 행할 때 아주 긴 string에 대해서 string match를 해야하는 예시도 있다. 
