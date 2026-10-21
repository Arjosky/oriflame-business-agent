const express = require('express');
const { createCampaignService } = require('./campaignService');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderDashboard(summary) {
  const breakdown = summary.statusBreakdown.length
    ? summary.statusBreakdown
        .map(
          ({ status, count }) =>
            `<li><strong>${escapeHtml(status)}</strong>: ${count}</li>`
        )
        .join('')
    : '<li>No member records found.</li>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Oriflame Campaign Dashboard</title>
  </head>
  <body>
    <main>
      <h1>Oriflame Campaign Dashboard</h1>
      <dl>
        <dt>Total members</dt><dd>${summary.total}</dd>
        <dt>Successfully sent</dt><dd>${summary.successful}</dd>
        <dt>Failed</dt><dd>${summary.failed}</dd>
        <dt>Pending</dt><dd>${summary.pending}</dd>
      </dl>
      <h2>Status breakdown</h2>
      <ul>${breakdown}</ul>
    </main>
  </body>
</html>`;
}

function createApp({ campaignService = createCampaignService() } = {}) {
  const app = express();

  app.locals.campaignService = campaignService;
  app.use(express.json());

  const getCampaignService = () => app.locals.campaignService;

  app.get('/health', async (req, res) => {
    await getCampaignService().getDashboardSummary();
    res.json({ status: 'ok' });
  });

  app.get('/api/dashboard', async (req, res) => {
    const summary = await getCampaignService().getDashboardSummary();
    res.json(summary);
  });

  app.get('/', async (req, res) => {
    const summary = await getCampaignService().getDashboardSummary();
    res.type('html').send(renderDashboard(summary));
  });

  app.use((error, req, res, next) => {
    console.error('Request failed:', error);

    if (res.headersSent) {
      next(error);
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

const app = createApp({ campaignService: null });

async function initialize() {
  if (!app.locals.campaignService) {
    app.locals.campaignService = createCampaignService();
  }

  await app.locals.campaignService.initialize();
}

async function close() {
  if (app.locals.campaignService) {
    await app.locals.campaignService.close();
    app.locals.campaignService = null;
  }
}

module.exports = {
  app,
  close,
  createApp,
  initialize,
};
