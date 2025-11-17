async function getLog(topic, value) {
  if (window.isLoggedIn) {
    const response = await fetch('/data/streamingKafka', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        topic: topic,
        value: value
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
  }
}