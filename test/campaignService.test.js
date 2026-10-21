const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();
const { createCampaignService } = require('../campaignService');

function seedMembers(databasePath, members) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath);

    db.serialize(() => {
      const statement = db.prepare(
        'INSERT INTO members (name, phone, status) VALUES (?, ?, ?)'
      );

      for (const member of members) {
        statement.run(member.name, member.phone, member.status);
      }

      statement.finalize((finalizeError) => {
        if (finalizeError) {
          reject(finalizeError);
          return;
        }

        db.close((closeError) => {
          if (closeError) reject(closeError);
          else resolve();
        });
      });
    });
  });
}

test('initializes an empty database and returns zeroed metrics', async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'oriflame-service-test-')
  );
  const databasePath = path.join(directory, 'test.db');
  const service = createCampaignService(databasePath);
  t.after(async () => {
    await service.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  await service.initialize();

  assert.deepEqual(await service.getDashboardSummary(), {
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    statusBreakdown: [],
  });
});

test('normalizes statuses and returns a breakdown', async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'oriflame-service-test-')
  );
  const databasePath = path.join(directory, 'test.db');
  const service = createCampaignService(databasePath);
  t.after(async () => {
    await service.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  await service.initialize();
  await seedMembers(databasePath, [
    { name: 'A', phone: '1', status: 'Sent' },
    { name: 'B', phone: '2', status: 'FAILED' },
    { name: 'C', phone: '3', status: ' Pending ' },
    { name: 'D', phone: '4', status: 'Paused' },
    { name: 'E', phone: '5', status: null },
  ]);

  const summary = await service.getDashboardSummary();
  assert.equal(summary.total, 5);
  assert.equal(summary.successful, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.pending, 1);
  assert.deepEqual(
    Object.fromEntries(
      summary.statusBreakdown.map(({ status, count }) => [status, count])
    ),
    { Sent: 1, FAILED: 1, Pending: 1, Paused: 1, Unknown: 1 }
  );
});
