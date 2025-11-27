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


CREATE TABLE analytics.sessions
(
    -- Core identifiers
    sessionId String,
    visitorId String,

    -- Session timing
    startTime DateTime,
    endTime DateTime,

    -- URLs
    urlStart String,
    urlEnd String,

    -- Idle / dwell
    totalIdleSeconds UInt32,
    dwellSeconds UInt32,

    -- 🔥 NEW METRICS
    totalClicks UInt32,          -- count of click events
    totalActions UInt32,         -- all activity events (click, move, keydown...)
    totalPageViews UInt32,       -- count of page_view events
    productViews UInt32,         -- URL matches /all-products/product/<id>
    urlMostActive String,        -- URL with highest activity

    -- Optional ingestion version
    _version UInt64 DEFAULT 1
)
ENGINE = ReplacingMergeTree(_version)
ORDER BY (sessionId);

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
TTL lastEventTime + INTERVAL 8 MINUTE DELETE;




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
    toUnixTimestamp(timestamp) AS _version
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





