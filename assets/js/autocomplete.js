/* SQL autocomplete for the course editors: keywords, functions, tables and columns.
 * SQLAutocomplete.attach(textarea, getDbName) wires up an editor.
 * SQLAutocomplete.setSchema(dbName, tables) refreshes the known tables (e.g. after CREATE TABLE). */
(function () {
  var KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
    'JOIN', 'INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'FULL OUTER JOIN', 'ON', 'USING', 'AS', 'AND', 'OR', 'NOT',
    'IN', 'IS NULL', 'IS NOT NULL', 'NULL', 'LIKE', 'BETWEEN', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'WITH', 'RECURSIVE', 'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT', 'EXISTS', 'ALL', 'OVER', 'PARTITION BY',
    'ROWS BETWEEN', 'RANGE BETWEEN', 'UNBOUNDED PRECEDING', 'UNBOUNDED FOLLOWING', 'CURRENT ROW', 'PRECEDING',
    'FOLLOWING', 'ASC', 'DESC', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
    'CREATE VIEW', 'CREATE INDEX', 'DROP TABLE', 'DROP VIEW', 'ALTER TABLE', 'ADD COLUMN', 'PRIMARY KEY',
    'FOREIGN KEY', 'REFERENCES', 'DEFAULT', 'UNIQUE', 'INTEGER', 'TEXT', 'REAL', 'EXPLAIN QUERY PLAN',
    'BEGIN', 'COMMIT', 'ROLLBACK', 'TRUE', 'FALSE'];
  var FUNCTIONS = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'ABS', 'COALESCE', 'IFNULL', 'NULLIF', 'IIF',
    'LENGTH', 'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'SUBSTR', 'REPLACE', 'INSTR', 'PRINTF', 'CAST',
    'TYPEOF', 'RANDOM', 'DATE', 'TIME', 'DATETIME', 'STRFTIME', 'JULIANDAY', 'GROUP_CONCAT', 'ROW_NUMBER',
    'RANK', 'DENSE_RANK', 'NTILE', 'PERCENT_RANK', 'CUME_DIST', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
    'NTH_VALUE'];
  var KW_SET = {};
  KEYWORDS.concat(FUNCTIONS).forEach(function (k) { k.split(' ').forEach(function (w) { KW_SET[w] = 1; }); });
  ['LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'NATURAL', 'GROUP', 'ORDER', 'BY', 'WINDOW'].forEach(function (w) { KW_SET[w] = 1; });
  var TABLE_CONTEXT = /\b(from|join|into|update|table|exists)\s+$/i;
  var MAX = 8;

  var schemas = {}, loading = {};
  var box = null, state = null, lastTa = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setSchema(db, tables) { schemas[db] = tables; }

  function loadSchema(db) {
    if (schemas[db] || loading[db] || !window.SQLRunner) return;
    loading[db] = SQLRunner.schema(db).then(function (t) {
      schemas[db] = t;
      var ta = lastTa;
      if (ta && document.activeElement === ta && ta._acDb() === db) update(ta, state && state.manual);
    }).catch(function () { /* keywords still work */ }).then(function () { delete loading[db]; });
  }

  /* --------------------------------------------------------------- analysis */
  function inStringOrComment(before) {
    var stripped = before.replace(/'(?:[^']|'')*'/g, '');
    if (stripped.indexOf("'") >= 0) return true;
    var line = stripped.slice(stripped.lastIndexOf('\n') + 1);
    return line.indexOf('--') >= 0;
  }

  function analyse(sql, tables) {
    var byName = {}, aliases = {}, used = {};
    tables.forEach(function (t) { byName[t.name.toLowerCase()] = t; });
    var clean = sql.replace(/--[^\n]*/g, ' ').replace(/'(?:[^']|'')*'/g, "''");
    var re = /\b([A-Za-z_]\w*)(?:\s+(?:as\s+)?([A-Za-z_]\w*))?/gi, m;
    while ((m = re.exec(clean))) {
      var t = byName[m[1].toLowerCase()];
      if (!t) { if (m[2]) re.lastIndex -= m[2].length; continue; }
      used[t.name.toLowerCase()] = t;
      if (m[2] && !KW_SET[m[2].toUpperCase()] && !byName[m[2].toLowerCase()]) aliases[m[2].toLowerCase()] = t;
      else if (m[2]) re.lastIndex -= m[2].length;
    }
    var ctes = [];
    var cre = /(?:\bwith(?:\s+recursive)?|,)\s*([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s+as\s*\(/gi;
    while ((m = cre.exec(clean))) if (!byName[m[1].toLowerCase()]) ctes.push(m[1]);
    return { byName: byName, aliases: aliases, used: used, ctes: ctes };
  }

  function suggestions(ta, manual) {
    var pos = ta.selectionStart;
    if (pos !== ta.selectionEnd) return null;
    var before = ta.value.slice(0, pos);
    if (inStringOrComment(before)) return null;
    var m = /(?:([A-Za-z_]\w*)\.)?([A-Za-z_]\w*)?$/.exec(before);
    var qual = m[1], prefix = m[2] || '';
    if (!qual && !prefix && !manual) return null;
    var lower = prefix.toLowerCase();
    var tables = schemas[state.db] || [];
    var ctx = analyse(ta.value, tables);
    var items = [];
    var starts = function (s) { return s.toLowerCase().indexOf(lower) === 0; };

    if (qual) {
      var t = ctx.aliases[qual.toLowerCase()] || ctx.byName[qual.toLowerCase()];
      if (!t) return null;
      t.columns.forEach(function (c) {
        if (starts(c.name)) items.push({ text: c.name, label: c.name, kind: 'column', detail: (c.type || '').toLowerCase(), rank: 0 });
      });
    } else {
      var tableCtx = TABLE_CONTEXT.test(before.slice(0, before.length - prefix.length));
      tables.forEach(function (t) {
        if (starts(t.name)) items.push({ text: t.name, label: t.name, kind: t.type === 'view' ? 'view' : 'table', detail: t.rows + ' rows', rank: tableCtx ? 0 : 2 });
      });
      ctx.ctes.forEach(function (n) {
        if (starts(n)) items.push({ text: n, label: n, kind: 'cte', detail: 'WITH', rank: tableCtx ? 0 : 2 });
      });
      if (!tableCtx) {
        var cols = {};
        tables.forEach(function (t) {
          var isUsed = !!ctx.used[t.name.toLowerCase()];
          t.columns.forEach(function (c) {
            if (!starts(c.name)) return;
            var k = c.name.toLowerCase();
            if (!cols[k]) cols[k] = { text: c.name, label: c.name, kind: 'column', tabs: [], rank: 3 };
            if (isUsed) { cols[k].rank = 0; cols[k].tabs.unshift(t.name); } else cols[k].tabs.push(t.name);
          });
        });
        Object.keys(cols).forEach(function (k) {
          var c = cols[k];
          c.detail = c.tabs.slice(0, 2).join(', ') + (c.tabs.length > 2 ? ' +' + (c.tabs.length - 2) : '');
          items.push(c);
        });
      }
      var lowerCase = prefix && prefix === prefix.toLowerCase();
      var fix = function (s) { return lowerCase ? s.toLowerCase() : s; };
      KEYWORDS.forEach(function (k) {
        if (starts(k)) items.push({ text: fix(k), label: fix(k), kind: 'keyword', detail: '', rank: tableCtx ? 2 : 1 });
      });
      if (!tableCtx) FUNCTIONS.forEach(function (f) {
        if (starts(f)) items.push({ text: fix(f) + '()', label: fix(f) + '( )', kind: 'function', detail: '', rank: 1, back: 1 });
      });
    }
    items.sort(function (a, b) {
      return a.rank - b.rank || a.label.length - b.label.length || (a.label < b.label ? -1 : 1);
    });
    // a finished word (e.g. "in", "id", "films") closes the list, so Enter still makes a new line
    var done = items.some(function (it) { return it.text.replace(/\(\)$/, '').toLowerCase() === lower; });
    if (done && !manual) return null;
    return items.length ? { items: items.slice(0, MAX), from: pos - prefix.length, to: pos } : null;
  }

  /* --------------------------------------------------------------- popup */
  function ensureBox() {
    if (box) return box;
    box = document.createElement('ul');
    box.className = 'ac-box';
    box.setAttribute('role', 'listbox');
    box.hidden = true;
    box.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li');
      if (!li || !state) return;
      e.preventDefault();
      accept(+li.dataset.i);
    });
    document.body.appendChild(box);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', function () { if (state) position(); }, true);
    return box;
  }

  function caretRect(ta, pos) {
    var edit = ta.parentNode;
    var mirror = edit.querySelector('.ac-mirror');
    if (!mirror) {
      mirror = document.createElement('pre');
      mirror.className = 'code-hl ac-mirror';
      mirror.setAttribute('aria-hidden', 'true');
      edit.appendChild(mirror);
    }
    mirror.innerHTML = esc(ta.value.slice(0, pos)) + '<span>​</span>';
    var r = mirror.lastChild.getBoundingClientRect();
    return r;
  }

  function position() {
    var r = caretRect(state.ta, state.from);
    var b = box.getBoundingClientRect();
    var top = r.bottom + 4;
    if (top + b.height > window.innerHeight - 8 && r.top - b.height - 4 > 8) top = r.top - b.height - 4;
    var left = Math.max(8, Math.min(r.left - 8, window.innerWidth - b.width - 8));
    box.style.top = top + 'px';
    box.style.left = left + 'px';
  }

  function render() {
    box.innerHTML = state.items.map(function (it, i) {
      return '<li role="option" data-i="' + i + '"' + (i === state.sel ? ' class="sel" aria-selected="true"' : '') + '>' +
        '<span class="ac-kind ac-' + it.kind + '">' + it.kind.charAt(0).toUpperCase() + '</span>' +
        '<span class="ac-label">' + esc(it.label) + '</span>' +
        '<span class="ac-detail">' + esc(it.detail || it.kind) + '</span></li>';
    }).join('');
    box.hidden = false;
    position();
    var sel = box.children[state.sel];
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function update(ta, manual) {
    var db = ta._acDb();
    lastTa = ta;
    state = state && state.ta === ta ? state : { ta: ta };
    state.db = db;
    state.manual = !!manual;
    loadSchema(db);
    var s = suggestions(ta, manual);
    if (!s) return close();
    state.items = s.items;
    state.from = s.from;
    state.to = s.to;
    state.sel = 0;
    ensureBox();
    render();
  }

  function close() {
    state = null;
    if (box) box.hidden = true;
  }

  function accept(i) {
    var it = state.items[i], ta = state.ta, from = state.from, to = state.to;
    close();
    ta.focus();
    ta.setSelectionRange(from, to);
    ta._acSilent = true;
    var ok = false;
    try { ok = document.execCommand('insertText', false, it.text); } catch (e) { /* fallback below */ }
    if (!ok) {
      ta.setRangeText(it.text, from, to, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    ta._acSilent = false;
    if (it.back) {
      var p = ta.selectionStart - it.back;
      ta.setSelectionRange(p, p);
    }
  }

  /* --------------------------------------------------------------- wiring */
  function attach(ta, getDb) {
    ta._acDb = typeof getDb === 'function' ? getDb : function () { return getDb || 'lesson'; };
    ta.setAttribute('aria-autocomplete', 'list');
    ta.addEventListener('input', function (e) {
      if (ta._acSilent) return;
      var typed = e.inputType === 'insertText' && /[\w.]$/.test(e.data || '');
      if (typed || (state && state.ta === ta && /^delete/.test(e.inputType || ''))) update(ta, state && state.manual);
      else close();
    });
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault(); e.stopImmediatePropagation();
        update(ta, true);
        return;
      }
      if (!state || state.ta !== ta || box.hidden) return;
      var n = state.items.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        state.sel = (state.sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        render();
      } else if ((e.key === 'Tab' && !e.shiftKey) || (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey)) {
        accept(state.sel);
      } else if (e.key === 'Escape') {
        close();
      } else {
        if (e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') close();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
    ta.addEventListener('blur', function () { if (state && state.ta === ta) close(); });
    ta.addEventListener('mousedown', function () { if (state && state.ta === ta) close(); });
  }

  window.SQLAutocomplete = { attach: attach, setSchema: setSchema };
})();
