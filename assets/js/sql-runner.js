/* Runs SQL in the browser with sql.js (SQLite compiled to WebAssembly).
 * Two separate databases are kept:
 *  - "lesson": every run is rolled back, so examples never change the data.
 *  - "playground": changes persist until the user resets it.
 */
(function () {
  var SQLJS_VERSION = '1.10.3';
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/' + SQLJS_VERSION + '/';
  var enginePromise = null;
  var seedPromise = null;
  var dbs = {};

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Could not load the SQL engine. Check your internet connection and try again.')); };
      document.head.appendChild(s);
    });
  }

  function engine() {
    if (!enginePromise) {
      enginePromise = loadScript(CDN + 'sql-wasm.js').then(function () {
        return window.initSqlJs({ locateFile: function (f) { return CDN + f; } });
      });
      enginePromise.catch(function () { enginePromise = null; });
    }
    return enginePromise;
  }

  function seed() {
    if (!seedPromise) {
      seedPromise = fetch('data/practice.sql').then(function (r) {
        if (!r.ok) throw new Error('Could not load the practice data (' + r.status + ').');
        return r.text();
      });
      seedPromise.catch(function () { seedPromise = null; });
    }
    return seedPromise;
  }

  function getDb(name) {
    if (dbs[name]) return Promise.resolve(dbs[name]);
    return Promise.all([engine(), seed()]).then(function (res) {
      if (!dbs[name]) {
        var db = new res[0].Database();
        db.exec(res[1]);
        dbs[name] = db;
      }
      return dbs[name];
    });
  }

  function hasStatements(sql) {
    return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().length > 0;
  }

  /** Run SQL. Returns {sets: [{columns, values}], ms, changes} or throws. */
  function run(sql, opts) {
    opts = opts || {};
    var name = opts.db || 'lesson';
    return getDb(name).then(function (db) {
      if (!hasStatements(sql)) throw new Error('Write a query first, then press Run.');
      var t0 = performance.now();
      var isolated = name === 'lesson';
      var sets, changes;
      var total = function () { return db.exec('SELECT total_changes()')[0].values[0][0]; };
      var before = total();
      if (isolated) db.exec('SAVEPOINT lesson_run');
      try {
        sets = db.exec(sql);
        changes = total() - before;
      } finally {
        if (isolated) {
          try { db.exec('ROLLBACK TO lesson_run; RELEASE lesson_run'); } catch (e) { /* already closed by user SQL */ }
        }
      }
      return { sets: sets, ms: performance.now() - t0, changes: changes, sql: sql };
    });
  }

  function reset(name) {
    if (dbs[name]) { dbs[name].close(); delete dbs[name]; }
    return getDb(name);
  }

  /** List tables/views with their columns. */
  function schema(name) {
    return getDb(name || 'playground').then(function (db) {
      var res = db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name");
      if (!res.length) return [];
      return res[0].values.map(function (r) {
        var info = db.exec('PRAGMA table_info(' + JSON.stringify(r[0]) + ')');
        var count = db.exec('SELECT COUNT(*) FROM ' + JSON.stringify(r[0]));
        return {
          name: r[0], type: r[1],
          rows: count.length ? count[0].values[0][0] : 0,
          columns: info.length ? info[0].values.map(function (c) { return { name: c[1], type: c[2] }; }) : []
        };
      });
    });
  }

  window.SQLRunner = { run: run, reset: reset, schema: schema, warmUp: function () { engine(); seed(); } };
})();
