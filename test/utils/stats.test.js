const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { percentile, summarize, readingStats } = require('../../src/utils/stats');

describe('percentile', () => {
  it('uses the nearest rank', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    assert.equal(percentile(sorted, 50), 5);
    assert.equal(percentile(sorted, 95), 10);
    assert.equal(percentile([7], 95), 7);
  });
});

describe('summarize', () => {
  it('returns count, min, max, rounded avg, p50 and p95', () => {
    assert.deepEqual(summarize([3, 1, 2]), { count: 3, min: 1, max: 3, avg: 2, p50: 2, p95: 3 });
    assert.equal(summarize([1, 2, 2]).avg, 1.67);
  });
});

describe('readingStats', () => {
  const hour = (h, m = 0) => new Date(Date.UTC(2026, 0, 1, h, m)).toISOString();

  it('summarizes numeric fields overall and per bucket, ignoring other values', () => {
    const readings = [
      { createdAt: hour(10, 5), data: { temperature: 20, humidity: 40, label: 'x' } },
      { createdAt: hour(10, 40), data: { temperature: 22 } },
      { createdAt: hour(12, 0), data: { temperature: 30, humidity: null } },
    ];
    const stats = readingStats(readings, 'hour');

    assert.equal(stats.count, 3);
    assert.deepEqual(Object.keys(stats.fields).sort(), ['humidity', 'temperature']);
    assert.deepEqual(stats.fields.temperature, { count: 3, min: 20, max: 30, avg: 24, p50: 22, p95: 30 });
    assert.deepEqual(stats.buckets.map((b) => [b.start, b.count]), [[hour(10), 2], [hour(12), 1]]);
    assert.equal(stats.buckets[0].fields.temperature.avg, 21);
  });

  it('groups by day', () => {
    const readings = [
      { createdAt: hour(1), data: { t: 1 } },
      { createdAt: hour(23), data: { t: 2 } },
    ];
    assert.equal(readingStats(readings, 'day').buckets.length, 1);
  });

  it('returns empty stats for no readings', () => {
    assert.deepEqual(readingStats([], 'hour'), { count: 0, fields: {}, buckets: [] });
  });
});
