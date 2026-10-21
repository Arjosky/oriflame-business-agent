const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const DEFAULT_DATABASE_PATH = path.resolve(
  process.env.DB_PATH || path.join(process.cwd(), 'oriflame_business.db')
);

function createCampaignService(databasePath = DEFAULT_DATABASE_PATH) {
  const db = new sqlite3.Database(databasePath);

  function run(sql, parameters = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, parameters, function onRun(error) {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          changes: this.changes,
          lastID: this.lastID,
        });
      });
    });
  }

  function get(sql, parameters = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, parameters, (error, row) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(row);
      });
    });
  }

  function all(sql, parameters = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, parameters, (error, rows) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(rows);
      });
    });
  }

  async function initialize() {
    await run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        status TEXT
      )
    `);
  }

  async function getDashboardSummary() {
    const summary = await get(`
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE
            WHEN LOWER(TRIM(COALESCE(status, ''))) IN
              ('sent', 'success', 'successful', 'completed')
            THEN 1
            ELSE 0
          END
        ) AS successful,
        SUM(
          CASE
            WHEN LOWER(TRIM(COALESCE(status, ''))) IN
              ('failed', 'failure', 'error')
            THEN 1
            ELSE 0
          END
        ) AS failed,
        SUM(
          CASE
            WHEN LOWER(TRIM(COALESCE(status, ''))) IN
              ('pending', 'queued', 'new')
            THEN 1
            ELSE 0
          END
        ) AS pending
      FROM members
    `);

    const statusBreakdown = await all(`
      SELECT
        COALESCE(NULLIF(TRIM(status), ''), 'Unknown') AS status,
        COUNT(*) AS count
      FROM members
      GROUP BY COALESCE(NULLIF(TRIM(status), ''), 'Unknown')
      ORDER BY count DESC, status ASC
    `);

    return {
      total: Number(summary?.total || 0),
      successful: Number(summary?.successful || 0),
      failed: Number(summary?.failed || 0),
      pending: Number(summary?.pending || 0),
      statusBreakdown: statusBreakdown.map((item) => ({
        status: item.status,
        count: Number(item.count),
      })),
    };
  }

  function close() {
    return new Promise((resolve, reject) => {
      db.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  return {
    databasePath,
    initialize,
    getDashboardSummary,
    close,
  };
}

module.exports = { createCampaignService };
