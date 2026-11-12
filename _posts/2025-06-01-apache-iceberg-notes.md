---
title: "Apache Iceberg를 쓰며 배운 것"
date: 2025-06-01 15:56
categories: dev
tags: ["iceberg", "spark"]
published: false
lang: ko
locale: ko_KR
ref: apache-iceberg-notes
---

"The open table format for analytic datasets."[^1] "Iceberg is a **high-performance** format for **huge analytic tables**. Iceberg brings the **reliability** and **simplicity** of SQL tables to big data, while making it possible for engines like Spark, Trino, Flink, Presto, Hive and Impala to safely **work with the same tables, at the same time**."[^1]

(노트에는 여기에 레이어 구조 이미지가 있었음.)[^2]

Iceberg는 레이어 구조로 테이블 상태와 데이터를 관리한다.

> - **Catalog layer** – Maintains a pointer to the current table metadata file, serving as the single source of truth for table state. The Data Catalog provides the functionality as the Iceberg catalog.
> - **Metadata layer** – Contains metadata files that track table history, schema evolution, and snapshot information. These files are stored on Amazon S3.
> - **Data layer** – Stores the actual data files and delete files (for Merge-on-Read operations). These files are also stored on Amazon S3.[^2]

## 테이블 포맷의 역할은 메타데이터를 붙이는 것

Iceberg에서는 snapshot 등 테이블 이관을 위한 procedure를 제공한다. 이것이 가능한 것은 Iceberg는 테이블 메타데이터만 제공하고 그 아래의 데이터 파일은 별도로 있기 때문. 기존 데이터는 그대로 둔 상태에서 메타데이터만 붙이기 때문에 다른 테이블이 가지고 있는 데이터를 그대로 참조할 수 있다.

때문에 iceberg 기능으로 데이터 자체를 변경하는 동작은 기대하기 어렵다. 그 동작을 제일 잘 하는건 Spark나 SQL 엔진이니, 그 쪽을 사용하는 편이 맞다.

## 최신 상태만 보여주면 편한 경우

어떤 테이블은 Iceberg 테이블 포맷인데 최신 상태에 이전 모든 이력이 포함되도록 되어있다. 그렇다보니 과거 데이터에 이상이 생기면 과거 태그부터 backfill을 해주는게 자연스러움.

반면에 중간 테이블들도 Iceberg 테이블 포맷이지만 최신 상태만 유지되고 있고, 각 태그를 확인해보면 그 날짜에 해당하는 파티션만 보인다. 이 테이블들은 그 날짜에 문제가 생겨도 그 태그만 재실행하면 되어서 유지보수가 비교적 수월하다.

## 파티션 변경

Iceberg에서는 schema evolution의 하나로 파티션을 변경할 수 있다. Hive에서는 파티션을 변경하려면 물리적인 구조를 바꿔야했으므로 대비되는 점이다.

다만 기존 스키마도 모두 파티션이 변경되는건 아니고, 새로 들어온 데이터부터 파티션이 변경된다. 파티션이 변경된 태그 N이 있으면, N-1 까지는 기존 파티션을 쓰고 N, N+1, ... 에서는 신규 파티션을 사용하는 식.[^3] 때문에 한 파티션 컬럼이 서로 다른 포맷으로 변경되었다면 과거 데이터는 과거 파티션 기준으로, 신규 데이터는 신규 파티션 기준으로 조회된다.[^4]

## 새 컬럼은 새 ID로 생성됨

파티션 키로 잡혀있는 컬럼을 삭제했다가, 재생성하니 파티션으로 인식하지 못 한다. 분명 이름은 같은데 인식을 못 한다. 아래 에러가 발생했다.

```
25/03/13 12:27:37 WARN Tasks: Retrying task after failure: Cannot create identity partition sourced from different field in schema
java.lang.IllegalArgumentException: Cannot create identity partition sourced from different field in schema
```

S3에 들어가 최신의 metadata 파일을 봤더니, 그 컬럼이 기존에는 ID 208으로, 새로 생성된 같은 이름의 컬럼은 ID가 209로 되어있다. 같은 column이라도 새로 생성되면 ID가 늘어난다.

## Glue catalog에서 파티션 조회

Iceberg에 데이터 파일들이 파티션으로 나뉘어있으니 파티션 조회가 Hive처럼 가능해야할 것 같은데, 조회가 안 된다. 추측컨대 Hive는 파티션 구조가 물리적으로(?) 하나만 존재하는데, Iceberg는 그렇지 않아서가 아닐까?

## Pyiceberg로 수동 제어

Iceberg 테이블을 Pyiceberg, 즉 Python API를 활용해서 수동으로 제어할 수 있다. 파티션 evolution, 스키마 evolution 등의 동작이 가능함.

## Conflict resolution

Iceberg에서는 한 버전을 기준으로 여러 쓰기 요청이 발생했을 때 한 요청만 성공함. 실패한 요청은 메타데이터 정보를 다시 가져와서 retry해야 함. Iceberg 자체에서는 여러 요청을 한 번에 보낸다고 락을 걸지는 않음.[^5]

Iceberg 커맨드 중 OverwriteFile은 detection filter에 걸리는 데이터 중 기존과 다른 새 파일이 있었을 때 실패로 판정한다. Dynamic overwrite를 했을 때 overwrite 대상에 파일 변동이 있었을 때만 실패한다고 보아도 되겠다.[^6]

## 테이블 통계와 Puffin

Iceberg에서는 테이블 메타데이터를 지원하는데, 테이블 내의 데이터에 대한 통계도 여기에 포함된다.[^7] 매니페스트에 바로 넣기 어려운 통계나 인덱스 같은 정보는 Puffin이라는 파일 포맷에 넣어서 사용한다.

파티션에 대한 통계도 들어있는데, 들어있는 내용 중 볼만한 값을 찾아보자면:

- data_record_count
- data_file_count
- total_data_file_size_in_bytes
- total_record_count
- ...

Puffin은 Iceberg 매니페스트에 직접 저장할 수 없는 인덱스와 통계 같은 정보를 담기 위해 제안된 파일 포맷이다.[^8] 헤더, 데이터, footer가 들어있고 데이터는 blob이다.

파일 구조는 이렇다.

`Magic Blob₁ Blob₂ ... Blobₙ Footer`

헤더에 Magic으로 0x50, 0x46, 0x41, 0x31 이 들어있는데, 번역하면 "PFA1", 즉 Puffin Fratercula arctica, version 1의 약자라고 한다.

Blob에는 (압축되었거나 압축되어있지 않은) Theta sketch 혹은 deletion vector가 들어간다(v1 기준.) 그럼 Iceberg의 메타데이터를 더 잘 활용하려면 HyperLogLog 보다는 Theta sketch를 이용하도록 하위 구현을 하는 편이 더 좋은 것일지 고민된다.

메타데이터 성격의 데이터가 footer에 들어있는데, header에 넣어야 빨리 읽을 수 있는거 아닌가 싶지만 Apache Parquet 등 다른 테이블 포맷에서도 비슷하게 footer에 정의한다고 한다. 메타데이터보다는 데이터를 더 빨리 읽어야해서 그런 걸지도 모르겠다.

## Spark Iceberg bucket join

Spark는 join을 할 때 Shuffle을 하고, 이 동작의 비용이 크기 때문에 shuffle을 줄이는 방향으로 최적화를 할 수 있다. Iceberg 테이블 포맷으로 정의된 테이블은 버켓을 나눌 수 있다. Join할 때 버켓을 기준으로 하게 되면 shuffle을 하지 않고 같은 버켓끼리는 한 노드만 참조해서 연산을 효율적으로 할 수 있다.

예를 들어 customer 테이블과 transaction 테이블이 있고, 두 테이블을 customer id로 join해야 한다. 버켓으로 나뉘어있지 않다면 두 테이블을 shuffle join해서 가져와야한다. 하지만 두 테이블을 정의할 때 partitioning scheme을 bucket으로 하면 같은 customer id는 같은 노드에서 가져오게 된다.[^9]

## S3 tables

https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-tables.html

S3 tables provide S3 storage that's optimized for analytics workloads, with features designed to continuously improve query performance and reduce storage cost for tables. S3 tables are purpose-built for storing tabular data, such as daily purchase transactions, ...

Features:

- Better performance. Using S3 tables bucket for analytics workloads provides better TPS than using naive S3 bucket.
- Iceberg support. Tables in S3 tables bucket are stored in Iceberg format. By supporting Iceberg, users can time travel or use other related features.
- Automated maintenance. Using S3 tables bucket will automatically merge small files into fewer, larger files. It'll also remove unused objects.
- IAM support. S3 tables allow setting IAM control per table. [Full list of actions](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazons3tables.html)

Caveats:

- As of 2025-02, S3 tables is not supported on some region. [Supported regions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-tables-regions-quotas.html#s3-tables-regions)
- As of 2025-02, only 10,000 tables are allowed in a single S3 tables bucket.[^10]
-

[^1]: https://iceberg.apache.org/

[^2]: https://aws.amazon.com/blogs/big-data/manage-concurrent-write-conflicts-in-apache-iceberg-on-the-aws-glue-data-catalog/

[^3]: "When you evolve a partition spec, the old data written with an earlier spec remains unchanged. New data is written using the new spec in a new layout.", https://iceberg.apache.org/docs/nightly/evolution/#partition-evolution

[^4]: "Because of this, when you start writing queries, you get split planning. This is where each partition layout plans files separately using the filter it derives for that specific partition layout.", https://iceberg.apache.org/docs/nightly/evolution/#partition-evolution

[^5]: https://iceberg.apache.org/spec/?h=conflict#commit-conflict-resolution-and-retry

[^6]: https://iceberg.apache.org/javadoc/1.4.2/org/apache/iceberg/OverwriteFiles.html

[^7]: "Spec - Apache Iceberg," https://iceberg.apache.org/spec/#table-statistics (accessed Jun. 01, 2025).

[^8]: "Puffin Spec - Apache Iceberg," https://iceberg.apache.org/puffin-spec/ (accessed Jun. 01, 2025).

[^9]: https://blog.det.life/scaling-up-with-iceberg-bucketing-to-boost-data-performance-5ad2a34ab3b1

[^10]: https://aws.amazon.com/about-aws/whats-new/2025/01/amazon-s3-tables-10000-tables-bucket/
