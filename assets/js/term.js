/* assets/js/term.js — the home page shell.
 *
 * Static, no backend. The man page already in the DOM is the first output;
 * this script un-hides the input line, handles a dozen commands, tab
 * completion and ↑/↓ history. Anything that looks like a question goes to
 * `ask`, which today only says the agent is offline (stage 2 is a Worker).
 *
 * Without JavaScript the page is just the man page. Nothing here is required
 * to read the site. */

(function () {
  'use strict';

  var term = document.getElementById('term');
  var out = document.getElementById('term-out');
  var form = document.getElementById('term-form');
  var input = document.getElementById('term-input');
  var typed = document.getElementById('term-typed');
  var dataEl = document.getElementById('term-data');
  if (!term || !out || !form || !input || !typed || !dataEl) return;

  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var manEl = document.getElementById('man');
  var manHTML = manEl ? manEl.outerHTML.replace(' id="man"', '') : '';
  var hist = [];
  var histPos = -1;
  var draft = '';

  /* ---- output helpers ---- */

  function line(text, cls) {
    var el = document.createElement('div');
    el.className = 'term-line' + (cls ? ' ' + cls : '');
    el.textContent = text;
    out.appendChild(el);
    return el;
  }

  function html(markup, cls) {
    var el = document.createElement('div');
    el.className = 'term-line' + (cls ? ' ' + cls : '');
    el.innerHTML = markup;
    out.appendChild(el);
    return el;
  }

  function link(href, text, external) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  function echoCmd(cmd) {
    var el = document.createElement('div');
    el.className = 'term-cmd';
    el.textContent = cmd;
    out.appendChild(el);
  }

  function settle() {
    form.scrollIntoView({ block: 'nearest' });
  }

  function isKo() { return document.documentElement.lang === 'ko'; }

  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

  /* ---- commands ---- */

  var commands = {};

  function def(names, help, fn) {
    names.split(' ').forEach(function (n) { commands[n] = { help: help, fn: fn, primary: n === names.split(' ')[0] }; });
  }

  def('help ?', 'list commands', function () {
    var rows = [];
    Object.keys(commands).forEach(function (k) {
      var c = commands[k];
      if (c.primary) rows.push(pad(k, 14) + c.help);
    });
    rows.sort();
    line(rows.join('\n'));
    line(isKo()
      ? '명령어가 아닌 문장은 ask 로 보냅니다. (에이전트는 아직 오프라인)'
      : 'Anything else is sent to ask. (agent is offline for now)', 'mute');
  });

  def('man', 'man seory0 — about me', function (args) {
    if (args.length && args[0] !== 'seory0') { line('No manual entry for ' + args[0]); return; }
    html(manHTML);
  });

  def('ls dir', 'ls [writing] — list posts', function () {
    data.posts.forEach(function (p) {
      var el = document.createElement('div');
      el.className = 'term-line';
      el.appendChild(document.createTextNode(p.date + '  '));
      el.appendChild(link(p.url, p.slug));
      el.appendChild(document.createTextNode('  ' + p.title));
      out.appendChild(el);
    });
    var cv = document.createElement('div');
    cv.className = 'term-line';
    cv.appendChild(document.createTextNode('2026-10-01  '));
    cv.appendChild(link(data.cv, 'cv.pdf', true));
    cv.appendChild(document.createTextNode('  curriculum vitae'));
    out.appendChild(cv);
  });

  def('cat open', 'cat cv.pdf — open the CV', function (args) {
    var target = (args[0] || '').replace(/^\.\//, '');
    if (target === 'cv.pdf' || target === 'cv') {
      var el = document.createElement('div');
      el.className = 'term-line';
      el.appendChild(document.createTextNode('opening '));
      el.appendChild(link(data.cv, 'cv.pdf', true));
      el.appendChild(document.createTextNode(' …'));
      out.appendChild(el);
      window.open(data.cv, '_blank', 'noopener');
      return;
    }
    var post = data.posts.filter(function (p) { return p.slug === target || p.slug + '.md' === target; })[0];
    if (post) { location.href = post.url; return; }
    line('cat: ' + (target || '') + ': No such file or directory');
  });

  def('cd', 'cd writing — go to the archive', function (args) {
    var where = args[0] || '~';
    if (where === 'writing' || where === 'writing/') { location.href = data.writing; return; }
    if (where === '~' || where === '/' || where === '.' || where === '..') { line('already home', 'mute'); return; }
    line('cd: ' + where + ': No such file or directory');
  });

  def('whoami', 'whoami', function () { line('seory0'); });
  def('pwd', 'pwd', function () { line('/home/seory0'); });
  def('date', 'date', function () { line(new Date().toString()); });
  def('uname', 'uname -a', function () { line('SEORY0 jekyll 4.4 x86_64 GNU/HTML'); });
  def('echo', 'echo <text>', function (args) { line(args.join(' ')); });
  def('history', 'history', function () {
    line(hist.map(function (h, i) { return pad(i + 1, 5) + h; }).join('\n'));
  });

  def('lang', 'lang ko|en', function (args) {
    var btn = document.getElementById('nav-lang-btn');
    var want = args[0];
    if (!btn) return;
    if (!want) { line(document.documentElement.lang); return; }
    if (want !== 'ko' && want !== 'en') { line('lang: ko or en'); return; }
    if (document.documentElement.lang !== want) btn.click();
    line('lang=' + want, 'mute');
  });

  def('theme', 'theme dark|light', function (args) {
    var btn = document.getElementById('nav-theme-btn');
    var dark = document.documentElement.classList.contains('theme-dark');
    var want = args[0];
    if (!btn) return;
    if (!want) { line(dark ? 'dark' : 'light'); return; }
    if (want !== 'dark' && want !== 'light') { line('theme: dark or light'); return; }
    if ((want === 'dark') !== dark) btn.click();
    line('theme=' + want, 'mute');
  });

  def('clear cls', 'clear', function () { out.innerHTML = ''; });

  def('mail email', 'mail — write to me', function () {
    line('mailto:' + data.email);
    location.href = 'mailto:' + data.email;
  });

  def('github gh', 'github — my repositories', function () {
    html('<a href="' + data.github + '" target="_blank" rel="noopener">' + data.github + '</a>');
  });

  def('ask', 'ask <question> — agent (offline)', function (args) {
    var q = args.join(' ');
    if (!q) { line('ask: what?'); return; }
    line(isKo()
      ? '[agent] 아직 오프라인입니다. cv.pdf 와 writing 을 읽어 주세요.'
      : '[agent] offline for now. Read cv.pdf and writing instead.', 'mute');
  });

  def('sudo', 'sudo', function () {
    line('seory0 is not in the sudoers file. This incident will be reported.');
  });

  def('rm', 'rm', function (args) {
    if (args.join(' ').replace(/\s+/g, ' ').indexOf('-rf /') !== -1) {
      var mark = document.querySelector('.foot .mark');
      line(mark ? mark.textContent : 'KERNEL PAN!C', 'mark');
      return;
    }
    line('rm: cannot remove: Read-only file system');
  });

  def('exit logout', 'exit', function () {
    line('logout');
    line('Connection to seory0.github.io closed.', 'mute');
  });

  /* ---- dispatch ---- */

  function run(raw) {
    var cmd = raw.trim();
    echoCmd(cmd);
    if (!cmd) return;
    hist.push(cmd);
    histPos = hist.length;
    var parts = cmd.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (commands[name]) { commands[name].fn(args); return; }
    if (parts.length > 1 || /\?$/.test(cmd)) { commands.ask.fn(parts); return; }
    line('bash: ' + name + ': command not found', 'mute');
    line(isKo() ? 'help 를 입력해 보세요.' : "try 'help'", 'mute');
  }

  /* ---- input line ---- */

  function sync() { typed.textContent = input.value; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = '';
    sync();
    run(v);
    settle();
  });

  input.addEventListener('input', sync);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      if (!hist.length) return;
      if (histPos === hist.length) draft = input.value;
      histPos = Math.max(0, histPos - 1);
      input.value = hist[histPos];
      sync();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (histPos >= hist.length) return;
      histPos = Math.min(hist.length, histPos + 1);
      input.value = histPos === hist.length ? draft : hist[histPos];
      sync();
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      var v = input.value;
      var parts = v.split(/\s+/);
      var pool = parts.length <= 1
        ? Object.keys(commands).filter(function (k) { return commands[k].primary; })
        : data.posts.map(function (p) { return p.slug; }).concat(['cv.pdf', 'writing', 'seory0', 'ko', 'en', 'dark', 'light']);
      var last = parts[parts.length - 1];
      var hits = pool.filter(function (c) { return c.indexOf(last) === 0; });
      if (hits.length === 1) {
        parts[parts.length - 1] = hits[0];
        input.value = parts.join(' ') + ' ';
        sync();
      } else if (hits.length > 1) {
        echoCmd(v);
        line(hits.join('  '));
        settle();
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) {
      echoCmd(input.value + '^C');
      input.value = '';
      sync();
    }
  });

  input.addEventListener('focus', function () { form.classList.add('focus'); });
  input.addEventListener('blur', function () { form.classList.remove('focus'); });

  /* Clicking the box focuses the line; typing "/" anywhere does too. */
  term.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, summary')) return;
    if (window.getSelection().toString()) return;
    input.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey &&
        !e.target.closest('input, textarea, [contenteditable]')) {
      e.preventDefault();
      input.focus();
    }
  });

  /* ---- boot ---- */

  var first = out.querySelector('[data-term-first]');
  if (first) first.hidden = false;
  var hint = term.querySelector('[data-term-hint]');
  if (hint) hint.hidden = false;
  form.hidden = false;
  term.classList.add('is-live');

  /* Desktop only — a focused input on a phone pops the keyboard over the page. */
  if (window.matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
})();
