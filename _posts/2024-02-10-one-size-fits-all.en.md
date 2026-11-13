---
title: "One Size Fits All-An Idea Whose Time Has Come and Gone, Michael Stonebraker et. al, 2005"
date: 2024-02-10 11:00
categories: dev
tags: ["data"]
lang: en
locale: en_US
ref: one-size-fits-all
permalink: /en/one-size-fits-all.html
machine_translated: true
original_url: /one-size-fits-all.html
---

# Summary

This paper, centered on the phrase one size fits all, which as of 2005 describes the state of the DB market, argues why using only OLTP DBMS or using only one product (interface) to cover every workload is meaningless.

The paper puts somewhat more weight on stream processing; my own interest is why you can't cover every workload with one DB, so if you want the details please refer to the paper.

As of 2005, OLTP DBMSs seem to have advertised one size fits all, that you could use just one database for every case. There are benefits to using only one database.
1. Easier to maintain, so cost goes down. When some change happens, the number of parts you have to be involved in grows. Complexity increases as above.
2. Compatibility problems. If you use several DBs you have to consider compatibility for each.
3. Easy to sell. When salespeople sell, if there are too many products it's hard to know what to recommend.
4. Easy to advertise. Same reason.

Two representative use cases that you can't cover with only an OLTP database showed up, and several other cases were found too.
The two big branches the paper presents are data warehouse and stream processing.

There was a trend of trying what's called a [Data warehouse](https://aws.amazon.com/ko/what-is/data-warehouse/), gathering the many databases a company holds in one place and running ad-hoc queries for data analysis.
(Even now people in the data domain talk a lot about data warehouse.)

Here the author knocks most usage as overspec ("dramatically over budget", "ended up delivering only a
subset of promised functionality"), but still says ROI came out.

Even as the OLAP use case called Data warehouse appeared, there seem to have been attempts to advertise using only one database. For example combining an OLTP DBMS and an OLAP DBMS into one frontend and selling it as one system.
But OLTP and OLAP have different use cases and different characteristics, so a feature needed on one side often isn't needed on the other, which is inefficient.

An OLTP database is focused on keeping transactions and only fetches small-scale data.
Because the goal is that data is always stored safely, it handles transactions well.
Because it has to be used in a service, the goal is fast processing.
Then a B-tree index is convenient.

> Data warehouses are very different from OLTP systems. OLTP systems have been optimized for updates, as the main business activity is typically to sell a good or service. In contrast, the main activity in data warehouses  is ad-hoc queries, which are often quite complex. Hence, periodic load of new data interspersed with ad-hoc query activity is what a typical warehouse experiences.

An OLAP database is a different case. A data warehouse is used by gathering several service databases in one place and frequently running ad-hoc queries to check.

> It is a well known homily that warehouse applications  run much better using bit-map indexes while OLTP users prefer B-tree indexes. The reasons are straightforward:  bit-map indexes are faster and more compact on warehouse workloads, while failing to work well in OLTP environments. As a result, many vendors support both B-tree indexes and bit-map indexes in their DBMS products.

For that, reads have to be fast, and then using a bit-map index is better than a B-tree index.
- I know column oriented storage usually uses a bit-map index.

Another example where you can't use only OLTP is stream processing, mentioned earlier.
Doing stream processing with an OLTP database is hard; the paper reports a speed difference of 150x or more between a system made dedicated to stream processing and using an OLTP DBMS.
- The author at the time gave military or civilian sensor networks as examples of stream processing use; even thinking of Kafka now, it's an example that still fits a lot.

They express the difference between a stream processing engine and an OLTP database as inbound, outbound.
An OLTP database is outbound. First you store the data and you make queries based on the stored data.
But a stream processing use case is when data comes in constantly at high volume, and if you store and query every time, the overhead of storing data to disk is large so performance drops.

A stream processing engine is expressed as inbound. It processes streaming incoming data inside the process. Only when you need to look at correlation later do you optionally store it in a DBMS. Then overhead from storing goes down so performance gets much better.

> To avoid such a performance hit, a stream processing engine must provide all three services in a single piece of system software that executes as one multi-threaded process on each machine that it runs. Hence, an SPE must have elements of a DBMS, an application server, and a messaging system. In effect, an SPE should provide specialized capabilities from all three kinds of software “under one roof”.

The author added one prediction about stream processing engines. The author sees use of a stream processing engine as generalizable to propagating events to application, message queue, DBMS. In that situation there's a problem that SPE (stream processing engine) has to keep propagating one event to these three components redundantly, and then overhead gets large relative to useful operations. So they see SPE as needing to be made as a system that can encompass all three components.

Besides that they presented the items below as examples you can't cover with only OLTP.
1. Text search
2. Scientific database
3. XML database

I don't know item 3, XML database, well, but the others still hold today.

Text search is often done in a database that supports inverted index. If you have to do text search professionally, I understand you choose Elasticsearch or Solr.

For scientific database, it's not my specialty, but there's also the example of having to do string match on a very long string when doing gene analysis.
