(function () {
  var DATA = window.QB_DATA;
  var app = document.getElementById('app');
  var MARKS_ORDER = ['1', '2', '3', '4', '5'];
  var WORDS = { '1': 'one-mark', '2': 'two-mark', '3': 'three-mark', '4': 'four-mark', '5': 'five-mark' };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(app, {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }

  function renderHome(filter) {
    var q = (filter || '').toLowerCase();
    var html = '';
    html += '<div class="search-box"><input id="search" type="search" placeholder="Search chapters..." value="' + esc(filter || '') + '"></div>';
    html += '<div class="chapter-list">';
    DATA.chapters.forEach(function (ch, i) {
      if (q && ch.name.toLowerCase().indexOf(q) === -1) return;
      var split = MARKS_ORDER.filter(function (m) { return ch.marks[m]; })
        .map(function (m) { return ch.marks[m].length + ' ' + WORDS[m]; }).join(' · ');
      html += '<a class="chapter-card" href="#/chapter/' + i + '">'
        + '<div class="ch-num">' + (i + 1) + '</div>'
        + '<div class="ch-info">'
        + '<div class="ch-name">' + esc(ch.name) + '</div>'
        + '<div class="ch-count">' + ch.unique + ' questions</div>'
        + '<div class="ch-split">' + split + '</div>'
        + '</div>'
        + '<div class="ch-arrow">›</div></a>';
    });
    html += '</div>';
    app.innerHTML = html;
    var input = document.getElementById('search');
    input.addEventListener('input', function () { renderHome(input.value); input.focus(); });
  }

  function renderChapter(idx) {
    var ch = DATA.chapters[idx];
    if (!ch) { renderHome(''); return; }
    var html = '';
    html += '<button class="back-btn" onclick="location.hash=\'#\'">‹ All chapters</button>';
    html += '<div class="chapter-head"><h2>Chapter ' + (idx + 1) + ': ' + esc(ch.name) + '</h2>'
      + '<div class="sub">' + ch.unique + ' unique questions (from ' + ch.raw + ' across 23 papers)</div></div>';
    html += '<nav class="marks-nav">';
    MARKS_ORDER.forEach(function (m) {
      var qs = ch.marks[m];
      if (!qs || !qs.length) return;
      html += '<a class="marks-chip" href="#/chapter/' + idx + '/m' + m + '" data-target="sec-' + m + '">'
        + m + '-mark (' + qs.length + ')</a>';
    });
    html += '</nav>';
    MARKS_ORDER.forEach(function (m) {
      var qs = ch.marks[m];
      if (!qs || !qs.length) return;
      html += '<section class="marks-section" id="sec-' + m + '">'
        + '<div class="marks-title">' + m + '-mark questions <span class="count">' + qs.length + '</span></div>';
      qs.forEach(function (item) {
        html += '<div class="q-card"><div class="q-text">' + esc(item.q) + '</div>';
        if (item.img) html += '<div class="q-fig"><img src="' + item.img + '" alt="figure" loading="lazy"></div>';
        html += '<div class="q-tags">';
        if (item.count > 1) html += '<span class="tag repeat">Repeated ' + item.count + 'x</span>';
        item.years.forEach(function (y) { html += '<span class="tag year">' + esc(y) + '</span>'; });
        html += '</div></div>';
      });
      html += '</section>';
    });
    app.innerHTML = html;
    renderMath();
    var chips = app.querySelectorAll('.marks-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(chip.getAttribute('data-target'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    var m = location.hash.match(/\/m(\d)$/);
    if (m) {
      var t = document.getElementById('sec-' + m[1]);
      if (t) setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 50);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function route() {
    var h = location.hash;
    var m = h.match(/^#\/chapter\/(\d+)/);
    if (m) renderChapter(parseInt(m[1], 10));
    else renderHome('');
  }

  window.addEventListener('hashchange', route);
  if (document.readyState === 'complete') route();
  else window.addEventListener('load', route);
  route();
})();
