/*
  Doriano Ponzo, personal site.
  Theme toggle (with a wipe), mobile menu, active section, highlight, typed prompts,
  git log drawing, streaming text, command line, footer year.

  Every effect is optional. Without JavaScript the page is complete, and with reduced motion
  the effects are skipped (the "fx" class on <html> is set in <head> only when motion is welcome).
  The saved theme is applied earlier by a small inline script in <head>.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'theme';
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var effects = root.classList.contains('fx');
  var hasObserver = 'IntersectionObserver' in window;
  var themeToggle = null;

  /* ---------- Theme ---------- */

  function savedTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function saveTheme(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (e) {
      /* Private mode or blocked storage: the choice lasts for this page view only */
    }
  }

  function activeTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }

  function syncThemeLabel() {
    if (!themeToggle) return;
    var next = activeTheme() === 'dark' ? 'light' : 'dark';
    var label = 'Switch to ' + next + ' theme';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
  }

  /* Changes the theme. With a mouse, and where the browser supports view transitions, the new theme
     spreads from the element that asked for it, like a wipe. On touch screens the colors fade.
     With reduced motion the change is immediate. */
  function applyTheme(next, origin) {
    function change() {
      root.setAttribute('data-theme', next);
      saveTheme(next);
      syncThemeLabel();
    }

    if (!effects) {
      change();
      return;
    }

    /* On touch screens the browser bars slide in and out, and a view transition shifts the page
       under them (the sticky header can vanish while it runs). So there the colors fade instead. */
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (touch || !document.startViewTransition) {
      root.classList.add('theme-fade');
      change();
      window.setTimeout(function () {
        root.classList.remove('theme-fade');
      }, 450);
      return;
    }

    var box = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
    var x = box ? box.left + box.width / 2 : window.innerWidth / 2;
    var y = box ? box.top + box.height / 2 : window.innerHeight / 2;
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    var transition = document.startViewTransition(change);

    transition.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }, function () {
      /* The transition was skipped: the theme is already changed */
    });
  }

  function initThemeToggle() {
    themeToggle = document.querySelector('[data-theme-toggle]');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', function () {
      applyTheme(activeTheme() === 'dark' ? 'light' : 'dark', themeToggle);
    });

    if (darkQuery) {
      var onSystemChange = function () {
        if (!savedTheme()) syncThemeLabel();
      };
      if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
      else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
    }

    syncThemeLabel();
  }

  /* ---------- Mobile menu ---------- */

  function initMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var nav = document.getElementById('site-nav');
    if (!button || !nav) return;

    var desktop = window.matchMedia('(min-width: 48rem)');

    function isOpen() {
      return button.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open, options) {
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (open && options && options.focusFirst) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    }

    button.addEventListener('click', function () {
      setOpen(!isOpen(), { focusFirst: !isOpen() });
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        button.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (isOpen() && !nav.contains(event.target) && !button.contains(event.target)) {
        setOpen(false);
      }
    });

    var onBreakpoint = function () {
      if (desktop.matches) setOpen(false);
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  /* ---------- Active section in the navigation ---------- */

  function initActiveSection() {
    if (!hasObserver) return;

    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    var byId = {};
    links.forEach(function (link) {
      byId[link.getAttribute('href').slice(1)] = link;
    });

    var sections = [];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.removeAttribute('aria-current');
        });
        /* The section the agent is in is marked on the page (data-current) and in the nav (aria-current) */
        sections.forEach(function (section) {
          section.removeAttribute('data-current');
        });
        entry.target.setAttribute('data-current', '');
        var current = byId[entry.target.id];
        if (current) current.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    /* The hero has no nav link: it gets data-current, but no link is highlighted */
    ['top'].concat(Object.keys(byId)).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) {
        sections.push(section);
        observer.observe(section);
      }
    });
  }

  /* ---------- Highlight: the mark sweeps in once, when the line is read ---------- */

  function initHighlight() {
    /* A highlight inside streaming text is marked by the stream, once its words have arrived */
    var marks = Array.prototype.slice.call(document.querySelectorAll('.highlight:not([data-stream-owned])'));
    if (!marks.length) return;

    function reveal(el) {
      el.classList.add('is-marked');
    }

    if (!hasObserver) {
      marks.forEach(reveal);
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    marks.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Typed prompts: each command is typed once, when its section comes into view ---------- */

  function initTypedPrompts() {
    if (!effects || !hasObserver) return;

    var commands = Array.prototype.slice.call(document.querySelectorAll('.prompt-cmd[data-type]'));
    if (!commands.length) return;

    function type(el) {
      var text = el.getAttribute('data-text');
      var prompt = el.parentNode;
      var i = 0;
      prompt.classList.add('is-typing');
      (function step() {
        i += 1;
        el.textContent = text.slice(0, i);
        if (i < text.length) {
          window.setTimeout(step, 45);
        } else {
          prompt.classList.remove('is-typing');
        }
      })();
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        type(entry.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });

    /* Commands that are already on screen are left as they are, so nothing flickers on load */
    commands.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) return;
      el.setAttribute('data-text', el.textContent);
      el.textContent = '';
      observer.observe(el);
    });
  }

  /* ---------- Git log: the graph draws itself, node by node, when the section comes into view ---------- */

  function initLogDraw() {
    if (!effects || !hasObserver) return;

    var logs = Array.prototype.slice.call(document.querySelectorAll('.log'));
    if (!logs.length) return;

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-drawn');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    logs.forEach(function (log) {
      var commits = log.querySelectorAll('.commit');
      Array.prototype.forEach.call(commits, function (commit, i) {
        commit.style.setProperty('--i', i);
      });
      log.style.setProperty('--n', commits.length);
      observer.observe(log);
    });

    /* The hidden starting state is applied only now that the script is running */
    root.classList.add('fx-log');
  }

  /* ---------- Streaming text: the words arrive one by one, once, like an agent answering ---------- */

  function initStream() {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-stream]'));
    if (!targets.length) return;

    if (!effects || !hasObserver) {
      /* Nothing to animate: the text stays as it is */
      return;
    }

    var STEP = 32; /* milliseconds between two words */

    function split(el) {
      var index = 0;
      var markStart = null;

      (function walk(node, inMark) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var fragment = document.createDocumentFragment();
            child.nodeValue.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                fragment.appendChild(document.createTextNode(part));
                return;
              }
              var word = document.createElement('span');
              word.className = 'w';
              word.style.setProperty('--i', index);
              word.textContent = part;
              if (inMark && markStart === null) markStart = index;
              index += 1;
              fragment.appendChild(word);
            });
            node.replaceChild(fragment, child);
          } else if (child.nodeType === 1) {
            walk(child, inMark || child.classList.contains('highlight'));
          }
        });
      })(el, false);

      return { markStart: markStart };
    }

    /* Reveals the words one by one and keeps a single cursor right after the last revealed word */
    function stream(el, info) {
      var words = el.querySelectorAll('.w');
      if (!words.length) return;
      var caret = document.createElement('span');
      caret.className = 'stream-caret';
      caret.setAttribute('aria-hidden', 'true');
      caret.style.display = 'none';
      el.appendChild(caret);
      el.classList.add('is-live');

      var mark = el.querySelector('.highlight');
      if (mark && info.markStart !== null) {
        window.setTimeout(function () {
          mark.classList.add('is-marked');
        }, info.markStart * STEP + 250);
      }

      el._run = (el._run || 0) + 1;
      var run = el._run;
      var i = 0;
      (function step() {
        if (el._run !== run) return; /* a replay has started: this run stops */
        var word = words[i];
        word.classList.add('on');
        caret.style.display = 'block';
        caret.style.left = word.offsetLeft + word.offsetWidth + 2 + 'px';
        caret.style.top = word.offsetTop + 2 + 'px';
        caret.style.height = Math.max(word.offsetHeight - 4, 8) + 'px';
        i += 1;
        if (i < words.length) {
          window.setTimeout(step, STEP);
        } else {
          caret.classList.add('is-blinking');
          window.setTimeout(function () {
            if (caret.parentNode) caret.parentNode.removeChild(caret);
          }, 1800);
        }
      })();
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        stream(entry.target, entry.target._stream);
      });
    }, { threshold: 0.4 });

    targets.forEach(function (el) {
      var mark = el.querySelector('.highlight');
      if (mark) mark.setAttribute('data-stream-owned', '');
      el._stream = split(el);
      el.classList.add('is-split');
      observer.observe(el);
    });
  }

  /* ---------- Command line: the last prompt of the page accepts a few real commands ---------- */

  function initShell() {
    var host = document.querySelector('[data-shell]');
    if (!host || !host.parentNode) return;

    var LINKS = {
      linkedin: { label: 'LinkedIn', url: 'https://www.linkedin.com/in/dorianoponzo' },
      github: { label: 'GitHub', url: 'https://github.com/Ponch18' }
    };
    var SECTIONS = {
      about: 'About',
      work: 'What I work on',
      experience: 'Experience',
      skills: 'Skills',
      contact: 'Contact'
    };
    /* The commands written above each section work too */
    var ALIASES = {
      'whoami': 'top',
      'cat about.md': 'about',
      'ls work/': 'work',
      'ls work': 'work',
      'git log': 'experience',
      'cat skills.yml': 'skills',
      'open linkedin': 'linkedin',
      'hire': 'hire'
    };
    var HELP = [
      ['about', 'About'],
      ['work', 'What I work on'],
      ['experience', 'Experience'],
      ['skills', 'Skills'],
      ['contact', 'Contact'],
      ['linkedin', 'Open LinkedIn'],
      ['github', 'Open GitHub'],
      ['theme', 'Switch theme'],
      ['clear', 'Clear this screen']
    ];
    var NAMES = HELP.map(function (item) { return item[0]; })
      .concat(['help', 'whoami', 'hire', 'git log', 'cat about.md', 'cat skills.yml', 'ls work/', 'open linkedin']);
    var MAX_LINES = 60;

    function make(tag, className, text) {
      var el = document.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }

    /* --- Build the interface --- */
    var form = make('form', 'shell');
    form.setAttribute('autocomplete', 'off');
    form.setAttribute('aria-label', 'Command line');
    form.addEventListener('submit', function (event) { event.preventDefault(); });

    var log = make('div', 'shell-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-label', 'Command output');

    var row = make('div', 'shell-row');
    var label = make('label', 'shell-prompt');
    label.setAttribute('for', 'shell-input');
    var visual = make('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.appendChild(make('span', 'prompt-id', 'doriano@ponzo'));
    visual.appendChild(make('span', 'prompt-sep', ':~$'));
    label.appendChild(visual);
    label.appendChild(make('span', 'visually-hidden', 'Command line. Type help and press Enter.'));

    var field = make('span', 'shell-field');
    var input = make('input', 'shell-input');
    input.id = 'shell-input';
    input.type = 'text';
    input.maxLength = 40;
    input.placeholder = ' ';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('enterkeyhint', 'go');
    var cursor = make('span', 'cursor shell-cursor');
    cursor.setAttribute('aria-hidden', 'true');
    field.appendChild(input);
    field.appendChild(cursor);

    row.appendChild(label);
    row.appendChild(field);

    var hint = make('p', 'shell-hint');
    hint.appendChild(document.createTextNode('Type '));
    hint.appendChild(make('strong', null, 'help'));
    hint.appendChild(document.createTextNode(' and press Enter.'));

    form.appendChild(log);
    form.appendChild(row);
    form.appendChild(hint);
    host.parentNode.replaceChild(form, host);

    /* --- Output --- */
    function trim() {
      while (log.children.length > MAX_LINES) log.removeChild(log.firstChild);
    }

    function print(text) {
      log.appendChild(make('div', 'shell-line is-out', text));
      trim();
    }

    function echo(text) {
      var line = make('div', 'shell-line is-cmd');
      line.appendChild(make('span', 'prompt-id', 'doriano@ponzo'));
      line.appendChild(make('span', 'prompt-sep', ':~$'));
      line.appendChild(document.createTextNode(' ' + text));
      log.appendChild(line);
      trim();
    }

    function pad(text, width) {
      while (text.length < width) text += ' ';
      return text;
    }

    /* --- Actions --- */
    function go(id) {
      if (id === 'top') {
        window.scrollTo(0, 0);
        return;
      }
      var target = document.getElementById(id);
      if (target) target.scrollIntoView();
    }

    function openLink(key) {
      var link = LINKS[key];
      var opened = window.open(link.url, '_blank', 'noopener');
      if (opened) {
        print('Opening ' + link.label + ' in a new tab.');
        return;
      }
      /* The pop-up was blocked: show the address as a link instead */
      var line = make('div', 'shell-line is-out', link.label + ': ');
      var anchor = make('a', null, link.url);
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      line.appendChild(anchor);
      log.appendChild(line);
      trim();
    }

    function setTheme(arg) {
      var next = arg === 'light' || arg === 'dark' ? arg : activeTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next, input);
      print('Theme: ' + next + '.');
    }

    /* Returns true when the command scrolled the page, so the prompt must not be pulled back into view */
    function run(raw) {
      var line = raw.trim().replace(/\s+/g, ' ');
      if (!line) return false;
      echo(line);

      var lower = line.toLowerCase();
      var name = ALIASES[lower] || lower;
      var parts = name.split(' ');
      var cmd = parts[0];
      var arg = parts[1];

      if (name === 'help') {
        print('Commands:');
        HELP.forEach(function (item) {
          print('  ' + pad(item[0], 13) + item[1]);
        });
        print('The commands above each section work too, like git log.');
        return false;
      }
      if (name === 'clear') {
        log.textContent = '';
        return false;
      }
      if (name === 'top') {
        print('Doriano Ponzo, Senior Software Developer at EOS Online (So Smart).');
        go('top');
        return true;
      }
      if (name === 'hire') {
        print("Let's connect.");
        go('contact');
        return true;
      }
      if (SECTIONS[name]) {
        print('Going to ' + SECTIONS[name] + '.');
        go(name);
        return true;
      }
      if (LINKS[name]) {
        openLink(name);
        return false;
      }
      if (cmd === 'theme') {
        if (arg && arg !== 'light' && arg !== 'dark') {
          print('Usage: theme, theme light or theme dark.');
        } else {
          setTheme(arg);
        }
        return false;
      }
      print('Command not found: ' + line + '. Type help for the list.');
      return false;
    }

    /* --- History and completion --- */
    var history = [];
    var position = 0;

    function commonPrefix(list) {
      var prefix = list[0];
      list.forEach(function (item) {
        while (item.indexOf(prefix) !== 0) prefix = prefix.slice(0, -1);
      });
      return prefix;
    }

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        var value = input.value;
        if (value.trim()) {
          history.push(value.trim());
          position = history.length;
        }
        var scrolled = run(value);
        input.value = '';
        if (!scrolled) row.scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'ArrowUp') {
        if (!history.length) return;
        event.preventDefault();
        position = Math.max(0, position - 1);
        input.value = history[position];
      } else if (event.key === 'ArrowDown') {
        if (!history.length) return;
        event.preventDefault();
        position = Math.min(history.length, position + 1);
        input.value = position === history.length ? '' : history[position];
      } else if (event.key === 'Escape') {
        input.value = '';
      } else if (event.key === 'Tab' && !event.shiftKey && input.value) {
        var typed = input.value.toLowerCase();
        var matches = NAMES.filter(function (name) { return name.indexOf(typed) === 0; });
        if (!matches.length) return;
        var completed = commonPrefix(matches);
        /* Only take the key when it completes something, so Tab never traps the keyboard */
        if (completed.length > typed.length) {
          event.preventDefault();
          input.value = completed;
        }
      }
    });
  }

  /* ---------- Footer year ---------- */

  function initYear() {
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
      el.textContent = year;
    });
  }

  initThemeToggle();
  initMenu();
  initActiveSection();
  initStream();
  initHighlight();
  initTypedPrompts();
  initLogDraw();
  initShell();
  initYear();
})();
