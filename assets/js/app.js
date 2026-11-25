/* SQL Tutorials — single-page app: course outline, lessons, progress, search, playground. */
(function () {
  'use strict';

  var MODULE_FILES = [
    'content/01-fundamentals.html',
    'content/02-joins.html',
    'content/03-case-subqueries.html',
    'content/04-ctes.html',
    'content/05-window-functions.html',
    'content/06-optimization.html'
  ];

  var DATASETS = [
    { name: 'Films', note: 'Used in SQL Fundamentals', tables: ['films', 'people', 'reviews'] },
    { name: 'World', note: 'Used in Joins & Set Operations', tables: ['countries', 'cities', 'languages', 'economies', 'economies2015', 'economies2019', 'currencies', 'populations'] },
    { name: 'European soccer', note: 'Used in CASE & Subqueries and CTEs', tables: ['country', 'league', 'team', 'match', 'matches_germany', 'matches_italy', 'matches_spain', 'teams_spain', 'matches_2013_2014'] },
    { name: 'Season results', note: 'Used in Window Functions', tables: ['matches', 'teams', 'seasons'] },
    { name: 'Retail store', note: 'Used in Optimization & Interview Prep', tables: ['stores', 'products', 'sales', 'customers', 'inventory', 'products_history'] },
    { name: 'Other', note: 'Small extra tables used in a few examples', tables: ['employees', 'departments', 'product'] }
  ];

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  var course = [];          // modules
  var flat = [];            // all topics in order
  var progress = loadJSON('sqlt.progress', {});
  var view = $('#view');
  var shownTopic = null;    // topic currently on screen

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function saveProgress() { localStorage.setItem('sqlt.progress', JSON.stringify(progress)); }
  function key(t) { return t.module.slug + '/' + t.id; }
  function isDone(t) { return !!progress[key(t)]; }

  /* ------------------------------------------------------------------ loading */
  function load() {
    return Promise.all(MODULE_FILES.map(function (f) {
      return fetch(f).then(function (r) {
        if (!r.ok) throw new Error(f + ': ' + r.status);
        return r.text();
      });
    })).then(function (texts) {
      texts.forEach(function (html, i) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var art = doc.querySelector('article.module');
        var m = {
          num: i + 1,
          slug: art.dataset.module,
          title: art.dataset.title,
          level: art.dataset.level,
          blurb: art.dataset.blurb,
          topics: []
        };
        $$('section.topic', art).forEach(function (sec, j) {
          var t = {
            module: m,
            index: j,
            id: sec.id,
            title: sec.dataset.title,
            html: sec.innerHTML,
            text: sec.textContent.replace(/\s+/g, ' ').trim(),
            runnable: sec.querySelectorAll('pre.sql[data-run], pre.sql.editor').length,
            exercises: sec.querySelectorAll('details.solution, .tryit').length
          };
          m.topics.push(t);
          flat.push(t);
        });
        course.push(m);
      });
      flat.forEach(function (t, i) { t.flatIndex = i; });
    });
  }

  /* ------------------------------------------------------------------ sidebar */
  function moduleDone(m) { return m.topics.filter(isDone).length; }

  function renderOutline(active) {
    var html = '';
    course.forEach(function (m) {
      var done = moduleDone(m);
      var open = active ? active.module === m : false;
      var complete = done === m.topics.length;
      html += '<div class="mod' + (open ? ' open' : '') + (complete ? ' complete' : '') + '" data-mod="' + m.slug + '">' +
        '<button class="mod-head" type="button" aria-expanded="' + open + '">' +
        '<span class="mod-num">' + (complete ? '<svg viewBox="0 0 24 24" width="14" height="14"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : m.num) + '</span>' +
        '<span class="mod-title">' + esc(m.title) + '</span>' +
        '<span class="mod-count">' + done + '/' + m.topics.length + '</span>' +
        '<svg class="chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button><ol class="topics">';
      m.topics.forEach(function (t) {
        var cur = active === t;
        html += '<li><a href="#/' + m.slug + '/' + t.id + '" class="topic-link' + (cur ? ' current' : '') + (isDone(t) ? ' done' : '') + '"' +
          (cur ? ' aria-current="page"' : '') + '>' +
          '<span class="dot" aria-hidden="true"></span><span class="t">' + esc(t.title) + '</span></a></li>';
      });
      html += '</ol></div>';
    });
    $('#outline').innerHTML = html;
    var total = flat.length, done = flat.filter(isDone).length;
    var pct = Math.round(done / total * 100);
    $('#overall').innerHTML =
      '<div class="overall-row"><span>Your progress</span><strong>' + pct + '%</strong></div>' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="overall-sub">' + done + ' of ' + total + ' topics complete</div>';
    var cur = $('.topic-link.current');
    if (cur) {
      var box = $('#outline');
      var r = cur.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (r.top < b.top || r.bottom > b.bottom) cur.scrollIntoView({ block: 'center' });
    }
    $('#playground-link').classList.toggle('current', location.hash.indexOf('#/playground') === 0);
  }

  $('#outline').addEventListener('click', function (e) {
    var head = e.target.closest('.mod-head');
    if (!head) return;
    var mod = head.parentNode;
    var open = !mod.classList.contains('open');
    mod.classList.toggle('open', open);
    head.setAttribute('aria-expanded', open);
  });

  /* ------------------------------------------------------------------ routing */
  function route() {
    closeDrawer();
    hideSearch();
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) { shownTopic = null; return renderHome(); }
    if (parts[0] === 'playground') { shownTopic = null; return renderPlayground(); }
    var m = course.filter(function (x) { return x.slug === parts[0]; })[0];
    if (!m) { shownTopic = null; return renderHome(); }
    var t = m.topics.filter(function (x) { return x.id === parts[1]; })[0] || m.topics[0];
    if (t === shownTopic) return;
    var dir = shownTopic ? (t.flatIndex > shownTopic.flatIndex ? 'fwd' : 'back') : null;
    swapView(dir, function () { renderTopic(t); });
  }

  /* Page transition: the old page slides out, the new one slides in from the
     direction of travel. The jump to the top happens while the view is hidden. */
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var swapToken = 0;
  function swapView(dir, render) {
    var token = ++swapToken;
    view.classList.remove('leave-fwd', 'leave-back', 'enter-fwd', 'enter-back');
    if (!dir || reduceMotion.matches) return render();
    void view.offsetWidth; // restart animation if one is mid-flight
    view.classList.add('leave-' + dir);
    setTimeout(function () {
      if (token !== swapToken) return;
      view.classList.remove('leave-' + dir);
      render();
      view.classList.add('enter-' + dir);
      setTimeout(function () { if (token === swapToken) view.classList.remove('enter-' + dir); }, 400);
    }, 170);
  }

  function setCrumbs(items) {
    $('#crumbs').innerHTML = items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? '<span class="sep" aria-hidden="true">/</span>' : '') +
        (it.href && !last ? '<a href="' + it.href + '">' + esc(it.label) + '</a>' : '<span' + (last ? ' aria-current="page"' : '') + '>' + esc(it.label) + '</span>');
    }).join('');
  }

  function afterRender(focusTop, keepScroll) {
    if (!keepScroll) window.scrollTo(0, 0);
    if (focusTop) view.focus({ preventScroll: true });
    updateReadProgress();
  }

  /* ------------------------------------------------------------------ home */
  function nextTopic() {
    var last = localStorage.getItem('sqlt.last');
    var t = flat.filter(function (x) { return key(x) === last; })[0];
    if (t && !isDone(t)) return t;
    var start = t ? t.flatIndex : 0;
    for (var i = 0; i < flat.length; i++) {
      var c = flat[(start + i) % flat.length];
      if (!isDone(c)) return c;
    }
    return flat[0];
  }

  function renderHome() {
    document.title = 'SQL Tutorials — learn SQL step by step';
    setCrumbs([{ label: 'Home' }]);
    $('#topbar-right').innerHTML = '';
    renderOutline(null);
    var started = flat.some(isDone);
    var nt = nextTopic();
    var html = '<div class="home">' +
      '<section class="hero">' +
      '<p class="eyebrow">Free, hands-on SQL course</p>' +
      '<h1>Learn SQL one small step at a time</h1>' +
      '<p class="hero-lead">Six short modules take you from your first <code>SELECT</code> to window functions and query tuning. Every example runs right here in your browser, so you can change it and see what happens.</p>' +
      '<div class="hero-actions">' +
      '<a class="btn primary" href="#/' + nt.module.slug + '/' + nt.id + '">' + (started ? 'Continue: ' + esc(nt.title) : 'Start the course') + ' <span aria-hidden="true">→</span></a>' +
      '<a class="btn" href="#/playground">Open the playground</a>' +
      '</div></section>' +
      '<section class="how" aria-label="How it works">' +
      howStep('1', 'Read', 'Each topic explains one idea in plain words, with a worked example.') +
      howStep('2', 'Run', 'Press <span class="kbd-inline">Run</span> on any example, or edit it first. Results appear underneath.') +
      howStep('3', 'Practise', 'Try the exercises, reveal the solution when you are ready, then mark the topic complete.') +
      '</section>' +
      '<h2 class="section-h">Course modules</h2><div class="cards">';
    course.forEach(function (m) {
      var done = moduleDone(m), pct = Math.round(done / m.topics.length * 100);
      var runs = m.topics.reduce(function (a, t) { return a + t.runnable; }, 0);
      var first = m.topics.filter(function (t) { return !isDone(t); })[0] || m.topics[0];
      html += '<a class="card-mod" href="#/' + m.slug + '/' + first.id + '">' +
        '<div class="card-top"><span class="mod-badge">Module ' + m.num + '</span><span class="level level-' + m.level.toLowerCase() + '">' + m.level + '</span></div>' +
        '<h3>' + esc(m.title) + '</h3><p>' + esc(m.blurb) + '</p>' +
        '<div class="card-meta"><span>' + m.topics.length + ' topics</span><span>' + runs + ' runnable examples</span></div>' +
        '<div class="bar small"><span style="width:' + pct + '%"></span></div>' +
        '<div class="card-foot">' + (done ? done + ' of ' + m.topics.length + ' done' : 'Not started') + '<span aria-hidden="true">→</span></div>' +
        '</a>';
    });
    html += '</div>' +
      '<section class="tips"><h2 class="section-h">Handy shortcuts</h2><ul>' +
      '<li><kbd>/</kbd> search topics</li><li><kbd>←</kbd> <kbd>→</kbd> previous / next topic</li>' +
      '<li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> (or <kbd>⌘</kbd> + <kbd>Enter</kbd>) run the query you are editing</li></ul></section>' +
      '</div>';
    view.innerHTML = html;
    afterRender(false);
  }

  function howStep(n, title, text) {
    return '<div class="how-step"><span class="how-num">' + n + '</span><div><h3>' + title + '</h3><p>' + text + '</p></div></div>';
  }

  /* ------------------------------------------------------------------ topic */
  function renderTopic(t, keepScroll) {
    var m = t.module;
    shownTopic = t;
    localStorage.setItem('sqlt.last', key(t));
    document.title = t.title + ' · ' + m.title + ' · SQL Tutorials';
    setCrumbs([{ label: 'Home', href: '#/' }, { label: m.title, href: '#/' + m.slug }, { label: t.title }]);
    $('#topbar-right').innerHTML = '<span class="step-count">' + (t.index + 1) + ' / ' + m.topics.length + '</span>';
    renderOutline(t);

    var prev = flat[t.flatIndex - 1], next = flat[t.flatIndex + 1];
    var done = isDone(t);
    var banner = localStorage.getItem('sqlt.hideRunNote') ? '' :
      '<div class="run-note" id="run-note"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 8v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<p>Examples with a <strong>Run</strong> button work on a small practice database in your browser. You can edit them freely. Your numbers will differ from the sample outputs, which came from much bigger datasets.</p>' +
      '<button type="button" class="text-btn" id="run-note-close">Got it</button></div>';

    view.innerHTML =
      '<article class="lesson">' +
      '<header class="lesson-head">' +
      '<p class="eyebrow"><a href="#/' + m.slug + '">Module ' + m.num + ' · ' + esc(m.title) + '</a></p>' +
      '<h1>' + esc(t.title) + '</h1>' +
      '<div class="lesson-meta">' +
      '<span>Topic ' + (t.index + 1) + ' of ' + m.topics.length + '</span>' +
      (t.runnable ? '<span>' + t.runnable + ' runnable ' + (t.runnable === 1 ? 'example' : 'examples') + '</span>' : '') +
      (t.exercises ? '<span>' + t.exercises + ' practice ' + (t.exercises === 1 ? 'item' : 'items') + '</span>' : '') +
      (done ? '<span class="done-pill">Completed</span>' : '') +
      '</div></header>' + banner +
      '<div class="prose">' + t.html + '</div>' +
      '<footer class="lesson-foot">' +
      '<button type="button" class="btn ' + (done ? '' : 'primary') + ' complete-btn" id="complete-btn" aria-pressed="' + done + '">' +
      (done ? '✓ Completed — mark as not done' : 'Mark as complete' + (next ? ' & continue' : '')) + '</button>' +
      '<nav class="pager" aria-label="Topic navigation">' +
      (prev ? pagerLink(prev, 'Previous', 'prev') : '<span></span>') +
      (next ? pagerLink(next, 'Next', 'next') : '<a class="pager-link next" href="#/"><span class="pager-label">Finished</span><span class="pager-title">Back to the course home</span></a>') +
      '</nav></footer></article>';

    enhance(view);
    var close = $('#run-note-close');
    if (close) close.addEventListener('click', function () {
      localStorage.setItem('sqlt.hideRunNote', '1');
      $('#run-note').remove();
    });
    $('#complete-btn').addEventListener('click', function () {
      var btn = this;
      if (btn.classList.contains('is-completing')) return;
      if (isDone(t)) {
        delete progress[key(t)];
        saveProgress();
        renderTopic(t, true);
        return;
      }
      progress[key(t)] = Date.now();
      saveProgress();
      // 1. Confirm on the button itself, and tick the topic in the sidebar.
      btn.classList.add('is-completing');
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = '<svg class="check" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span>' + (next ? 'Completed · up next: ' + esc(next.title) : 'Completed') + '</span>';
      renderOutline(t);
      var link = $('.topic-link.current');
      if (link) link.classList.add('just-done');
      if (!next) {
        setTimeout(function () { if (shownTopic === t) renderTopic(t, true); }, 900);
        return;
      }
      // 2. Let the confirmation register, then slide to the next topic.
      setTimeout(function () {
        if (shownTopic === t) location.hash = '#/' + next.module.slug + '/' + next.id;
      }, reduceMotion.matches ? 0 : 550);
    });
    afterRender(!keepScroll, keepScroll);
  }

  function pagerLink(t, label, cls) {
    var sameMod = true;
    return '<a class="pager-link ' + cls + '" href="#/' + t.module.slug + '/' + t.id + '">' +
      '<span class="pager-label">' + (cls === 'prev' ? '← ' : '') + label + (cls === 'next' ? ' →' : '') + '</span>' +
      '<span class="pager-title">' + esc(t.title) + '</span>' +
      (sameMod ? '<span class="pager-mod">' + esc(t.module.title) + '</span>' : '') + '</a>';
  }

  /* ------------------------------------------------------------------ enhancing content */
  var ICONS = {
    def: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z M8 7h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    tip: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    warn: '<path d="M12 3 2 20h20zM12 10v4M12 17v.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    note: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 8v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    interview: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    scenario: '<path d="M3 9h18l-2 11H5zM8 9V6a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    steps: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    result: '<path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    data: '<ellipse cx="12" cy="6" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" fill="none" stroke="currentColor" stroke-width="2"/>',
    metric: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };
  var DEFAULT_TITLES = { def: 'Definition', tip: 'Tip', warn: 'Watch out', note: 'Good to know', interview: 'Interview tip', scenario: 'Scenario', steps: 'Steps', result: 'Result', data: 'About the data', metric: 'Performance' };

  function enhance(root) {
    $$('.callout', root).forEach(function (c) {
      var kind = (c.className.match(/callout (\w+)/) || [])[1] || 'note';
      var title = $('.callout-title', c);
      if (!title) {
        title = document.createElement('p');
        title.className = 'callout-title';
        title.textContent = DEFAULT_TITLES[kind] || '';
        c.insertBefore(title, c.firstChild);
      }
      if (title.parentNode !== c) c.insertBefore(title, c.firstChild);
      title.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' + (ICONS[kind] || ICONS.note) + '</svg>');
    });
    $$('.exercise > h3', root).forEach(function (h) {
      if (/^(question|challenge|comparison challenge|final challenge)/i.test(h.textContent)) {
        h.insertAdjacentHTML('beforebegin', '<span class="ex-tag">Exercise</span>');
      }
    });
    $$('details.solution', root).forEach(function (d) {
      var s = $('summary', d);
      var label = s.textContent.trim();
      if (/click to (reveal|see)/i.test(label)) label = /solution/i.test(label) ? 'Show solution' : 'Show answer';
      s.innerHTML = '<span class="sum-closed">' + esc(label) + '</span><span class="sum-open">Hide ' + esc(label.replace(/^show\s+/i, '').toLowerCase()) + '</span>';
    });
    $$('p > strong', root).forEach(function (s) {
      var p = s.parentNode;
      if (/^sample output:?$/i.test(s.textContent.trim()) && p.textContent.trim() === s.textContent.trim()) {
        p.classList.add('sample-label');
        s.textContent = 'Sample output (from the full dataset)';
      }
    });
    $$('pre.sql', root).forEach(buildCode);
  }

  function buildCode(pre) {
    var code = pre.textContent;
    var isEditor = pre.classList.contains('editor');
    var runnable = isEditor || pre.hasAttribute('data-run');
    var wrap = document.createElement('div');
    wrap.className = 'code' + (isEditor ? ' is-editor' : '') + (runnable ? ' is-runnable' : ' is-static');
    var lines = Math.max(code.split('\n').length, isEditor ? 5 : 1);
    var bar = '<div class="code-bar"><span class="code-lang">' + (isEditor ? 'Your query' : 'SQL') + '</span>' +
      (runnable ? '' : '<span class="code-note" title="This example is for reading only: it uses syntax for another database, shows a deliberate mistake, or is a template.">Read-only</span>') +
      '<span class="code-actions">' +
      '<button type="button" class="cb copy" aria-label="Copy SQL">Copy</button>' +
      (runnable ? '<button type="button" class="cb reset" hidden>Reset</button>' +
        '<button type="button" class="cb run"><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M7 4v16l13-8z" fill="currentColor"/></svg>Run</button>' : '') +
      '</span></div>';
    if (runnable) {
      wrap.innerHTML = bar +
        '<div class="code-edit"><pre class="code-hl" aria-hidden="true"><code></code></pre>' +
        '<textarea spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="SQL editor" rows="' + lines + '"' +
        (isEditor && !code.trim() ? ' placeholder="-- Write your query here, then press Run (Ctrl + Enter)"' : '') + '></textarea></div>' +
        '<div class="code-result" hidden></div>';
      var ta = $('textarea', wrap);
      ta.value = code;
      wrap._orig = code;
      syncCode(wrap);
      ta.addEventListener('input', function () { syncCode(wrap); });
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runCode(wrap); }
        else if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          var s = ta.selectionStart, en = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 4;
          syncCode(wrap);
        } else if (e.key === 'Escape') ta.blur();
      });
      ta.addEventListener('focus', function () { SQLRunner.warmUp(); }, { once: true });
      if (window.SQLAutocomplete) SQLAutocomplete.attach(ta, function () { return wrap._db || 'lesson'; });
      $('.run', wrap).addEventListener('click', function () { runCode(wrap); });
      $('.run', wrap).addEventListener('mouseenter', function () { SQLRunner.warmUp(); }, { once: true });
      $('.reset', wrap).addEventListener('click', function () {
        ta.value = wrap._orig;
        syncCode(wrap);
        var res = $('.code-result', wrap);
        res.hidden = true;
        res.innerHTML = '';
      });
    } else {
      wrap.innerHTML = bar + '<pre class="code-hl static"><code>' + SQLHighlight.highlight(code) + '</code></pre>';
    }
    $('.copy', wrap).addEventListener('click', function () {
      var text = runnable ? $('textarea', wrap).value : code;
      copyText(text).then(function () { flash($('.copy', wrap), 'Copied'); });
    });
    pre.replaceWith(wrap);
  }

  function syncCode(wrap) {
    var ta = $('textarea', wrap);
    var v = ta.value;
    $('.code-hl code', wrap).innerHTML = SQLHighlight.highlight(v) + '\n';
    ta.rows = Math.max(v.split('\n').length, wrap.classList.contains('is-editor') ? 5 : 1);
    var reset = $('.reset', wrap);
    if (reset) reset.hidden = v === wrap._orig;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
    return Promise.resolve();
  }

  function flash(btn, text) {
    var old = btn.textContent;
    btn.textContent = text;
    btn.classList.add('flash');
    setTimeout(function () { btn.textContent = old; btn.classList.remove('flash'); }, 1200);
  }

  function runCode(wrap, dbName) {
    var ta = $('textarea', wrap);
    var out = $('.code-result', wrap);
    var btn = $('.run', wrap);
    out.hidden = false;
    out.innerHTML = '<div class="res-status">Running…</div>';
    btn.disabled = true;
    SQLRunner.run(ta.value, { db: dbName || 'lesson' }).then(function (r) {
      out.innerHTML = renderResult(r, dbName === 'playground');
    }).catch(function (err) {
      out.innerHTML = '<div class="res-error"><strong>Error</strong><span>' + esc(cleanError(err)) + '</span>' +
        '<p class="res-hint">The practice database runs SQLite, so a few commands from other databases (for example <code>TOP</code>, <code>INTERVAL</code> or <code>EXTRACT</code>) are not available.</p></div>';
    }).then(function () {
      btn.disabled = false;
      if (dbName === 'playground' && typeof refreshSchema === 'function') refreshSchema();
    });
  }

  function cleanError(err) {
    var msg = (err && err.message) || String(err);
    return msg.replace(/^Error:\s*/, '');
  }

  function renderResult(r, persistent) {
    var meta = Math.max(r.ms, 0.1).toFixed(1) + ' ms';
    if (!r.sets.length) {
      var isQuery = /^\s*(?:--[^\n]*\n\s*)*(select|with)\b/i.test(r.sql || '');
      var msg = r.changes ? r.changes + ' row' + (r.changes === 1 ? '' : 's') + ' changed.' :
        isQuery ? 'Done. 0 rows returned. In the practice data, no rows match these conditions.' :
        'Done. The statement ran successfully.';
      if (!persistent && r.changes) msg += ' (Lesson examples are undone automatically, so the data stays the same.)';
      return '<div class="res-status ok">' + msg + '<span class="res-meta">' + meta + '</span></div>';
    }
    var LIMIT = 200;
    return r.sets.map(function (set, i) {
      var rows = set.values;
      var head = '<thead><tr>' + set.columns.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead>';
      var body = '<tbody>' + rows.slice(0, LIMIT).map(function (row) {
        return '<tr>' + row.map(function (v) {
          if (v === null) return '<td class="null">NULL</td>';
          if (typeof v === 'number') return '<td class="num">' + (Number.isInteger(v) ? v : Math.round(v * 10000) / 10000) + '</td>';
          return '<td>' + esc(v) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
      var count = rows.length + ' row' + (rows.length === 1 ? '' : 's') + (rows.length > LIMIT ? ' (showing first ' + LIMIT + ')' : '');
      return '<div class="res-set">' +
        '<div class="res-status ok">' + (r.sets.length > 1 ? 'Result ' + (i + 1) + ': ' : '') + count + (i === r.sets.length - 1 ? '<span class="res-meta">' + meta + '</span>' : '') + '</div>' +
        (rows.length ? '<div class="res-table"><table>' + head + body + '</table></div>' : '') + '</div>';
    }).join('');
  }

  /* ------------------------------------------------------------------ playground */
  var refreshSchema = null;

  function renderPlayground() {
    document.title = 'SQL Playground · SQL Tutorials';
    setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Playground' }]);
    $('#topbar-right').innerHTML = '';
    renderOutline(null);
    var saved = localStorage.getItem('sqlt.playground') || '-- Pick a table on the left, or write any query.\nSELECT title, release_year, language\nFROM films\nWHERE release_year >= 2010\nORDER BY release_year DESC;';
    view.innerHTML =
      '<div class="playground">' +
      '<header class="lesson-head"><p class="eyebrow">Practice freely</p><h1>SQL Playground</h1>' +
      '<p class="hero-lead small">Write any query against the practice database. Changes you make here (like <code>INSERT</code> or <code>CREATE TABLE</code>) stay until you reset the database.</p></header>' +
      '<div class="pg-grid">' +
      '<aside class="schema" aria-label="Tables"><div class="schema-head"><h2>Tables</h2><button class="text-btn" id="pg-reset" type="button">Reset database</button></div>' +
      '<div id="schema-list" class="schema-list"><p class="muted">Loading tables…</p></div></aside>' +
      '<div class="pg-main"><pre class="sql editor" id="pg-src"></pre>' +
      '<section class="code pg-preview" id="pg-preview" hidden aria-label="Table preview">' +
      '<div class="code-bar"><span class="code-lang">Table preview</span><span class="pv-name"></span>' +
      '<span class="code-actions"><button type="button" class="cb pv-insert" title="Insert the table name at the cursor in your query">Insert name</button>' +
      '<button type="button" class="cb pv-close" aria-label="Close table preview">Close</button></span></div>' +
      '<div class="code-result"></div></section></div>' +
      '</div></div>';
    var src = $('#pg-src');
    src.textContent = saved;
    buildCode(src);
    var wrap = $('.pg-main .code');
    wrap.classList.add('big');
    wrap._db = 'playground';
    $('.code-lang', wrap).textContent = 'Playground';
    var ta = $('textarea', wrap);
    ta.addEventListener('input', function () { localStorage.setItem('sqlt.playground', ta.value); });
    var preview = $('#pg-preview'), previewTable = null;
    function showPreview(name, scroll) {
      previewTable = name;
      preview.hidden = false;
      $('.pv-name', preview).textContent = name;
      var out = $('.code-result', preview);
      if (scroll) out.innerHTML = '<div class="res-status">Loading…</div>';
      SQLRunner.run('SELECT *\nFROM "' + name.replace(/"/g, '""') + '"\nLIMIT 10;', { db: 'playground' }).then(function (r) {
        out.innerHTML = renderResult(r, true);
      }).catch(function (err) {
        out.innerHTML = '<div class="res-error"><strong>Error</strong><span>' + esc(cleanError(err)) + '</span></div>';
      }).then(function () {
        if (scroll) preview.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
    function insertAtCursor(text) {
      var s = ta.selectionStart, en = ta.selectionEnd;
      var before = ta.value.slice(0, s);
      if (/[\w"]$/.test(before)) text = ' ' + text;
      ta.value = before + text + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + text.length;
      localStorage.setItem('sqlt.playground', ta.value);
      syncCode(wrap);
      ta.focus();
    }
    $('.pv-close', preview).addEventListener('click', function () { preview.hidden = true; previewTable = null; });
    $('.pv-insert', preview).addEventListener('click', function () { if (previewTable) insertAtCursor(previewTable); });
    // swap run handler to use the playground database
    var runBtn = $('.run', wrap);
    var fresh = runBtn.cloneNode(true);
    runBtn.replaceWith(fresh);
    fresh.addEventListener('click', function () { runCode(wrap, 'playground'); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.stopImmediatePropagation(); e.preventDefault(); runCode(wrap, 'playground'); }
    }, true);
    $('#pg-reset').addEventListener('click', function () {
      SQLRunner.reset('playground').then(function () { refreshSchema(); toast('Practice database reset'); });
      // the schema refresh below also re-runs the open preview
    });
    refreshSchema = function () {
      SQLRunner.schema('playground').then(function (tables) {
        var byName = {};
        tables.forEach(function (t) { byName[t.name.toLowerCase()] = t; });
        var used = {};
        var html = '';
        DATASETS.forEach(function (d) {
          var items = d.tables.map(function (n) { used[n] = 1; return byName[n]; }).filter(Boolean);
          if (items.length) html += schemaGroup(d.name, d.note, items);
        });
        var extra = tables.filter(function (t) { return !used[t.name.toLowerCase()]; });
        if (extra.length) html += schemaGroup('Created by you', 'Tables you added in the playground', extra);
        $('#schema-list').innerHTML = html;
        if (window.SQLAutocomplete) SQLAutocomplete.setSchema('playground', tables);
        if (previewTable) {
          if (byName[previewTable.toLowerCase()]) showPreview(previewTable, false);
          else { preview.hidden = true; previewTable = null; }
        }
      }).catch(function (err) {
        $('#schema-list').innerHTML = '<p class="res-error">' + esc(cleanError(err)) + '</p>';
      });
    };
    $('#schema-list').addEventListener('click', function (e) {
      var ins = e.target.closest('[data-insert]');
      if (ins) return insertAtCursor(ins.dataset.insert);
      var b = e.target.closest('[data-table]');
      if (b) showPreview(b.dataset.table, true);
    });
    refreshSchema();
    afterRender(false);
  }

  function schemaGroup(name, note, items) {
    return '<details class="schema-group" open><summary>' + esc(name) + '<span>' + esc(note) + '</span></summary><ul>' +
      items.map(function (t) {
        return '<li><div class="trow"><button type="button" class="tprev" data-table="' + esc(t.name) + '" title="Preview ' + esc(t.name) + ' below your query">' +
          '<span class="tname">' + esc(t.name) + (t.type === 'view' ? ' <em>view</em>' : '') + '</span><span class="trows">' + t.rows + ' rows</span></button>' +
          '<button type="button" class="tins" data-insert="' + esc(t.name) + '" title="Insert ' + esc(t.name) + ' into your query" aria-label="Insert ' + esc(t.name) + ' into your query">+</button></div>' +
          '<p class="tcols">' + t.columns.map(function (c) {
            return '<button type="button" class="tcol" data-insert="' + esc(c.name) + '" title="Insert ' + esc(c.name) + ' into your query">' + esc(c.name) + '</button>';
          }).join(', ') + '</p></li>';
      }).join('') + '</ul></details>';
  }

  /* ------------------------------------------------------------------ search */
  var searchInput = $('#search'), searchBox = $('#search-results'), searchSel = -1;

  function doSearch() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) return hideSearch();
    var words = q.split(/\s+/);
    var hits = flat.map(function (t) {
      var title = t.title.toLowerCase(), text = t.text.toLowerCase();
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (title.indexOf(w) >= 0) score += 10;
        else if (text.indexOf(w) >= 0) score += 1;
        else return null;
      }
      if (title.indexOf(q) >= 0) score += 20;
      return { t: t, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
    searchSel = hits.length ? 0 : -1;
    searchBox.hidden = false;
    if (!hits.length) {
      searchBox.innerHTML = '<p class="search-empty">No topics match “' + esc(searchInput.value.trim()) + '”.</p>';
      return;
    }
    searchBox.innerHTML = hits.map(function (h, i) {
      return '<a role="option" class="search-hit' + (i === 0 ? ' sel' : '') + '" href="#/' + h.t.module.slug + '/' + h.t.id + '">' +
        '<span class="hit-title">' + mark(h.t.title, words) + '</span>' +
        '<span class="hit-mod">' + esc(h.t.module.title) + '</span>' +
        '<span class="hit-snip">' + snippet(h.t.text, words) + '</span></a>';
    }).join('');
  }

  function mark(text, words) {
    var out = esc(text);
    words.forEach(function (w) {
      if (w.length < 2) return;
      out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  function snippet(text, words) {
    var lower = text.toLowerCase(), pos = -1;
    for (var i = 0; i < words.length && pos < 0; i++) pos = lower.indexOf(words[i]);
    if (pos < 0) return esc(text.slice(0, 90)) + '…';
    var start = Math.max(0, pos - 40);
    return (start ? '…' : '') + mark(text.slice(start, start + 110), words) + '…';
  }

  function hideSearch() { searchBox.hidden = true; searchSel = -1; }

  searchInput.addEventListener('input', doSearch);
  searchInput.addEventListener('focus', function () { if (searchInput.value.trim()) doSearch(); });
  searchInput.addEventListener('keydown', function (e) {
    var hits = $$('.search-hit', searchBox);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!hits.length) return;
      e.preventDefault();
      searchSel = (searchSel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
      hits.forEach(function (h, i) { h.classList.toggle('sel', i === searchSel); });
      hits[searchSel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && hits[searchSel]) {
      e.preventDefault();
      location.hash = hits[searchSel].getAttribute('href');
      searchInput.value = '';
      searchInput.blur();
    } else if (e.key === 'Escape') {
      searchInput.value = '';
      hideSearch();
      searchInput.blur();
    }
  });
  searchBox.addEventListener('click', function (e) {
    if (e.target.closest('.search-hit')) { searchInput.value = ''; hideSearch(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search')) hideSearch();
  });

  /* ------------------------------------------------------------------ chrome: drawer, theme, keys, progress */
  function openDrawer() {
    document.body.classList.add('drawer-open');
    $('#scrim').hidden = false;
    $('#menu-btn').setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    $('#scrim').hidden = true;
    $('#menu-btn').setAttribute('aria-expanded', 'false');
  }
  $('#menu-btn').addEventListener('click', function () {
    document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer();
  });
  $('#scrim').addEventListener('click', closeDrawer);

  $('#theme-toggle').addEventListener('click', function () {
    var t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    localStorage.setItem('sqlt.theme', t);
  });

  $('#reset-progress').addEventListener('click', function () {
    if (!flat.some(isDone)) return toast('Nothing to reset yet');
    if (!confirm('Clear your progress for all topics? This cannot be undone.')) return;
    shownTopic = null;
    progress = {};
    saveProgress();
    route();
    toast('Progress cleared');
  });

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (e.key === 'Escape') { closeDrawer(); hideSearch(); }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); if (innerWidth < 900) openDrawer(); searchInput.focus(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var cur = currentTopic();
      if (!cur) return;
      var t = flat[cur.flatIndex + (e.key === 'ArrowRight' ? 1 : -1)];
      if (t) location.hash = '#/' + t.module.slug + '/' + t.id;
    }
  });

  function currentTopic() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var m = course.filter(function (x) { return x.slug === parts[0]; })[0];
    if (!m) return null;
    return m.topics.filter(function (x) { return x.id === parts[1]; })[0] || m.topics[0];
  }

  function updateReadProgress() {
    var h = document.documentElement.scrollHeight - innerHeight;
    $('#read-progress').style.transform = 'scaleX(' + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ')';
  }
  addEventListener('scroll', updateReadProgress, { passive: true });

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }


  /* ------------------------------------------------------------------ start */
  load().then(function () {
    addEventListener('hashchange', route);
    route();
  }).catch(function (err) {
    view.innerHTML = '<div class="load-error"><h1>Could not load the lessons</h1><p>' + esc(err.message) +
      '</p><p>If you opened <code>index.html</code> straight from your computer, run a small local server instead (see the README).</p></div>';
  });
})();
