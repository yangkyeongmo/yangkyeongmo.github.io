---
title: "Filtering with Django prefetch_related"
date: 2023-11-30 16:45
categories: dev
tags: ["django", "python"]
published: false
lang: en
locale: en_US
ref: django-prefetch-related
permalink: /en/django-prefetch-related.html
machine_translated: true
original_url: /django-prefetch-related.html
---

Django's prefetch_related is a method similar to select_related for solving the N+1 problem. Unlike select_related, prefetch_related doesn't look up the tables in the query; it fetches each table separately.

> prefetch_related, on the other hand, does a separate lookup for each relationship, and does the ‘joining’ in Python. This allows it to prefetch many-to-many, many-to-one, and GenericRelation objects which cannot be done using select_related, in addition to the foreign key and one-to-one relationships that are supported by select_related.
> https://docs.djangoproject.com/en/4.2/ref/models/querysets/#prefetch-related

select_related builds and runs a join query so no extra query happens, whereas prefetch_related joins the results of the original query and the query from prefetch_related in the application and returns that, so extra queries do happen. select_related can only be applied to 1:1 relationships, but prefetch_related can also be applied to 1:N and N:N relationships.

Why? They say it's because if you query a many relation when fetching with select_related, the result can get too large.

I used it in a case like this. There are tables A, B, and C, and in the models A has a ForeignKey to B and C has a ForeignKey to B. Simply put, the relationships are A->B, C->B. In this case I want to start from A and filter by a field on C. In this case I used prefetch_related to fetch the C table filtered by the values I wanted to filter on, then joined in code. In code it looks like this.

```python
prefetch = Prefetch(
    "field",
    queryset=C.objects.filter(id__in=filter_ids)
)
q = A.objects.select_related('b').prefetch_related(prefetch).all()
```

The example above should probably be solvable in a form like `prefetch_related("b__c").filter("b__c__id__in")`, but it didn't work well so I applied it as a workaround.
