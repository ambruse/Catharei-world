// Local QA server: copies catalogue records only, never customers or orders.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sqlite3 = require('sqlite3');
const root = path.resolve(__dirname, '..');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catharei-mobile-'));
const source = new sqlite3.Database(path.join(root, 'database.sqlite'), sqlite3.OPEN_READONLY);
const dest = new sqlite3.Database(path.join(dataDir, 'database.sqlite'));
const all = (db, sql) => new Promise((resolve, reject) => db.all(sql, (e, rows) => e ? reject(e) : resolve(rows)));
const run = (db, sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, e => e ? reject(e) : resolve()));
(async () => {
  for (const table of ['products', 'showcase_settings']) {
    const schema = await all(source, `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
    if (!schema.length) continue;
    await run(dest, schema[0].sql);
    for (const row of await all(source, `SELECT * FROM ${table}`)) {
      const keys = Object.keys(row);
      await run(dest, `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(row));
    }
  }
  source.close(); dest.close();
  fs.writeFileSync(path.join(dataDir, 'offline.cjs'), "global.fetch = async () => new Response('QA: external notification suppressed', {status: 200});");
  const child = spawn(process.execPath, ['--require', path.join(dataDir, 'offline.cjs'), 'server.js'], {
    cwd: root, env: { ...process.env, DATA_DIR: dataDir, PORT: process.env.MOBILE_PORT || '3117', NODE_ENV: 'test', RENDER: 'false' }, windowsHide: true, stdio: 'inherit'
  });
  process.on('SIGINT', () => child.kill());
  process.on('SIGTERM', () => child.kill());
})();

