---
title: "Gotchas and features I ran into using Airflow"
date: 2025-04-28 13:59
categories: dev
tags: ["airflow"]
published: false
lang: en
locale: en_US
ref: airflow-gotchas
permalink: /en/airflow-gotchas.html
---

## When the task schedule is faster than the DAG schedule

While troubleshooting why an Airflow task instance wasn't being created.

Airflow DAGs and tasks can have different schedules from each other. This seems to have become possible in order to freely configure things between DAGs and tasks.

What I saw at this time was, when the task schedule was faster than the DAG, the task instance wasn't created and only a DAG run was created. When all the tasks had a faster schedule, a DAG run was created and immediately treated as success.

## Triggerer

While trying to use a deferrable task.

In Airflow there are jobs that run when some condition is satisfied, like running at a specific point in time, and these are called deferrable tasks. To check these jobs' conditions there needs to be some process, and that's the triggerer. Until it's triggered the task doesn't occupy resources. (My guess is only the task state in the DB changes and it doesn't occupy resources)

## Setup-teardown

Setup-teardown was introduced from Airflow 2.7.[^1] It seems fine to look at it similarly to the concept in test frameworks like unittest. What's different from a regular task is that teardown runs even if the parent tasks fail. Setup seems to exist because it has to go around as a pair with teardown.

The docs say it can be used for data quality checks.
~~You could also use it in a way where you briefly spin up an in-memory DB like DuckDB, run OLAP queries, and tear down.~~ setup and teardown are separate tasks from the tasks in between, so this case would be different.
I feel like you could just run it all in one operator, and I still don't really get why you'd split it.

## Serialized data goes into XCom

Because XCom is stored in a database, if you say you're storing a python object or numpy etc., serialization naturally follows.[^2] Because databases aren't compatible with those kinds of objects. You at least have to pickle it or make it a string or make it into a form that can be stored in a database.

Depending on the object the default ser/de might be inefficient, so in that case you can also write a custom serde.

## When XCom usage grows you can consider a custom backend

Airflow uses XCom to pass data between tasks (cross(=X) Communication.) XCom by default stores that information in the metadata database.

If the metadata database alone isn't enough when using XCom, you can consider a custom backend. If capacity is insufficient, or the default database alone lacks features, as the uses of xcom grow and its importance gets bigger, you could consider moving it.

## TaskFlow makes using XCom convenient

While looking at the Airflow 2.10 docs.

Previously, for communication between tasks you had to get it as a task instance from xcom and put the value in, but if you use the TaskFlow API you can write tasks more pythonically and don't need to directly reference xcom, so convenience increases.

Below is an example. Previously you had to explicitly reference xcom.

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

If you use TaskFlow, xcom is used automatically in the arguments and return.

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

Airflow uses jinja templates to run macros. `{% raw %}{{ ds }}{% endraw %}` etc. Jinja templates are rendered at runtime. Specifically they run before the operator's `pre_execute` runs.[^3]

Each template field is rendered only once. Probably because pre_execute only runs once. Because of this, if you want to do template rendering inside a callable you have to recall it manually.

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

When you want to pass a jinja template to some class and use it, if you add that field to `template_fields`, Airflow will render that field at runtime.

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

You can also define `template_ext` on an Operator so that template rendering is done based on the suffix.

[^1]: https://www.astronomer.io/docs/learn/airflow-setup-teardown/#creating-setup-teardown-workflows

[^2]: https://www.astronomer.io/docs/learn/custom-xcom-backend-strategies/

[^3]: "Operators — Airflow Documentation," https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/operators.html#concepts-jinja-templating (accessed Apr. 28, 2025).
