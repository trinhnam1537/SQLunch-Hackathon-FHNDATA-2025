const { createClient } = require("@clickhouse/client");

const clickhouse = createClient({
  host: "http://localhost:8123",
  username: "default",
  password: "",
  database: "analytics"
});

async function testSessionKPIs() {
  try {
    console.log("🔍 Testing Session KPIs...\n");

    // Test dates (adjust to match your data)
    const startDate = "2025-01-01";
    const endDate = "2025-12-31";

    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);

    // ============================================
    // QUERY 1: Sessions > 5 seconds
    // ============================================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Query 1: Sessions lasting > 5 seconds");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const query1 = `
      SELECT 
        countIf(dwellSeconds > 5) as longSessions,
        count() as totalSessions,
        (countIf(dwellSeconds > 5) / count()) * 100 as ratio
      FROM analytics.sessions
      WHERE startTime >= toDateTime('${startDate}') AND startTime <= toDateTime('${endDate}')
    `;

    console.log("SQL Query:");
    console.log(query1);
    console.log("\n📊 Results:");

    const result1 = await clickhouse.query({
      query: query1
    });

    const rows1 = await result1.json();
    console.log(JSON.stringify(rows1, null, 2));
    console.log("");

    // ============================================
    // QUERY 2: User Comeback Rate
    // ============================================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Query 2: User Comeback Rate");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const query2 = `
      SELECT 
        uniqIf(visitorId, sessionCount >= 2) as returningUsers,
        uniq(visitorId) as totalUsers,
        (uniqIf(visitorId, sessionCount >= 2) / uniq(visitorId)) * 100 as comebackRate
      FROM (
        SELECT 
          visitorId,
          count() as sessionCount
        FROM analytics.sessions
        WHERE startTime >= toDateTime('${startDate}') AND startTime <= toDateTime('${endDate}')
        GROUP BY visitorId
      )
    `;

    console.log("SQL Query:");
    console.log(query2);
    console.log("\n📊 Results:");

    const result2 = await clickhouse.query({
      query: query2
    });

    const rows2 = await result2.json();
    console.log(JSON.stringify(rows2, null, 2));
    console.log("");

    // ============================================
    // DEBUG: Check raw data
    // ============================================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Debug: Sample sessions data");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const debugQuery = `
      SELECT 
        sessionId,
        visitorId,
        dwellSeconds,
        startTime
      FROM analytics.sessions
      WHERE startTime >= toDateTime('${startDate}') AND startTime <= toDateTime('${endDate}')
      LIMIT 10
    `;

    console.log("SQL Query:");
    console.log(debugQuery);
    console.log("\n📊 Results:");

    const debugResult = await clickhouse.query({
      query: debugQuery
    });

    const debugRows = await debugResult.json();
    console.log(JSON.stringify(debugRows, null, 2));

    console.log("\n✅ Test completed successfully!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:");
    console.error(error);
  }
}

testSessionKPIs();
