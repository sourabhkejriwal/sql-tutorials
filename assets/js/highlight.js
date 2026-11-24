/* Tiny SQL syntax highlighter. Returns HTML for a string of SQL. */
(function () {
  var KEYWORDS = ('SELECT FROM WHERE AND OR NOT IN IS NULL AS ON USING JOIN INNER LEFT RIGHT FULL OUTER CROSS ' +
    'GROUP BY ORDER HAVING LIMIT OFFSET DISTINCT UNION ALL INTERSECT EXCEPT CASE WHEN THEN ELSE END ' +
    'WITH RECURSIVE OVER PARTITION ROWS RANGE BETWEEN UNBOUNDED PRECEDING FOLLOWING CURRENT ROW ' +
    'ASC DESC LIKE ILIKE EXISTS ANY SOME CREATE TABLE INDEX VIEW UNIQUE CLUSTERED INCLUDE ALTER ADD DROP ' +
    'INSERT INTO VALUES UPDATE SET DELETE PRIMARY KEY FOREIGN REFERENCES PERSISTED TOP INTERVAL ' +
    'EXPLAIN ANALYZE TRUE FALSE VARCHAR INT INTEGER TEXT REAL DATE MONTH YEAR DAY BEGIN COMMIT ROLLBACK').split(' ');
  var KW = {};
  KEYWORDS.forEach(function (k) { KW[k] = true; });

  var RE = /(--[^\n]*)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(\s*\()?|(\s+)|([^\sA-Za-z0-9_'])/g;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(src) {
    var out = '';
    var m;
    RE.lastIndex = 0;
    while ((m = RE.exec(src))) {
      if (m[1]) out += '<span class="tk-com">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tk-str">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tk-num">' + m[3] + '</span>';
      else if (m[4]) {
        var up = m[4].toUpperCase();
        if (m[5] && !KW[up]) out += '<span class="tk-fn">' + esc(m[4]) + '</span>' + esc(m[5]);
        else if (KW[up]) out += '<span class="tk-kw">' + esc(m[4]) + '</span>' + (m[5] ? esc(m[5]) : '');
        else out += esc(m[4]) + (m[5] ? esc(m[5]) : '');
      } else if (m[6]) out += m[6];
      else if (m[7]) out += '<span class="tk-op">' + esc(m[7]) + '</span>';
      if (m[0] === '') RE.lastIndex++;
    }
    return out;
  }

  window.SQLHighlight = { highlight: highlight, escape: esc };
})();
