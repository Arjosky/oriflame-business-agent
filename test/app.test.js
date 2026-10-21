const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const dashboardSummary = {
  total: 3,
  successful: 1,
  failed: 1,
  pending: 1,
  statusBreakdown: [
    { status: 'Sent', count: 1 },
    { status: 'Failed', count: 1 },
    { status: 'Pending', count: 1 },
  ],
};

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('serves health, JSON dashboard, and HTML dashboard routes', async (t) => {
  const service = {
    getDashboardSummary: async () => dashboardSummary,
  };
  const { server, baseUrl } = await startServer(createApp({ campaignService: service }));
  t.after(() => stopServer(server));

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  const apiResponse = await fetch(`${baseUrl}/api/dashboard`);
  assert.equal(apiResponse.status, 200);
  assert.deepEqual(await apiResponse.json(), dashboardSummary);

  const htmlResponse = await fetch(baseUrl);
  const html = await htmlResponse.text();
  assert.equal(htmlResponse.status, 200);
  assert.match(html, /Oriflame Campaign Dashboard/);
  assert.match(html, />1<\/dd>/);
});

test('returns a generic 500 response when the service fails', async (t) => {
  const service = {
    getDashboardSummary: async () => {
      throw new Error('simulated database failure');
    },
  };
  const { server, baseUrl } = await startServer(createApp({ campaignService: service }));
  t.after(() => stopServer(server));

  const response = await fetch(`${baseUrl}/api/dashboard`);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Internal server error' });
});
