---
title: "Airflow를 쓰며 만난 함정과 기능"
date: 2025-04-28 13:59
categories: dev
tags: ["airflow"]
published: false
lang: ko
locale: ko_KR
ref: airflow-gotchas
---

## DAG 스케줄보다 task 스케줄이 더 빠른 경우

Airflow task instance가 생성되지 않는 이유를 트러블슈팅하다가.

Airflow DAG과 task는 서로 다른 스케쥴을 가질 수 있다. 이는 DAG과 task 간의 설정을 자유롭게 하기 위해서 가능해진 듯 함.

이 때 본 바로는, DAG보다 task 스케쥴이 더 빠른 경우 task instance가 생성되지 않고 DAG run만 생성됐다. Task들이 모두 스케쥴이 더 빠른 경우에는 DAG run이 생성되고 바로 success 처리됐다.

## Triggerer

Deferrable task를 사용하려다가.

Airflow에는 특정 시점에 실행하는 등 어떤 조건이 만족되면 실행되는 작업들이 있는데 이를 deferrable task라고 한다. 이 작업들의 조건을 확인하려면 무언가 프로세스가 있어야하는데 이것이 triggerer임. Trigger 되기 전 까지는 task가 리소스를 차지하지 않는다. (추측컨대 DB의 task 상태만 바뀌고 리소스는 안 차지하는 듯)

## Setup-teardown

Airflow 2.7 부터 setup-teardown이 도입됨.[^1] Unittest같은 테스트 프레임워크에서의 개념과 비슷하게 보면 될 듯. 일반 task와는 teardown은 상위 task들이 실패해도 실행된다는 점이 다르다. Setup은 teardown과 짝으로 다녀야해서 존재하는 것으로 보임.

문서에는 데이터 퀄리티 체크를 위해 사용할 수 있다고 한다.
~~DuckDB같은 In-memory DB를 잠깐 띄웠다가 OLAP 쿼리를 돌리고 tear down 하는 식으로 활용할 수도 있을 것 같다.~~ setup, teardown이 사이의 task 들과 별개의 task여서 이 경우는 다를듯.
한 operator에서 다 실행하면 될 것 같은데 왜 나눠야하는지 아직 잘 모르겠음.

## XCom에는 serialize된 데이터가 들어간다

XCom은 데이터베이스에 저장되기 때문에, python object나 numpy 등을 저장한다고 하면 자연스럽게 serialization이 따라온다.[^2] 데이터베이스는 그러한 객체들과 호환되지 않기 때문. 적어도 pickle을 하던지 string으로 만들던지 데이터베이스에 저장할 수 있는 형태로 만들어야 한다.

객체에 따라서 기본 ser/de가 비효율적일 수도 있기 때문에, 이 경우에는 custom serde를 작성할 수도 있다.

## XCom 사용이 커지면 custom backend를 고려할 수 있다

Airflow는 task간 데이터를 주고받기 위해서 XCom을 사용한다(cross(=X) Communication.) XCom은 기본적으로 metadata database에 그 정보를 저장한다.

XCom을 사용할 때 metadata database 만으로 충분하지 않다면 custom backend 를 고려해볼 수 있다. 용량이 부족하거나, 기본 database 만으로는 기능이 부족하다던지 xcom의 사용처가 늘어나면서 중요도가 커지면 옮기는 것을 고려해볼 수 있겠다.

## TaskFlow는 XCom 사용을 편하게 해준다

Airflow 2.10 문서 보다가.

기존에는 task 간 통신을 위해 xcom에 task instance로 가져와서 값을 넣는 작업을 해야했다면, TaskFlow API를 사용하면 더 pythonic하게 task를 작성하고 xcom을 직접 참조할 필요가 없어져서 편의성이 증가한다.

아래는 예시. 기존에는 xcom을 명시적으로 참조해야했다.

```python
def transform(**kwargs):
    ti = kwargs["ti"]
    extract_data_string = ti.xcom_pull(task_ids="extract", key="order_data")
    order_data = json.loads(extract_data_string)

    total_order_value = 0
    for value in order_data.values():
        total_order_value += value

    total_value = {"total_order_value": total_order_value}
    total_value_json_string = json.dumps(total_value)
    ti.xcom_push("total_order_value", total_value_json_string)
```

TaskFlow를 사용하면 인자와 리턴에서 자동으로 xcom을 사용하게 된다.

```python
@task(multiple_outputs=True)
def transform(order_data_dict: dict):
    """
    #### Transform task
    A simple Transform task which takes in the collection of order data and
    computes the total order value.
    """
    total_order_value = 0

    for value in order_data_dict.values():
        total_order_value += value

    return {"total_order_value": total_order_value}
```

## Jinja template

Airflow는 jinja template을 사용해서 매크로를 실행함. `{% raw %}{{ ds }}{% endraw %}` 등. Jinja template은 runtime에 렌더링된다. 구체적으로는 operator의 `pre_execute` 실행 전에 실행된다.[^3]

각 템플릿 필드는 한 번만 렌더링된다. 아마 pre_execute의 실행은 한 번만 있기 때문. 이 때문에 callable 내에서 템플릿 렌더링을 하려면 수동으로 재호출해야한다.

DONT:

```python
def build_complex_command(context, jinja_env):
    with open("file.csv") as f:
        return do_complex_things(f)
```

DO:

```python
def build_complex_command(context, jinja_env):
    with open("file.csv") as f:
        data = do_complex_things(f)
    return context["task"].render_template(data, context, jinja_env)
```

어떤 클래스에 jinja template을 전달해서 쓰고싶을 때, `template_fields`에 그 필드를 추가하면 Airflow가 runtime에 그 필드를 렌더링해준다.

```python
class MyDataReader:
    template_fields: Sequence[str] = ("path",)

    def __init__(self, my_path):
        self.path = my_path

    # [additional code here...]


t = PythonOperator(
    task_id="transform_data",
    python_callable=transform_data,
    op_args=[MyDataReader("/tmp/{% raw %}{{ ds }}{% endraw %}/my_file")],
    dag=dag,
)
```

Operator에 `template_ext`를 정의해서, suffix를 기준으로 template 렌더링을 하도록 정의할 수도 있다.

[^1]: https://www.astronomer.io/docs/learn/airflow-setup-teardown/#creating-setup-teardown-workflows

[^2]: https://www.astronomer.io/docs/learn/custom-xcom-backend-strategies/

[^3]: "Operators — Airflow Documentation," https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/operators.html#concepts-jinja-templating (accessed Apr. 28, 2025).
