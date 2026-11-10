const crypto = require('crypto');
const { HttpError } = require('./errors');
const { redisClient } = require('./redis');
const { logger } = require('./utils/logger');

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;
const IN_PROGRESS_TTL_SECONDS = 60;

function fingerprint(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');
}

function createIdempotency({ client = null, ttlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  async function claim(storeKey, requestFingerprint) {
    const inProgress = JSON.stringify({ state: 'in-progress', fingerprint: requestFingerprint });
    const claimed = await client.set(storeKey, inProgress, { NX: true, EX: IN_PROGRESS_TTL_SECONDS });
    return claimed ? null : JSON.parse(await client.get(storeKey));
  }

  async function release(storeKey) {
    try {
      await client.del(storeKey);
    } catch (error) {
      logger.error('idempotency release failed', { key: storeKey, error: error.message });
    }
  }

  // Runs execute() once per (scope, key) within ttlSeconds and replays its response afterwards.
  // execute() resolves to { status, body, location? }; a thrown error frees the key for a retry.
  async function run({ scope, key, body, execute }) {
    if (!client || !key) {
      return { ...(await execute()), replayed: false };
    }

    const storeKey = `idempotency:${scope}:${key}`;
    const requestFingerprint = fingerprint(body);
    let existing;
    try {
      existing = await claim(storeKey, requestFingerprint);
    } catch (error) {
      logger.error('idempotency unavailable', { key: storeKey, error: error.message });
      return { ...(await execute()), replayed: false };
    }

    if (existing) {
      if (existing.fingerprint !== requestFingerprint) {
        throw new HttpError(422, 'Idempotency-Key was already used with a different request body');
      }
      if (existing.state === 'in-progress') {
        throw new HttpError(409, 'A request with this Idempotency-Key is still in progress');
      }
      return { ...existing.response, replayed: true };
    }

    let response;
    try {
      response = await execute();
    } catch (error) {
      await release(storeKey);
      throw error;
    }

    try {
      const done = { state: 'done', fingerprint: requestFingerprint, response };
      await client.set(storeKey, JSON.stringify(done), { EX: ttlSeconds });
    } catch (error) {
      logger.error('idempotency store failed', { key: storeKey, error: error.message });
    }
    return { ...response, replayed: false };
  }

  return { run, enabled: Boolean(client), ttlSeconds };
}

const ttlSeconds = Number(process.env.IDEMPOTENCY_TTL_SECONDS) || DEFAULT_TTL_SECONDS;
const idempotency = createIdempotency({ client: redisClient, ttlSeconds });

module.exports = { idempotency, createIdempotency, DEFAULT_TTL_SECONDS };
