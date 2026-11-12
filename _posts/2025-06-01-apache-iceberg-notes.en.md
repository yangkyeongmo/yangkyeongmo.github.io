---
title: "What I learned using Apache Iceberg"
date: 2025-06-01 15:56
categories: dev
tags: ["iceberg", "spark"]
published: false
lang: en
locale: en_US
ref: apache-iceberg-notes
permalink: /en/apache-iceberg-notes.html
---

"The open table format for analytic datasets."[^1] "Iceberg is a **high-performance** format for **huge analytic tables**. Iceberg brings the **reliability** and **simplicity** of SQL tables to big data, while making it possible for engines like Spark, Trino, Flink, Presto, Hive and Impala to safely **work with the same tables, at the same time**."[^1]

(The note had a layer-structure image here.)[^2]

Iceberg manages table state and data in a layer structure.

> - **Catalog layer** – Maintains a pointer to the current table metadata file, serving as the single source of truth for table state. The Data Catalog provides the functionality as the Iceberg catalog.
> - **Metadata layer** – Contains metadata files that track table history, schema evolution, and snapshot information. These files are stored on Amazon S3.
> - **Data layer** – Stores the actual data files and delete files (for Merge-on-Read operations). These files are also stored on Amazon S3.[^2]

## A table format's role is attaching metadata

Iceberg provides procedures for table migration such as snapshot. That's possible because Iceberg only provides table metadata and the data files below it are separate. It only attaches metadata while leaving the existing data as-is, so it can refer as-is to data another table holds.

So it's hard to expect an action that changes the data itself as an iceberg feature. The thing that does that action best is Spark or a SQL engine, so it's right to use that side.

## Cases where showing only the latest state is convenient

Some tables are in Iceberg table format but are set so the latest state includes all previous history. So if something goes wrong with past data, backfilling from the past tag is natural.

On the other hand intermediate tables are also Iceberg table format but only the latest state is kept, and if you check each tag you only see the partition for that date. For these tables, even if a problem happens on that date you only re-run that tag, so maintenance is relatively easy.

## Changing partitions

In Iceberg you can change partitions as part of schema evolution. In Hive you had to change the physical structure to change partitions, so that's a contrast.

That said, it's not that every existing schema's partitions all change; partitions change from newly incoming data. If there's a tag N whose partition changed, up through N-1 you use the existing partition, and N, N+1, ... use the new partition.[^3] So if one partition column was changed to a different format, past data is queried on the past partition, new data on the new partition.[^4]

## New columns are created with a new ID

I deleted a column that was set as a partition key, then recreated it, and it wouldn't recognize it as a partition. The name is clearly the same but it wouldn't recognize it. The error below occurred.

```
25/03/13 12:27:37 WARN Tasks: Retrying task after failure: Cannot create identity partition sourced from different field in schema
java.lang.IllegalArgumentException: Cannot create identity partition sourced from different field in schema
```

I went into S3 and looked at the latest metadata file, and that column used to be ID 208, and the newly created column with the same name is ID 209. Even the same column, if newly created, the ID goes up.

## Querying partitions in Glue catalog

Iceberg data files are split by partition so it seems like you should be able to query partitions like Hive, but you can't. My guess is, maybe because Hive has only one physical(?) partition structure, and Iceberg doesn't?

## Manual control with Pyiceberg

You can manually control Iceberg tables using Pyiceberg, i.e. the Python API. Actions like partition evolution, schema evolution are possible.

## Conflict resolution

In Iceberg, when several write requests happen against one version, only one request succeeds. Failed requests have to fetch metadata info again and retry. Iceberg itself doesn't take a lock just because several requests are sent at once.[^5]

Among Iceberg commands, OverwriteFile judges failure when, among data that hits the detection filter, there was a new file different from before. You could also see it as: when you do a dynamic overwrite, it fails only if there was a file change in the overwrite target.[^6]

## Table statistics and Puffin

Iceberg supports table metadata, and statistics about the data in the table are included here too.[^7] Info that's hard to put straight into the manifest, like statistics or indexes, is put in a file format called Puffin and used.

There are also statistics about partitions; looking for values worth seeing among what's in there:

- data_record_count
- data_file_count
- total_data_file_size_in_bytes
- total_record_count
- ...

Puffin is a file format proposed to hold info like indexes and statistics that can't be stored directly in an Iceberg manifest.[^8] It has a header, data, and footer, and the data is a blob.

The file structure is like this.

`Magic Blob₁ Blob₂ ... Blobₙ Footer`

The header has Magic 0x50, 0x46, 0x41, 0x31, which translates to "PFA1", i.e. they say it's short for Puffin Fratercula arctica, version 1.

A blob holds a Theta sketch (compressed or not) or a deletion vector (as of v1). Then I wonder whether, to use Iceberg's metadata better, it would be better to implement the lower layer to use Theta sketch rather than HyperLogLog.

Metadata-ish data is in the footer; I feel like putting it in the header would let you read it faster, but they say other table formats like Apache Parquet similarly define it in the footer. Maybe that's because you need to read the data faster than the metadata.

## Spark Iceberg bucket join

When Spark does a join it does a Shuffle, and that action is expensive so you can optimize toward reducing shuffle. A table defined in Iceberg table format can be split into buckets. If you join on buckets, you don't shuffle, and the same buckets only refer to one node, so computation can be efficient.

For example there's a customer table and a transaction table, and you have to join the two tables on customer id. If they're not split into buckets you have to shuffle-join the two tables to fetch them. But if you set the partitioning scheme to bucket when defining the two tables, the same customer id is fetched from the same node.[^9]

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
