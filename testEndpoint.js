require('dotenv').config();

const testEndpoint = async () => {
  try {
    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}/api/analytics/session-kpis`;
    const startDate = "2025-01-01";
    const endDate = "2025-12-31";

    console.log("Testing endpoint:", url);
    console.log("Payload:", { startDate, endDate });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate })
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    const data = await response.json();
    console.log("Response body:");
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("\n✅ SUCCESS!");
      console.log(`Long Sessions Ratio: ${data.data.longSessionRatio}%`);
      console.log(`Comeback Rate: ${data.data.comebackRate}%`);
    } else if (data.error) {
      console.log("\n❌ ERROR:", data.error);
    }
  } catch (error) {
    console.error("❌ Fetch error:", error);
  }
};

testEndpoint();
