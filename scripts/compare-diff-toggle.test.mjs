/**
 * Tests for the "Show differences only" toggle on compare.html (issue #65).
 *
 * js/main.js is browser code with no module boundary: one big
 * DOMContentLoaded closure. To test it we run the real file in a vm against a
 * DOM stub that implements only what main.js actually touches. That keeps the
 * production code framework-free (CLAUDE.md) while still exercising the real
 * render path rather than a copy of it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAIN_JS = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

/* ============================================================ DOM stub == */

class StubClassList {
  constructor() {
    this._set = new Set();
  }
  add(...cs) {
    for (const c of cs) this._set.add(c);
  }
  remove(...cs) {
    for (const c of cs) this._set.delete(c);
  }
  toggle(c) {
    if (this._set.has(c)) this._set.delete(c);
    else this._set.add(c);
  }
  contains(c) {
    return this._set.has(c);
  }
}

class StubElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.classList = new StubClassList();
    this.dataset = {};
    this.style = {};
    this.className = '';
    this.id = '';
    this.type = '';
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this._attrs = {};
    this._listeners = new Map();
    this._html = '';
  }

  get innerHTML() {
    return this._html;
  }

  set innerHTML(v) {
    this._html = String(v);
    this.children = parseChildren(this._html);
    for (const c of this.children) c.parentNode = this;
  }

  setAttribute(name, value) {
    this._attrs[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this._attrs, name) ? this._attrs[name] : null;
  }

  appendChild(el) {
    el.parentNode = this;
    this.children.push(el);
    return el;
  }

  insertBefore(el, ref) {
    const i = this.children.indexOf(ref);
    el.parentNode = this;
    if (i === -1) this.children.push(el);
    else this.children.splice(i, 0, el);
    return el;
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }

  /** Test-side helper: fire a listener registered via addEventListener. */
  dispatch(type) {
    const event = { type, target: this, preventDefault() {}, stopPropagation() {} };
    for (const fn of this._listeners.get(type) || []) fn(event);
  }

  querySelectorAll(sel) {
    return descendants(this).filter((el) => matches(el, sel));
  }

  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }

  contains(el) {
    return el === this || descendants(this).includes(el);
  }
}

function descendants(el) {
  const out = [];
  for (const child of el.children) {
    out.push(child);
    out.push(...descendants(child));
  }
  return out;
}

/** Supports the simple selectors main.js actually uses; others match nothing. */
function matches(el, sel) {
  if (/^\.[A-Za-z0-9_-]+$/.test(sel)) {
    const cls = sel.slice(1);
    return el.className.split(/\s+/).includes(cls) || el.classList.contains(cls);
  }
  if (/^#[A-Za-z0-9_-]+$/.test(sel)) return el.id === sel.slice(1);
  if (/^[a-z]+$/.test(sel)) return el.tagName === sel.toUpperCase();
  return false;
}

/**
 * Rebuild the handful of elements main.js re-queries after writing innerHTML.
 * Only the compare-slot controls need to survive the string round-trip; the
 * table is asserted on as markup.
 */
function parseChildren(html) {
  const out = [];

  for (const m of html.matchAll(/<select class="compare-select" data-slot="(\d+)">([\s\S]*?)<\/select>/g)) {
    const el = new StubElement('select');
    el.className = 'compare-select';
    el.dataset.slot = m[1];
    const selected = m[2].match(/<option value="([^"]*)" selected>/);
    el.value = selected ? selected[1] : '';
    out.push(el);
  }

  for (const m of html.matchAll(/<button class="compare-remove-btn" data-slot="(\d+)"/g)) {
    const el = new StubElement('button');
    el.className = 'compare-remove-btn';
    el.dataset.slot = m[1];
    out.push(el);
  }

  if (html.includes('id="add-board-btn"')) {
    const el = new StubElement('button');
    el.className = 'compare-add-btn';
    el.id = 'add-board-btn';
    out.push(el);
  }

  return out;
}

/* ======================================================== page harness == */

/** Boot js/main.js against a stub of compare.html and return test handles. */
function loadComparePage() {
  const body = new StubElement('body');
  const container = new StubElement('div');
  body.appendChild(container);

  const compareSlots = new StubElement('div');
  compareSlots.id = 'compare-slots';
  compareSlots.className = 'compare-slots fade-in';

  const compareTableWrap = new StubElement('div');
  compareTableWrap.id = 'compare-table-wrap';
  compareTableWrap.className = 'compare-table-wrap fade-in';

  container.appendChild(compareSlots);
  container.appendChild(compareTableWrap);

  const domReady = [];
  const document = {
    body,
    addEventListener(type, fn) {
      if (type === 'DOMContentLoaded') domReady.push(fn);
    },
    createElement(tag) {
      return new StubElement(tag);
    },
    getElementById(id) {
      return descendants(body).find((el) => el.id === id) || null;
    },
    querySelector(sel) {
      return body.querySelector(sel);
    },
    querySelectorAll(sel) {
      return body.querySelectorAll(sel);
    }
  };

  const window = {
    addEventListener() {},
    scrollTo() {},
    scrollY: 0,
    location: { pathname: '/compare.html', search: '', href: 'https://motherboardcentral.com/compare.html' }
  };

  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const context = vm.createContext({
    document,
    window,
    history: { pushState() {} },
    IntersectionObserver,
    URLSearchParams,
    console
  });

  vm.runInContext(MAIN_JS, context, { filename: 'js/main.js' });
  for (const fn of domReady) fn();

  const api = {
    document,
    compareSlots,
    compareTableWrap,
    tableHtml: () => compareTableWrap.innerHTML,
    toggleInput: () => document.getElementById('compare-diff-only'),
    toggleWrap: () => document.getElementById('compare-diff-toggle'),
    selectBoard(slot, boardIndex) {
      const select = compareSlots
        .querySelectorAll('.compare-select')
        .find((el) => el.dataset.slot === String(slot));
      assert.ok(select, `no select for slot ${slot}`);
      select.value = String(boardIndex);
      select.dispatch('change');
    },
    setDifferencesOnly(on) {
      const input = api.toggleInput();
      assert.ok(input, 'differences-only toggle is missing');
      input.checked = on;
      input.dispatch('change');
    }
  };
  return api;
}

/** Spec labels currently rendered as rows in the comparison table. */
function renderedRowLabels(html) {
  return [...html.matchAll(/<tr><td>([^<]+)<\/td>/g)].map((m) => m[1]);
}

/* Two AM5 B650 ATX boards that differ only in Brand, M.2 Slots and Power
   Phases - the exact "same chipset family" case the issue describes. */
const GIGABYTE_B650_ELITE = 2;
const MSI_B650_TOMAHAWK = 42;
const SHARED_ROWS = [
  'Socket',
  'Chipset',
  'Form Factor',
  'RAM Type',
  'RAM Slots',
  'Max RAM',
  'PCIe Slots',
  'SATA Ports',
  'Rear USB',
  'WiFi',
  'Bluetooth',
  'LAN',
  'Audio Codec',
  'Rating'
];
const DIFFERING_ROWS = ['Brand', 'M.2 Slots', 'Power Phases'];

/* ================================================================ tests == */

test('the compare page fixture selects the two boards under test', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);

  assert.match(page.tableHtml(), /GIGABYTE B650 AORUS Elite AX/);
  assert.match(page.tableHtml(), /MSI MAG B650 Tomahawk WiFi/);
});

test('a labelled differences-only toggle sits directly above the table', () => {
  const page = loadComparePage();

  const wrap = page.toggleWrap();
  const input = page.toggleInput();
  assert.ok(wrap, 'expected a #compare-diff-toggle container');
  assert.ok(input, 'expected a #compare-diff-only control');
  assert.equal(input.type, 'checkbox', 'a checkbox is keyboard operable by default');
  assert.equal(input.checked, false, 'default state is off');

  const label = wrap.querySelector('label');
  assert.ok(label, 'expected a <label> for the screen-reader name');
  assert.equal(label.getAttribute('for'), 'compare-diff-only');
  assert.match(label.textContent, /Show differences only/i);

  const siblings = page.compareTableWrap.parentNode.children;
  assert.equal(
    siblings.indexOf(wrap) + 1,
    siblings.indexOf(page.compareTableWrap),
    'toggle must be the element immediately above the table'
  );
});

test('with the toggle on, rows shared by every selected board are hidden', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);
  page.setDifferencesOnly(true);

  const labels = renderedRowLabels(page.tableHtml());
  for (const row of SHARED_ROWS) {
    assert.ok(!labels.includes(row), `${row} is identical and should be hidden`);
  }
});

test('with the toggle on, rows that differ on any board remain', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);
  page.setDifferencesOnly(true);

  const labels = renderedRowLabels(page.tableHtml());
  for (const row of DIFFERING_ROWS) {
    assert.ok(labels.includes(row), `${row} differs and should stay visible`);
  }
});

test('with the toggle off the full table renders unchanged', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);

  const labels = renderedRowLabels(page.tableHtml());
  for (const row of [...SHARED_ROWS, ...DIFFERING_ROWS, 'Price']) {
    assert.ok(labels.includes(row), `${row} should be present with the toggle off`);
  }
});

test('the toggle survives a selection change and re-evaluates against it', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);
  page.setDifferencesOnly(true);

  assert.ok(!renderedRowLabels(page.tableHtml()).includes('Chipset'));

  // Swap in a board from a different socket and chipset.
  page.selectBoard(1, 0); // ASUS ROG Maximus Z790 Hero

  assert.equal(page.toggleInput().checked, true, 'toggle state must survive re-render');
  const labels = renderedRowLabels(page.tableHtml());
  assert.ok(labels.includes('Chipset'), 'Chipset now differs and must reappear');
  assert.ok(labels.includes('Socket'), 'Socket now differs and must reappear');
});

test('the toggle is hidden and disabled until two boards are selected', () => {
  const page = loadComparePage();

  assert.equal(page.toggleWrap().hidden, true, 'nothing selected: nothing can differ');
  assert.equal(page.toggleInput().disabled, true);

  page.selectBoard(0, GIGABYTE_B650_ELITE);
  assert.equal(page.toggleWrap().hidden, true, 'one board selected: still nothing to differ');
  assert.equal(page.toggleInput().disabled, true);

  page.selectBoard(1, MSI_B650_TOMAHAWK);
  assert.equal(page.toggleWrap().hidden, false, 'two boards selected: toggle is usable');
  assert.equal(page.toggleInput().disabled, false);
});

test('an honest message replaces the table when every row matches', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, GIGABYTE_B650_ELITE);
  page.setDifferencesOnly(true);

  const html = page.tableHtml();
  assert.ok(!html.includes('<table'), 'no empty table should be rendered');
  assert.match(html, /match on every specification/i);
});

test('winner highlighting still works with the toggle on', () => {
  const page = loadComparePage();
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);

  assert.match(page.tableHtml(), /class="highlight"/, 'baseline: highlighting with toggle off');

  page.setDifferencesOnly(true);
  const html = page.tableHtml();
  // M.2 Slots: 3x M.2 beats 2x M.2, so the second column wins that row.
  assert.match(html, /<tr><td>M\.2 Slots<\/td><td>2x M\.2<\/td><td class="highlight">3x M\.2<\/td><\/tr>/);
});

test('an empty third slot does not count as a differing value', () => {
  const page = loadComparePage();
  page.compareSlots.querySelector('.compare-add-btn').dispatch('click');
  page.selectBoard(0, GIGABYTE_B650_ELITE);
  page.selectBoard(1, MSI_B650_TOMAHAWK);
  page.setDifferencesOnly(true);

  const labels = renderedRowLabels(page.tableHtml());
  assert.ok(
    !labels.includes('Socket'),
    'the "--" of an unfilled slot must not keep an otherwise identical row on screen'
  );
  assert.ok(labels.includes('M.2 Slots'), 'genuinely differing rows still show');
});

test('the toggle stylesheet does not defeat the hidden attribute', () => {
  // A `display` declaration on the container beats the UA's [hidden] rule, so
  // the JS that hides the toggle below two boards would silently stop working.
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

  const rule = css.match(/\.compare-diff-toggle\s*\{([^}]*)\}/);
  assert.ok(rule, 'expected a .compare-diff-toggle rule in css/style.css');

  if (/display\s*:/.test(rule[1])) {
    const hiddenRule = css.match(/\.compare-diff-toggle\[hidden\]\s*\{([^}]*)\}/);
    assert.ok(hiddenRule, '.compare-diff-toggle sets display, so it needs a [hidden] override');
    assert.match(hiddenRule[1], /display\s*:\s*none/);
  }
});

test('the toggle is not created on pages without a comparison table', () => {
  // Guards the site-wide blast radius: main.js runs on every page.
  const body = new StubElement('body');
  const domReady = [];
  const document = {
    body,
    addEventListener(type, fn) {
      if (type === 'DOMContentLoaded') domReady.push(fn);
    },
    createElement: (tag) => new StubElement(tag),
    getElementById: (id) => descendants(body).find((el) => el.id === id) || null,
    querySelector: (sel) => body.querySelector(sel),
    querySelectorAll: (sel) => body.querySelectorAll(sel)
  };
  const context = vm.createContext({
    document,
    window: {
      addEventListener() {},
      scrollTo() {},
      scrollY: 0,
      location: { pathname: '/index.html', search: '', href: 'https://motherboardcentral.com/' }
    },
    history: { pushState() {} },
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    URLSearchParams,
    console
  });

  vm.runInContext(MAIN_JS, context, { filename: 'js/main.js' });
  for (const fn of domReady) fn();

  assert.equal(document.getElementById('compare-diff-toggle'), null);
});
