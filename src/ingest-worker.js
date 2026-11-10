const { logger } = require('./utils/logger');

const RETRY_DELAY_MS = 1000;

function createIngestWorker({ queue, store }) {
  const controller = new AbortController();
  let stopping = false;

  async function processMessages(messages) {
    const done = [];
    for (const message of messages) {
      try {
        await store(message.body.readings);
        done.push(message);
      } catch (error) {
        logger.error('ingest message failed', { messageId: message.id, error: error.message });
      }
    }
    await queue.remove(done);
    return done.length;
  }

  async function run() {
    while (!stopping) {
      try {
        const messages = await queue.receive({ abortSignal: controller.signal });
        await processMessages(messages);
      } catch (error) {
        if (stopping) {
          break;
        }
        logger.error('ingest poll failed', { error: error.message });
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  function stop() {
    stopping = true;
    controller.abort();
  }

  return { run, stop, processMessages };
}

module.exports = { createIngestWorker };
