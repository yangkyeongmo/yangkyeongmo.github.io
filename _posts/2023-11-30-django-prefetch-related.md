---
title: "Django prefetch_related로 필터링하기"
date: 2023-11-30 16:45
categories: dev
tags: ["django", "python"]
published: false
---

Django의 prefetch_related는 N+1 문제를 해결하기 위한 select_related와 유사한 방법이다. prefetch_related는 select_related와는 다르게 쿼리에서 테이블들을 조회하지 않고 각 테이블을 따로 가져온다.

> prefetch_related, on the other hand, does a separate lookup for each relationship, and does the ‘joining’ in Python. This allows it to prefetch many-to-many, many-to-one, and GenericRelation objects which cannot be done using select_related, in addition to the foreign key and one-to-one relationships that are supported by select_related.
> https://docs.djangoproject.com/en/4.2/ref/models/querysets/#prefetch-related

select_related는 join 쿼리를 만들어 실행하므로 추가 쿼리가 발생하지 않는 반면, prefetch_related는 기존 쿼리와 prefetch_related로 발생하는 쿼리의 결과를 어플리케이션에서 조인해 반환하는 방식이므로 쿼리가 추가로 발생한다. select_related는 1:1 관계에 대해서만 적용 가능하지만, prefetch_related는 1:N, N:N 관계에 대해서도 적용 가능하다.

왜지? select_related로 가져올 때 many relation을 쿼리하면 결과가 너무 커질 수 있기 때문이라고 한다.

이런 경우에 사용했다. A, B 그리고 C 테이블이 있고 모델 상 A는 B에 대해서 그리고 C는 B에 대해서 ForeignKey를 가지고 있다. 간단히 표현하자면 A->B, C->B 관계에 있다. 이 경우 A에서 시작해 C에 있는 필드로 필터링을 하고싶다. 이 경우 prefetch_related를 사용해 필터링하려는 값들로 필터링된 C 테이블을 따로 가져온 다음 코드에서 join 했다. 코드로 표현하자면 이렇다.

```python
prefetch = Prefetch(
    "field",
    queryset=C.objects.filter(id__in=filter_ids)
)
q = A.objects.select_related('b').prefetch_related(prefetch).all()
```

위 예제는 사실 `prefetch_related("b__c").filter("b__c__id__in")` 같은 형태로 해결할 수 있어야 될듯 한데 잘 되지 않아 workaround로 적용했다.
