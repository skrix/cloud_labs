// Load test: "few writes, many reads".
// Each iteration of a virtual user = 1 write (a device sends a reading) + 9 reads
// (the owner looks at the new reading, the readings list, the device and its catalog data).
import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

if (!__ENV.BASE_URL) {
  throw new Error('BASE_URL is required');
}
const BASE_URL = __ENV.BASE_URL.replace(/\/+$/, '');
const API = `${BASE_URL}/api`;
const VUS = Number(__ENV.VUS || 40);
const RAMP_UP = __ENV.RAMP_UP || '3m';
const STEADY = __ENV.STEADY || '5m';
const RAMP_DOWN = __ENV.RAMP_DOWN || '2m';
const THINK_TIME = Number(__ENV.THINK_TIME || 0.5); // max seconds between requests of one user
const DEVICES_PER_USER = 10;
const RESULTS_DIR = __ENV.RESULTS_DIR || '.';

const NAMES = {
  ingest: 'POST /ingest',
  reading: 'GET /user-devices/:id/readings/:readingId',
  readings: 'GET /user-devices/:id/readings',
  userDevice: 'GET /user-devices/:id',
  userDevices: 'GET /user-devices',
  device: 'GET /devices/:id',
  devices: 'GET /devices',
  firmwares: 'GET /firmwares?deviceId=',
};

// An always-passing threshold per endpoint makes k6 report its latency separately.
const perEndpoint = Object.fromEntries(
  Object.values(NAMES).map((name) => [`http_req_duration{name:${name}}`, ['max>=0']]),
);

export const options = {
  scenarios: {
    users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: VUS },
        { duration: STEADY, target: VUS },
        { duration: RAMP_DOWN, target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  setupTimeout: '5m',
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    ...perEndpoint,
  },
};

function request(method, path, body, params = {}) {
  return http.request(method, `${API}${path}`, body ? JSON.stringify(body) : null, {
    ...params,
    headers: { 'Content-Type': 'application/json', ...params.headers },
  });
}

function mustSucceed(res, what) {
  if (res.status < 200 || res.status >= 300) {
    fail(`setup: ${what} failed with ${res.status}: ${res.body}`);
  }
  return res.json();
}

function signIn(email, password) {
  return mustSucceed(request('POST', '/auth/signin', { email, password }), `sign in ${email}`).token;
}

function catalogDevice(token) {
  const devices = mustSucceed(
    request('GET', '/devices', null, { headers: { Authorization: `Bearer ${token}` } }),
    'list devices',
  );
  if (devices.length === 0) {
    fail('setup: device catalog is empty; run npm run db:setup (ECS runs it on task start)');
  }
  return devices[0];
}

// Runs once: creates test users and one owned device (with its API key) per virtual user.
// Few users keep bcrypt (sign up / sign in) out of the measured load.
export function setup() {
  const runId = `${Date.now()}`;
  const password = `loadtest-${runId}`;
  const users = [];
  for (let i = 0; i < Math.ceil(VUS / DEVICES_PER_USER); i += 1) {
    const email = `loadtest-${runId}-${i}@example.com`;
    mustSucceed(request('POST', '/auth/signup', { email, password }), `sign up ${email}`);
    users.push(signIn(email, password));
  }

  const device = catalogDevice(users[0]);
  const slots = [];
  for (let i = 0; i < VUS; i += 1) {
    const token = users[Math.floor(i / DEVICES_PER_USER)];
    const created = mustSucceed(
      request('POST', '/user-devices', { name: `Load test sensor ${i}`, deviceId: device.id }, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      'create user device',
    );
    slots.push({ token, apiKey: created.apiKey, userDeviceId: created.userDevice.id, deviceId: device.id });
  }
  return { slots };
}

function think() {
  sleep(Math.random() * THINK_TIME);
}

function get(path, name, token) {
  const res = http.get(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name },
  });
  check(res, { [`${name} 200`]: (r) => r.status === 200 });
  think();
  return res;
}

let previousReadingId;

export default function ({ slots }) {
  const { token, apiKey, userDeviceId, deviceId } = slots[(__VU - 1) % slots.length];
  const own = `/user-devices/${userDeviceId}`;

  // 1 write
  const reading = { temperature: 18 + Math.random() * 10, humidity: Math.round(30 + Math.random() * 40) };
  const ingest = http.post(`${API}/ingest`, JSON.stringify(reading), {
    headers: { 'Content-Type': 'application/json', 'X-Device-Key': apiKey },
    tags: { name: NAMES.ingest },
  });
  const ingested = check(ingest, { [`${NAMES.ingest} 201`]: (r) => r.status === 201 });
  const readingId = ingested ? ingest.json('id') : previousReadingId;
  think();

  // 9 reads
  if (readingId) {
    get(`${own}/readings/${readingId}`, NAMES.reading, token);
  }
  get(`${own}/readings?limit=20`, NAMES.readings, token);
  get(own, NAMES.userDevice, token);
  get(`/devices/${deviceId}`, NAMES.device, token);
  get('/user-devices', NAMES.userDevices, token);
  get('/devices', NAMES.devices, token);
  get(`/firmwares?deviceId=${deviceId}`, NAMES.firmwares, token);
  if (previousReadingId || readingId) {
    get(`${own}/readings/${previousReadingId || readingId}`, NAMES.reading, token);
  }
  get(`${own}/readings?limit=20`, NAMES.readings, token);

  previousReadingId = readingId;
}

function ms(value) {
  return `${Math.round(value)} ms`;
}

function report(data) {
  const m = data.metrics;
  const d = m.http_req_duration.values;
  const rows = Object.values(NAMES)
    .map((name) => [name, m[`http_req_duration{name:${name}}`]])
    .filter(([, metric]) => metric)
    .map(([name, metric]) => {
      const v = metric.values;
      return `| \`${name}\` | ${ms(v.med)} | ${ms(v['p(95)'])} | ${ms(v['p(99)'])} |`;
    });

  return [
    `# Load test report`,
    '',
    `- Target: ${BASE_URL}`,
    `- Profile: ramp 0→${VUS} VUs in ${RAMP_UP}, ${STEADY} at ${VUS} VUs, ramp down in ${RAMP_DOWN}`,
    `- Finished: ${new Date().toISOString()}`,
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Requests | ${m.http_reqs.values.count} |`,
    `| Throughput | ${m.http_reqs.values.rate.toFixed(1)} req/s |`,
    `| Iterations (1 write + 9 reads) | ${m.iterations.values.count} |`,
    `| Error rate | ${(m.http_req_failed.values.rate * 100).toFixed(2)} % |`,
    `| Latency p50 | ${ms(d.med)} |`,
    `| Latency p95 | ${ms(d['p(95)'])} |`,
    `| Latency p99 | ${ms(d['p(99)'])} |`,
    `| Latency max | ${ms(d.max)} |`,
    '',
    '| Endpoint | p50 | p95 | p99 |',
    '|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

export function handleSummary(data) {
  const outputs = {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`${RESULTS_DIR}/summary.json`]: JSON.stringify(data, null, 2),
  };
  // No iterations (e.g. setup failed): nothing to report.
  if (data.metrics.iterations) {
    outputs[`${RESULTS_DIR}/report.md`] = report(data);
  }
  return outputs;
}
