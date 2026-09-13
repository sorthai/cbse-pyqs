(function () {
  var DATA = window.QB_DATA;
  var app = document.getElementById('app');
  var MARKS_ORDER = ['1', '2', '3', '4', '5'];
  var WORDS = { '1': 'one-mark', '2': 'two-mark', '3': 'three-mark', '4': 'four-mark', '5': 'five-mark' };

  // === HOMI DEEP LINK CONFIG ===
  // Real deep links from the Homi team. "Check answer" -> Evaluation screen, "Get model answer" -> Solution screen.
  var HOMI_CHECK_LINK = 'https://link.heyhomi.in/?screen=Evaluation&utm_source=google&utm_medium=cpa&utm_campaign=install-q2-2026&utm_content=banner-v1&utm_term=english';
  var HOMI_MODEL_LINK = 'https://link.heyhomi.in/?screen=Solution&utm_source=google&utm_medium=cpa&utm_campaign=install-q2-2026&utm_content=banner-v1&utm_term=english';

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

  function qCardHtml(item) {
    var h = '<div class="q-card"><div class="q-text">' + formatQ(item.q) + '</div>';
    if (item.img) h += '<div class="q-fig"><img src="' + item.img + '" alt="figure" loading="lazy"></div>';
    h += '<div class="q-tags">';
    item.years.forEach(function (y) { h += '<span class="tag year y' + esc(y) + '">' + esc(y) + '</span>'; });
    h += '</div>';
    h += '<div class="homi-actions">'
      + '<a class="homi-btn" href="' + HOMI_CHECK_LINK + '" target="_blank" rel="noopener">Check answer</a>'
      + '<a class="homi-btn solid" href="' + HOMI_MODEL_LINK + '" target="_blank" rel="noopener">Get model answer</a>'
      + '</div></div>';
    return h;
  }

  // One true count: total times these questions appeared across all 23 papers.
  function sliceAsked(qs) {
    return qs.reduce(function (s, x) { return s + (x.count || (x.apps ? x.apps.length : 1)); }, 0);
  }

  function byRecentThenCount(a, b) {
    return (Math.max.apply(null, b.years.map(Number)) - Math.max.apply(null, a.years.map(Number)))
      || ((b.count || 1) - (a.count || 1));
  }

  // A consolidated unit: the latest year's question (verbatim) + a dropdown
  // "asked N times in exam" revealing the rest of the similar questions.
  function groupSectionHtml(qs) {
    var ex = qs.slice().sort(byRecentThenCount)[0];
    var rest = qs.filter(function (qq) { return qq !== ex; }).sort(byRecentThenCount);
    var asked = sliceAsked(qs);
    var h = '<section class="marks-section pattern-sec">';
    h += qCardHtml(ex);
    if (rest.length) {
      h += '<div class="pattern-rest" style="display:none">';
      rest.forEach(function (item) { h += qCardHtml(item); });
      h += '</div>';
      h += '<button class="asked-toggle" type="button">asked ' + asked + ' times in exam <span class="pat-chev">&#9662;</span></button>';
    } else {
      h += '<div class="asked-pill">asked ' + asked + ' times in exam</div>';
    }
    h += '</section>';
    return h;
  }

  function bindToggles() {
    app.querySelectorAll('.asked-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = btn.closest('.pattern-sec');
        var restEl = sec.querySelector('.pattern-rest');
        if (!restEl) return;
        var open = restEl.style.display !== 'none';
        restEl.style.display = open ? 'none' : '';
        sec.classList.toggle('open', !open);
      });
    });
  }

  function bindChips() {
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

  function renderChapter(idx, view) {
    var ch = DATA.chapters[idx];
    if (!ch) { renderHome(''); return; }
    var html = '';
    html += '<button class="back-btn" onclick="location.hash=\'#\'">‹ All chapters</button>';
    html += '<div class="chapter-head"><h2>Chapter ' + (idx + 1) + ': ' + esc(ch.name) + '</h2>'
      + '<div class="sub">' + ch.unique + ' unique questions (from ' + ch.raw + ' across 23 papers)</div></div>';
    html += '<nav class="view-tabs">'
      + '<a class="view-tab' + (view === 'marks' ? '' : ' active') + '" href="#/chapter/' + idx + '">Most asked</a>'
      + '<a class="view-tab' + (view === 'marks' ? ' active' : '') + '" href="#/chapter/' + idx + '/marks">By marks</a>'
      + '</nav>';
    var desc = MARKS_ORDER.slice().reverse();
    if (view !== 'marks' && ch.groups) {
      // Most asked: same marks-descending segregation as By marks,
      // but with similar questions consolidated into one-question + dropdown units.
      var markOf = {};
      MARKS_ORDER.forEach(function (m) { (ch.marks[m] || []).forEach(function (it) { markOf[it.q] = m; }); });
      var perMark = {};
      ch.groups.forEach(function (g) {
        MARKS_ORDER.forEach(function (m) {
          var qs = g.qs.filter(function (x) { return markOf[x.q] === m; });
          if (qs.length) (perMark[m] = perMark[m] || []).push(qs);
        });
      });
      html += '<nav class="marks-nav">';
      desc.forEach(function (m) {
        var units = perMark[m];
        if (!units || !units.length) return;
        html += '<a class="marks-chip" href="#/chapter/' + idx + '" data-target="sec-' + m + '">'
          + m + '-mark (' + units.length + ')</a>';
      });
      html += '</nav>';
      desc.forEach(function (m) {
        var units = perMark[m];
        if (!units || !units.length) return;
        units.sort(function (a, b) { return sliceAsked(b) - sliceAsked(a); });
        html += '<section class="marks-section" id="sec-' + m + '">'
          + '<div class="marks-title">' + m + '-mark questions <span class="count">' + units.length + '</span></div>';
        units.forEach(function (qs) { html += groupSectionHtml(qs); });
        html += '</section>';
      });
      app.innerHTML = html;
      renderMath();
      bindToggles();
      bindChips();
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
    bindChips();
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
    var m = h.match(/^#\/chapter\/(\d+)(\/marks)?/);
    if (m) renderChapter(parseInt(m[1], 10), m[2] ? 'marks' : 'patterns');
    else renderHome('');
  }

  window.addEventListener('hashchange', route);
  if (document.readyState === 'complete') route();
  else window.addEventListener('load', route);
  route();
})();
