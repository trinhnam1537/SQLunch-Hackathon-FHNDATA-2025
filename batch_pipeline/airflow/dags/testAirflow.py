from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow import DAG
from datetime import datetime
print('start')
print('start')
print('start')
print('start')
print('start')

with DAG(
    dag_id="spark_minio_test",
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False,
) as dag:

    spark_task = SparkSubmitOperator(
        task_id="spark_minio_job",
        application="/opt/airflow/apps/testSpark.py",
        conn_id="spark_default",
        verbose=True
    )
print('end')
print('end')
print('end')
print('end')
print('end')
