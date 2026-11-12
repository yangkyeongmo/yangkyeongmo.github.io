---
title: "Kafka Connect rotate.interval.ms and rotate.schedule.interval.ms"
date: 2024-03-08 00:49
categories: dev
tags: ["kafka", "kafka-connect"]
published: false
lang: en
locale: en_US
ref: kafka-connect-rotate-interval
permalink: /en/kafka-connect-rotate-interval.html
machine_translated: true
original_url: /kafka-connect-rotate-interval.html
---

Comparing `rotate.interval.ms` and `rotate.schedule.interval.ms`, two of the S3 sink connector settings.

> As the S3 connector processes each record, it uses the partitioner to determine into which encoded partition that record should be written. This continues for each partition until the connector determines that a partition has enough records and should be uploaded to the S3 bucket using the S3 object name for that partition. This technique of knowing when to flush a partition file and upload it to S3 is called the *rotation strategy*, ...
> https://docs.confluent.io/kafka-connectors/s3-sink/current/overview.html#s3-object-uploads

Both settings are constraints on when to do file rotation, a rotation strategy. Turning events consumed from a topic into files on s3 is called file rotation, and the constraint on when to rotate is called a rotation strategy.

## rotate.interval.ms

**Maximum span of record time**. Defines the maximum interval a file can stay open before file rotation. The file close time is based on the timestamp the next event tells you. For example, if you set the interval to 30 minutes and an event comes in a day later, the file stays open all day and only rotates and creates a file when the next event comes in.

## rotate.schedule.interval.ms

**Scheduled rotation**. Unlike `rotate.interval.ms`, it judges the file close time based on system time.

## Difference

`rotate.interval.ms` is deterministic so it can be used with exactly-once, and `rotate.schedule.interval.ms` is nondeterministic so it cannot be used with exactly-once. The criterion for determinicity is file rotation: if you use the former, the moment to rotate the file is fixed as "the time the next event told you", whereas if you use the latter you use system time, which is an untrustworthy time, so they seem to call the latter nondeterministic.

An example where exactly-once is not guaranteed when using the latter is an environment where concurrent tasks run. When several tasks are consuming one topic, if you use system time as the basis, each task has a different system time so the same event can be consumed more than once.

(Need to verify whether this is a correct example.)
