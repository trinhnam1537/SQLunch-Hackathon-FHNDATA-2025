from pyspark.sql import SparkSession
from pyspark.sql.functions import col

spark = SparkSession.builder \
    .appName("Airflow_MinIO_Test") \
    .config("spark.hadoop.fs.s3a.endpoint", "http://minio:9000") \
    .config("spark.hadoop.fs.s3a.access.key", "admin") \
    .config("spark.hadoop.fs.s3a.secret.key", "namvudit") \
    .config("spark.hadoop.fs.s3a.path.style.access", "true") \
    .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
    .getOrCreate()

print("Spark session started")

df = spark.read.csv("s3a://siuuu/Datasets.csv", header=True, inferSchema=True)

df2 = df.withColumn("Id_copy", col("Id"))

df2.write.mode("overwrite").csv("s3a://siuuu/Datasets_with_copy/")

print("Finished processing and wrote output to MinIO")

spark.stop()
