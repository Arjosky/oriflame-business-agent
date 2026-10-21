const { app, initialize, close } = require('./app');

const PORT = Number(process.env.PORT || 3000);

async function start() {
  await initialize();

  const server = app.listen(PORT, () => {
    console.log(`Dashboard is live at http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`);

    server.close(async () => {
      await close();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
