// async function getLog(topic, value) {
//   if (window.isLoggedIn) {
//     const response = await fetch('/data/streamingKafka', {
//       method: 'POST',
//       headers: {'Content-Type': 'application/json'},
//       body: JSON.stringify({
//         topic: topic,
//         value: value
//       })
//     })
//     if (!response.ok) throw new Error(`Response status: ${response.status}`)
//   }
// }

/// better getLog function (i think )
async function getLog(topic, value) {
  if (!window.isLoggedIn) return;

  try {
    await fetch("/data/streamingKafka", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, value })
    });
  } catch (err) {
    console.warn("Failed to send log:", err);
  }
}