---
title: "Kafka Connect rotate.interval.ms와 rotate.schedule.interval.ms"
date: 2024-03-08 00:49
categories: dev
tags: ["kafka", "kafka-connect"]
published: false
---

S3 sink connector의 세팅 중 하나인 `rotate.interval.ms`와 `rotate.schedule.interval.ms` 를 비교.

> As the S3 connector processes each record, it uses the partitioner to determine into which encoded partition that record should be written. This continues for each partition until the connector determines that a partition has enough records and should be uploaded to the S3 bucket using the S3 object name for that partition. This technique of knowing when to flush a partition file and upload it to S3 is called the *rotation strategy*, ...
> https://docs.confluent.io/kafka-connectors/s3-sink/current/overview.html#s3-object-uploads

두 세팅 모두 file rotation을 언제 할지에 대한 제약, rotation strategy임. 토픽에서 consume한 이벤트들을 s3에 파일로 만드는 것을 file rotation이라고 하고, 언제 rotate할 것인지에 대한 제약을 rotation strategy라고 한다.

## rotate.interval.ms

**Maximum span of record time**. File rotation을 하기 전에 파일이 open 상태로 있을 수 있는 최대 간격을 정의한다. 파일 close 시점을 다음 이벤트가 알려준 timestamp를 기준으로 한다. 예를 들어, interval이 30분으로 세팅해놓았는데 이벤트가 하루 뒤에 들어오면 파일이 하루 내내 열려있다가 다음 이벤트가 들어와야 rotation을 하고 파일을 생성한다.

## rotate.schedule.interval.ms

**Scheduled rotation**. `rotate.interval.ms`와는 시스템 시간을 기준으로 파일 close 시점을 판단한다는 점이 다르다.

## 차이

`rotate.interval.ms` 는 deterministic해서 exactly-once 로 사용할 수 있고 `rotate.schedule.interval.ms`는 nondeterministic하므로 exactly-once로 사용할 수 없다. Determinicity의 기준은 file rotation으로, 전자를 사용하면 file rotate를 할 시점이 "다음 이벤트가 알려준 시간"으로 고정되어있는데에 반해 후자를 사용하면 신뢰할 수 없는 시간인 시스템 시간을 사용하므로 후자가 nondeterministic하다고 하는 듯하다.

후자를 사용했을 때 exactly-once가 보장되지 않는 예시는 concurrent task가 실행되는 환경이 있다. 여러 task가 한 topic을 consume하고 있을 때 시스템 시간을 기준으로 하면 task마다 시스템 시간이 달라서 같은 이벤트를 여러 번 consume할 수 있게 된다.

(맞는 예시인지 검증 필요.)
