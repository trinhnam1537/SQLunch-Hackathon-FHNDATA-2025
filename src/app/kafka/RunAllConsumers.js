const { EndSessionConsumerStart } = require('./EndSessionConsumer');
const { RawIngestConsumerStart } = require('./RawIngestConsumer');

async function startAllConsumers() {
    try {
        // console.log("🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑Starting RawIngestConsumer...");
        // RawIngestConsumerStart();

        console.log("🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑Starting ActiveSessionConsumer...");
        EndSessionConsumerStart();

        console.log("🤑🤑🤑🤑Both Kafka consumers running.🤑🤑🤑");
    } catch (err) {
        console.error("💩💩💩💩💩💩💩Error starting consumers:💩💩💩💩💩💩💩", err);
    }
}
module.exports = { startAllConsumers }
// startAllConsumers();
