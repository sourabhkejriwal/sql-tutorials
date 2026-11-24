# SQL Tutorials

A free, hands-on SQL course you can work through in your browser. Six short modules go from a first `SELECT` to window functions and query optimization. Every example runs in the page, so you can edit it and see the result straight away.

**Open the course:** https://sourabhkejriwal.github.io/sql-tutorials/

## What's inside

| # | Module | Level | Topics |
|---|--------|-------|--------|
| 1 | SQL Fundamentals: COUNT, WHERE, LIKE, NULL, aggregates, ORDER BY, GROUP BY, HAVING, execution order | Beginner | 14 |
| 2 | Joins & Set Operations: INNER/OUTER/CROSS/SELF joins, UNION, INTERSECT, EXCEPT, subqueries | Beginner | 8 |
| 3 | CASE & Subqueries: CASE logic, conditional aggregates, simple, correlated and nested subqueries | Intermediate | 7 |
| 4 | Common Table Expressions: the WITH clause, multiple CTEs, CTE vs JOIN vs subquery | Intermediate | 5 |
| 5 | Window Functions: OVER, RANK, PARTITION BY, running totals and moving averages, LAG | Intermediate | 6 |
| 6 | Optimization & Interview Prep: indexes, faster query patterns, common mistakes, interview Q&A | Advanced | 6 |

## How it works

- **Two-column layout.** The course outline stays on the left, with your progress. The lesson you're reading is on the right, with Previous / Next links at the bottom.
- **Run any example.** Code blocks with a **Run** button run on a small practice database in your browser ([sql.js](https://sql.js.org), which is SQLite compiled to WebAssembly). You can edit an example before you run it. Lesson examples are undone after each run, so the data never changes.
- **Practise.** Each topic has exercises with solutions you can reveal, and "Try it yourself" editors.
- **Track progress.** Mark topics as complete. Progress is saved in your browser (localStorage). There's no sign-up and nothing is sent anywhere.
- **Playground.** Write any query against the practice data, see every table and its columns, and create your own tables.
- **Search and shortcuts.** `/` searches topics, `←` / `→` move between topics, and `Ctrl`/`⌘` + `Enter` runs the query you're editing. There's also a light/dark theme, and the layout works on phones.

Some examples are marked **Read-only**. They use syntax from other databases (such as `TOP`, `INTERVAL` or `EXTRACT`), show a deliberate mistake, or are templates.

## Project layout

```
index.html            app shell (sidebar + content column)
assets/css/style.css  all styles (light and dark themes)
assets/js/app.js      routing, outline, progress, search, playground
assets/js/sql-runner.js   loads sql.js and runs queries
assets/js/highlight.js    small SQL syntax highlighter
content/*.html        lesson content, one file per module, one <section> per topic
data/practice.sql     practice database (generated)
tools/build_db.py     generates data/practice.sql
```

To change a lesson, edit the matching file in `content/`. Each `<section class="topic">` becomes one page. A `<pre class="sql" data-run>` block gets a Run button.

## Run it locally

The page loads its lessons with `fetch`, so open it through a local web server rather than double-clicking `index.html`:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

To rebuild the practice data after editing `tools/build_db.py`:

```bash
python3 tools/build_db.py
```
