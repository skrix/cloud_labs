const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createIngestWorker } = require('../src/ingest-worker');

function fakeQueue(batches) {
  const removed = [];
  return {
    removed,
    async receive() {
      return batches.shift() ?? [];
    },
    async remove(messages) {
      removed.push(...messages.map((message) => message.id));
    },
  };
}

function message(id, readings) {
  return { id, receiptHandle: `handle-${id}`, body: { readings } };
}

describe('ingest worker', () => {
  it('stores each message and deletes the stored ones', async () => {
    const queue = fakeQueue([]);
    const stored = [];
    const worker = createIngestWorker({ queue, store: async (readings) => stored.push(...readings) });

    const count = await worker.processMessages([message('a', [{ n: 1 }]), message('b', [{ n: 2 }, { n: 3 }])]);

    assert.equal(count, 2);
    assert.deepEqual(stored, [{ n: 1 }, { n: 2 }, { n: 3 }]);
    assert.deepEqual(queue.removed, ['a', 'b']);
  });

  it('leaves a failed message in the queue for redelivery', async () => {
    const queue = fakeQueue([]);
    const store = async (readings) => {
      if (readings[0].fail) {
        throw new Error('database down');
      }
    };
    const worker = createIngestWorker({ queue, store });

    await worker.processMessages([message('ok', [{ n: 1 }]), message('bad', [{ fail: true }])]);

    assert.deepEqual(queue.removed, ['ok']);
  });

  it('polls until stopped', async () => {
    const queue = fakeQueue([[message('a', [{ n: 1 }])], [message('b', [{ n: 2 }])]]);
    const worker = createIngestWorker({
      queue,
      store: async () => {
        if (queue.removed.length === 1) {
          worker.stop();
        }
      },
    });

    await worker.run();

    assert.deepEqual(queue.removed, ['a', 'b']);
  });
});
