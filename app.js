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


  function formatQ(text) {
    var escd = esc(text);
    escd = escd.replace(/ (Reason\s*(?:\\\([^:]{0,14}|\(\s*R\s*\)\s*):)/, '<br>$1');
    escd = escd.replace(/ ((?:Answer with codes|Choose the correct option|Choose)\s*:)/, '<br>$1');
    escd = escd.replace(/ OR (?=\()/, '<br>OR ');
    var markers = [];
    var inMath = 0;
    for (var i = 0; i < escd.length - 2; i++) {
      if (escd[i] === '\\' && (escd[i+1] === '(' || escd[i+1] === '[')) { inMath++; i++; continue; }
      if (escd[i] === '\\' && (escd[i+1] === ')' || escd[i+1] === ']')) { inMath = Math.max(0, inMath-1); i++; continue; }
      if (inMath) continue;
      if (escd[i] === '(') {
        var c = escd[i+1];
        if ((c >= 'A' && c <= 'D' || c >= 'a' && c <= 'd') && escd[i+2] === ')') {
          var prev = i > 0 ? escd[i-1] : ' ';
          var before = escd.slice(Math.max(0, i - 10), i);
          if (!/[A-Za-z0-9]/.test(prev) && !/assertion\s*$/i.test(before)) markers.push({ pos: i, c: c });
        }
      }
    }
    var upper = 'ABCD', lower = 'abcd';
    function findRun(seq) {
      for (var s = 0; s < markers.length; s++) {
        if (markers[s].c !== seq[0]) continue;
        var k = 1, idxs = [s];
        for (var j = s + 1; j < markers.length && k < seq.length; j++) {
          if (markers[j].c === seq[k]) { idxs.push(j); k++; }
          else if (markers[j].c === seq[k-1]) { continue; }
          else break;
        }
        if (k === seq.length) return idxs;
      }
      return null;
    }
    var run = findRun(upper) || findRun(lower) || findRun(upper.slice(0,3)) || findRun(lower.slice(0,3));
    if (!run) return escd;
    var out = escd, off = 0;
    run.forEach(function (mi) {
      var p = markers[mi].pos + off;
      out = out.slice(0, p) + '<br>' + out.slice(p);
      off += 4;
    });
    return out;
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

  function qCardHtml(item) {
    var h = '<div class="q-card"><div class="q-text">' + formatQ(item.q) + '</div>';
    if (item.img) h += '<div class="q-fig"><img src="' + item.img + '" alt="figure" loading="lazy"></div>';
    h += '<div class="q-tags">';
    if (item.count > 1) h += '<span class="tag repeat">Repeated ' + item.count + 'x</span>';
    item.years.forEach(function (y) { h += '<span class="tag year y' + esc(y) + '">' + esc(y) + '</span>'; });
    h += '</div></div>';
    return h;
  }

  function renderChapter(idx, view) {
    var ch = DATA.chapters[idx];
    if (!ch) { renderHome(''); return; }
    var html = '';
    html += '<button class="back-btn" onclick="location.hash=\'#\'">‹ All chapters</button>';
    html += '<div class="chapter-head"><h2>Chapter ' + (idx + 1) + ': ' + esc(ch.name) + '</h2>'
      + '<div class="sub">' + ch.unique + ' unique questions (from ' + ch.raw + ' across 23 papers)</div></div>';
    html += '<nav class="view-tabs">'
      + '<a class="view-tab' + (view === 'patterns' ? '' : ' active') + '" href="#/chapter/' + idx + '">By marks</a>'
      + '<a class="view-tab' + (view === 'patterns' ? ' active' : '') + '" href="#/chapter/' + idx + '/patterns">By patterns (' + (ch.groups ? ch.groups.length : 0) + ')</a>'
      + '</nav>';
    if (view === 'patterns' && ch.groups) {
      ch.groups.forEach(function (g) {
        html += '<section class="marks-section pattern-sec">'
          + '<div class="pattern-head"><div class="pattern-name">' + esc(g.name) + '</div>'
          + '<div class="pattern-meta"><span class="tag asked">asked ' + g.asked + 'x</span>';
        g.years.forEach(function (y) { html += '<span class="tag year y' + esc(y) + '">' + esc(y) + '</span>'; });
        html += '</div></div>';
        g.qs.forEach(function (item) { html += qCardHtml(item); });
        html += '</section>';
      });
      app.innerHTML = html;
      renderMath();
      window.scrollTo(0, 0);
      return;
    }
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
      qs.forEach(function (item) { html += qCardHtml(item); });
      html += '</section>';
    });
    app.innerHTML = html;
    renderMath();
    var chips = app.querySelectorAll('.marks-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var t = document.getElementById(chip.getAttribute('data-target'));
        if (t) t.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    });
    var m = location.hash.match(/\/m(\d)$/);
    if (m) {
      var activeChip = app.querySelector('.marks-chip[data-target="sec-' + m[1] + '"]');
      if (activeChip) activeChip.classList.add('active');
      var t = document.getElementById('sec-' + m[1]);
      if (t) setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 50);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function route() {
    var h = location.hash;
    var m = h.match(/^#\/chapter\/(\d+)(\/patterns)?/);
    if (m) renderChapter(parseInt(m[1], 10), m[2] ? 'patterns' : 'marks');
    else renderHome('');
  }

  window.addEventListener('hashchange', route);
  if (document.readyState === 'complete') route();
  else window.addEventListener('load', route);
  route();
})();
