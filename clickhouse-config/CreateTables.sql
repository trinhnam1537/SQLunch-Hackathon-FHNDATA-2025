create database kafka;

CREATE TABLE kafka.events (
  timestamp DateTime,
  eventType String,
  visitorId String,
  sessionId String,
  url String,
  action String
) ENGINE = MergeTree()
ORDER BY (timestamp);

-------------------------------------------------
-------------------------------------------------
-------------------------------------------------

CREATE DATABASE analytics;

-- CREATE TABLE analytics.visitors (
--   visitorId String,
--   date Date,
--   first_seen DateTime,
--   last_seen DateTime
-- ) ENGINE = ReplacingMergeTree()
-- ORDER BY (visitorId, date);

-- CREATE MATERIALIZED VIEW analytics.mv_visitors
-- TO analytics.visitors
-- AS
-- SELECT
--   visitorId,
--   toDate(timestamp) AS date,
--   min(timestamp) AS first_seen,
--   max(timestamp) AS last_seen
-- FROM kafka.events
-- GROUP BY visitorId, date;


-------------------------------------------------
-------------------------------------------------
-------------------------------------------------


CREATE TABLE analytics.active_sessions
(
    sessionId String,
    visitorId String,
    lastEventTime DateTime,
    lastEventType String,
    url String,
    _version UInt64
)
ENGINE = ReplacingMergeTree(_version)
ORDER BY sessionId
TTL lastEventTime + INTERVAL 20 MINUTE DELETE;




---------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_events_to_active_sessions
TO analytics.active_sessions
AS
SELECT
    sessionId,
    visitorId,
    timestamp AS lastEventTime,
    eventType AS lastEventType,
    url,
    toUnixTimestamp(timestamp) AS version
FROM kafka.events;






--------------------------------------------------
-----------------------------------------------














--------------------------------------------------
---check size

SELECT
        `table`,
        formatReadableSize(sum(data_compressed_bytes)) AS compressed_size
FROM system.parts
WHERE (database = 'kafka') AND active
GROUP BY `table`;











SELECT * FROM "kafka"."events" order by timestamp desc limit 100





y