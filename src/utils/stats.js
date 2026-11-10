// Summary statistics over device readings, computed in the API process (CPU-bound on purpose:
// the database returns raw rows, aggregation and percentiles happen in JavaScript).

const BUCKET_MS = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

function round(value) {
  return Math.round(value * 100) / 100;
}

// Nearest-rank percentile of an ascending array.
function percentile(sorted, p) {
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: round(sum / sorted.length),
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
  };
}

// { field: [values] } for every top-level numeric field of the readings' data.
function numericFields(readings) {
  const fields = {};
  for (const { data } of readings) {
    for (const [field, value] of Object.entries(data ?? {})) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        (fields[field] ??= []).push(value);
      }
    }
  }
  return fields;
}

function summarizeFields(readings) {
  return Object.fromEntries(
    Object.entries(numericFields(readings)).map(([field, values]) => [field, summarize(values)]),
  );
}

// readings: [{ data, createdAt }]; bucket: 'hour' | 'day'.
function readingStats(readings, bucket) {
  const bucketMs = BUCKET_MS[bucket];
  const groups = new Map();
  for (const reading of readings) {
    const start = Math.floor(new Date(reading.createdAt).getTime() / bucketMs) * bucketMs;
    if (!groups.has(start)) {
      groups.set(start, []);
    }
    groups.get(start).push(reading);
  }

  const buckets = [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, group]) => ({
      start: new Date(start).toISOString(),
      count: group.length,
      fields: summarizeFields(group),
    }));

  return { count: readings.length, fields: summarizeFields(readings), buckets };
}

module.exports = { BUCKETS: Object.keys(BUCKET_MS), percentile, summarize, readingStats };
