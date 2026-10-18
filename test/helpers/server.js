const { once } = require('node:events');
const { app } = require('../../src/app');

async function startServer() {
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://localhost:${server.address().port}`;

  async function request(path, { method = 'GET', token, apiKey, body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (apiKey) {
      headers['X-Device-Key'] = apiKey;
    }

    const res = await fetch(`${baseUrl}${path}`, { method, headers, body: JSON.stringify(body) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  }

  function close() {
    server.close();
  }

  return { baseUrl, request, close };
}

module.exports = { startServer };
