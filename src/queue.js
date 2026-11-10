const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageBatchCommand,
} = require('@aws-sdk/client-sqs');
const { HttpError } = require('./errors');

const MAX_MESSAGE_BYTES = 256 * 1024;
const RECEIVE_BATCH_SIZE = 10;
const LONG_POLL_SECONDS = 20;

function createQueue({ client = null, url } = {}) {
  async function send(body) {
    const message = JSON.stringify(body);
    if (Buffer.byteLength(message) > MAX_MESSAGE_BYTES) {
      throw new HttpError(413, `Payload exceeds ${MAX_MESSAGE_BYTES / 1024} KB`);
    }
    await client.send(new SendMessageCommand({ QueueUrl: url, MessageBody: message }));
  }

  async function receive({ abortSignal } = {}) {
    const { Messages = [] } = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: url,
        MaxNumberOfMessages: RECEIVE_BATCH_SIZE,
        WaitTimeSeconds: LONG_POLL_SECONDS,
      }),
      { abortSignal },
    );
    return Messages.map((message) => ({
      id: message.MessageId,
      receiptHandle: message.ReceiptHandle,
      body: JSON.parse(message.Body),
    }));
  }

  async function remove(messages) {
    if (messages.length === 0) {
      return;
    }
    await client.send(
      new DeleteMessageBatchCommand({
        QueueUrl: url,
        Entries: messages.map((message, index) => ({ Id: String(index), ReceiptHandle: message.receiptHandle })),
      }),
    );
  }

  return { enabled: Boolean(client), send, receive, remove };
}

const url = process.env.INGEST_QUEUE_URL;
const ingestQueue = createQueue({ client: url ? new SQSClient({}) : null, url });

module.exports = { ingestQueue, createQueue, MAX_MESSAGE_BYTES };
