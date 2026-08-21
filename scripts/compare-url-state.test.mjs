/**
 * Tests for shareable compare URLs on compare.html (issue #38).
 *
 * js/main.js is browser code with no module boundary: one big
 * DOMContentLoaded closure. To test it we run the real file in a vm against a
 * DOM stub that implements only what main.js actually touches. That keeps the
 * production code framework-free (CLAUDE.md) while still exercising the real
 * load/render path rather than a copy of it.
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

/**
 * Boot js/main.js against a stub of compare.html at the given query string.
 *
 * `history.replaceState` writes back into `window.location`, the way a real
 * browser does, so a test can assert on the URL a reader would copy.
 */
function loadComparePage(search = '', { mainJs = MAIN_JS, withReplaceState = true } = {}) {
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
    location: {
      pathname: '/compare.html',
      search,
      hash: '',
      href: 'https://motherboardcentral.com/compare.html' + search
    }
  };

  const replaceStateCalls = [];
  const pushStateCalls = [];
  const history = {
    pushState(state, title, url) {
      pushStateCalls.push(url);
    }
  };
  if (withReplaceState) {
    history.replaceState = function (state, title, url) {
      replaceStateCalls.push(url);
      const q = String(url).indexOf('?');
      window.location.search = q === -1 ? '' : String(url).slice(q);
      window.location.href = 'https://motherboardcentral.com' + url;
    };
  }

  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const context = vm.createContext({
    document,
    window,
    history,
    IntersectionObserver,
    URLSearchParams,
    console
  });

  vm.runInContext(mainJs, context, { filename: 'js/main.js' });
  for (const fn of domReady) fn();

  const api = {
    document,
    window,
    compareSlots,
    compareTableWrap,
    replaceStateCalls,
    pushStateCalls,
    url: () => window.location.pathname + window.location.search,
    tableHtml: () => compareTableWrap.innerHTML,
    slotsHtml: () => compareSlots.innerHTML,
    /** The board index shown in each rendered slot, null for an empty slot. */
    slotSelection() {
      return compareSlots.querySelectorAll('.compare-select').map((el) => (el.value === '' ? null : Number(el.value)));
    },
    selectBoard(slot, boardIndex) {
      const select = compareSlots
        .querySelectorAll('.compare-select')
        .find((el) => el.dataset.slot === String(slot));
      assert.ok(select, `no select for slot ${slot}`);
      select.value = boardIndex === null ? '' : String(boardIndex);
      select.dispatch('change');
    },
    removeSlot(slot) {
      const btn = compareSlots
        .querySelectorAll('.compare-remove-btn')
        .find((el) => el.dataset.slot === String(slot));
      assert.ok(btn, `no remove button for slot ${slot}`);
      btn.dispatch('click');
    },
    addSlot() {
      const btn = compareSlots.querySelector('.compare-add-btn');
      assert.ok(btn, 'no add-board button');
      btn.dispatch('click');
    }
  };
  return api;
}

/** The `boards` value of the current URL, or null when the param is absent. */
function boardsParam(page) {
  const m = page.window.location.search.match(/[?&]boards=([^&]*)/);
  return m ? m[1] : null;
}

/* Board names and their indexes in motherboardDatabase (js/main.js). Indexes
   are used only to drive the UI; the URL must never contain them. */
const ASUS_ROG_MAXIMUS_Z790_HERO = 0;
const MSI_MAG_B760_TOMAHAWK_WIFI = 1;
const GIGABYTE_B650_AORUS_ELITE_AX = 2;
const MSI_MAG_B650_TOMAHAWK_WIFI = 42;

const SLUG_Z790_HERO = 'asus-rog-maximus-z790-hero';
const SLUG_B760_TOMAHAWK = 'msi-mag-b760-tomahawk-wifi';
const SLUG_B650_ELITE = 'gigabyte-b650-aorus-elite-ax';
const SLUG_B650_TOMAHAWK = 'msi-mag-b650-tomahawk-wifi';

/** Every board name in motherboardDatabase, in array order. */
function databaseNames() {
  const block = MAIN_JS.slice(MAIN_JS.indexOf('const motherboardDatabase = ['));
  return [...block.matchAll(/^\s+name: '([^']*)'/gm)].map((m) => m[1]);
}

/* ================================================================ tests == */

test('?boards= preselects the named boards on load, in order', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE},${SLUG_B650_TOMAHAWK}`);

  assert.deepEqual(page.slotSelection(), [GIGABYTE_B650_AORUS_ELITE_AX, MSI_MAG_B650_TOMAHAWK_WIFI]);
  assert.match(page.tableHtml(), /GIGABYTE B650 AORUS Elite AX/);
  assert.match(page.tableHtml(), /MSI MAG B650 Tomahawk WiFi/);
});

test('order in the URL is the order of the columns', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_TOMAHAWK},${SLUG_B650_ELITE}`);

  assert.deepEqual(page.slotSelection(), [MSI_MAG_B650_TOMAHAWK_WIFI, GIGABYTE_B650_AORUS_ELITE_AX]);
  const headers = [...page.tableHtml().matchAll(/<th>([^<]*)<\/th>/g)].map((m) => m[1]);
  assert.deepEqual(headers, ['Specification', 'MSI MAG B650 Tomahawk WiFi', 'GIGABYTE B650 AORUS Elite AX']);
});

test('a single slug still renders the default two slots', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE}`);

  assert.deepEqual(page.slotSelection(), [GIGABYTE_B650_AORUS_ELITE_AX, null]);
});

test('a leading empty slug preserves the column it was written for', () => {
  const page = loadComparePage(`?boards=,${SLUG_B650_ELITE}`);

  assert.deepEqual(page.slotSelection(), [null, GIGABYTE_B650_AORUS_ELITE_AX]);
});

test('more than five slugs are truncated to the five-slot maximum', () => {
  const eight = [
    SLUG_Z790_HERO,
    SLUG_B760_TOMAHAWK,
    SLUG_B650_ELITE,
    'asus-rog-strix-x670e-e-gaming-wifi',
    'asus-tuf-gaming-b760-plus-wifi-d4',
    'asrock-b760m-pro-rs-d4',
    'msi-pro-b650-p-wifi',
    'gigabyte-x670e-aorus-master'
  ];
  const page = loadComparePage(`?boards=${eight.join(',')}`);

  assert.equal(page.slotSelection().length, 5);
  assert.deepEqual(page.slotSelection().slice(0, 3), [
    ASUS_ROG_MAXIMUS_Z790_HERO,
    MSI_MAG_B760_TOMAHAWK_WIFI,
    GIGABYTE_B650_AORUS_ELITE_AX
  ]);
  assert.ok(!page.slotsHtml().includes('id="add-board-btn"'), 'five slots is the maximum');
});

test('an unknown slug degrades to an empty slot rather than erroring', () => {
  const page = loadComparePage('?boards=nonsense');

  assert.deepEqual(page.slotSelection(), [null, null]);
  assert.match(page.tableHtml(), /Select motherboards above/);
});

test('a misspelled slug leaves its neighbours intact', () => {
  const page = loadComparePage(`?boards=gigabyte-b650-aorus-elite-ax-typo,${SLUG_B650_TOMAHAWK}`);

  assert.deepEqual(page.slotSelection(), [null, MSI_MAG_B650_TOMAHAWK_WIFI]);
});

test('a repeated slug degrades to an empty slot', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE},${SLUG_B650_ELITE}`);

  assert.deepEqual(page.slotSelection(), [GIGABYTE_B650_AORUS_ELITE_AX, null]);
});

test('an empty ?boards= behaves exactly as no query string does', () => {
  const empty = loadComparePage('?boards=');
  const none = loadComparePage('');

  assert.deepEqual(empty.slotSelection(), [null, null]);
  assert.equal(empty.slotsHtml(), none.slotsHtml());
  assert.equal(empty.tableHtml(), none.tableHtml());
});

test('no query string renders two empty slots and the placeholder', () => {
  const page = loadComparePage('');

  assert.deepEqual(page.slotSelection(), [null, null]);
  assert.match(page.tableHtml(), /Select motherboards above to compare specifications side-by-side/);
});

test('loading a bare compare.html does not rewrite the URL', () => {
  const page = loadComparePage('');

  assert.deepEqual(page.replaceStateCalls, [], 'nothing has changed yet, so nothing to record');
  assert.equal(page.window.location.search, '');
});

test('selecting a board writes its slug to the URL', () => {
  const page = loadComparePage('');
  page.selectBoard(0, GIGABYTE_B650_AORUS_ELITE_AX);

  assert.equal(boardsParam(page), SLUG_B650_ELITE);
  assert.equal(page.url(), `/compare.html?boards=${SLUG_B650_ELITE}`);
});

test('the URL updates without a reload and without new history entries', () => {
  const page = loadComparePage('');
  page.selectBoard(0, GIGABYTE_B650_AORUS_ELITE_AX);
  page.selectBoard(1, MSI_MAG_B650_TOMAHAWK_WIFI);

  assert.equal(page.replaceStateCalls.length, 2, 'one replaceState per change');
  assert.deepEqual(page.pushStateCalls, [], 'no history entry per selection');
  assert.equal(boardsParam(page), `${SLUG_B650_ELITE},${SLUG_B650_TOMAHAWK}`);
});

test('commas in the shared link are left literal, not percent-encoded', () => {
  const page = loadComparePage('');
  page.selectBoard(0, GIGABYTE_B650_AORUS_ELITE_AX);
  page.selectBoard(1, MSI_MAG_B650_TOMAHAWK_WIFI);

  assert.ok(!page.window.location.search.includes('%2C'), page.window.location.search);
});

test('an empty leading slot is held open in the URL', () => {
  const page = loadComparePage('');
  page.selectBoard(1, MSI_MAG_B650_TOMAHAWK_WIFI);

  assert.equal(boardsParam(page), `,${SLUG_B650_TOMAHAWK}`);
});

test('clearing every slot removes the parameter instead of leaving it empty', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE}`);
  page.selectBoard(0, null);

  assert.equal(boardsParam(page), null);
  assert.equal(page.url(), '/compare.html');
});

test('removing a slot updates the URL', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE},${SLUG_B650_TOMAHAWK},${SLUG_Z790_HERO}`);
  page.removeSlot(0);

  assert.equal(boardsParam(page), `${SLUG_B650_TOMAHAWK},${SLUG_Z790_HERO}`);
});

test('adding an empty slot leaves the shared boards unchanged', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE},${SLUG_B650_TOMAHAWK}`);
  page.addSlot();

  assert.equal(page.slotSelection().length, 3);
  assert.equal(boardsParam(page), `${SLUG_B650_ELITE},${SLUG_B650_TOMAHAWK}`);
});

test('the URL round-trips: what a change writes, a fresh load reads back', () => {
  const first = loadComparePage('');
  first.addSlot();
  first.selectBoard(0, GIGABYTE_B650_AORUS_ELITE_AX);
  first.selectBoard(2, MSI_MAG_B650_TOMAHAWK_WIFI);

  const second = loadComparePage(first.window.location.search);
  assert.deepEqual(second.slotSelection(), first.slotSelection());
});

test('other query parameters survive a selection change', () => {
  const page = loadComparePage('?utm_source=forum');
  page.selectBoard(0, GIGABYTE_B650_AORUS_ELITE_AX);

  assert.match(page.window.location.search, /utm_source=forum/);
  assert.equal(boardsParam(page), SLUG_B650_ELITE);
});

test('a stale ?boards= is replaced, not appended to', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE}`);
  page.selectBoard(0, MSI_MAG_B650_TOMAHAWK_WIFI);

  const occurrences = page.window.location.search.match(/boards=/g) || [];
  assert.equal(occurrences.length, 1);
  assert.equal(boardsParam(page), SLUG_B650_TOMAHAWK);
});

test('slugs are derived from the board name, not its array index', () => {
  // The issue's own regression check: adding a board must not shift any
  // existing shared link. Prepend a dummy entry and reload the same URL.
  const shifted = MAIN_JS.replace(
    'const motherboardDatabase = [\n{',
    "const motherboardDatabase = [\n{ name: 'DUMMY Test Board X999', brand: 'DUMMY', socket: 'AM5', chipset: 'X999', formFactor: 'ATX', ramType: 'DDR5', ramSlots: 4, maxRam: '192GB', pcieSlots: '1x PCIe 5.0 x16', m2Slots: '4x M.2', sataPortsCount: 4, usbRearPorts: '10x USB', wifi: 'WiFi 7', bluetooth: 'BT 5.4', lan: '2.5G', audioCodec: 'ALC4080', powerPhases: '16+2+2', rating: 4.0, amazonSearch: 'dummy' },\n{"
  );
  assert.notEqual(shifted, MAIN_JS, 'fixture must actually prepend a board');

  const page = loadComparePage(`?boards=${SLUG_B650_ELITE},${SLUG_B650_TOMAHAWK}`, { mainJs: shifted });

  assert.deepEqual(page.slotSelection(), [
    GIGABYTE_B650_AORUS_ELITE_AX + 1,
    MSI_MAG_B650_TOMAHAWK_WIFI + 1
  ], 'indexes shift by one, so a link that still resolves proves slugs are name-derived');
  const headers = [...page.tableHtml().matchAll(/<th>([^<]*)<\/th>/g)].map((m) => m[1]);
  assert.deepEqual(headers, ['Specification', 'GIGABYTE B650 AORUS Elite AX', 'MSI MAG B650 Tomahawk WiFi']);
});

/**
 * Every board's slug, read back out of the real URL writer: select the board
 * into slot 0 and see what lands in `?boards=`.
 */
function allSlugs() {
  const page = loadComparePage('');
  return databaseNames().map((_name, index) => {
    page.selectBoard(0, index);
    return boardsParam(page);
  });
}

test('every board slug matches the published review-page filename', () => {
  // The slug is meant to be reusable for cross-linking, so it has to be the
  // same string the review page is already published under.
  const names = databaseNames();
  assert.ok(names.length > 60, `expected the full database, got ${names.length} boards`);

  const missing = allSlugs()
    .map((slug, i) => ({ slug, name: names[i] }))
    .filter(({ slug }) => !fs.existsSync(path.join(ROOT, `review-${slug}.html`)))
    .map(({ name, slug }) => `${name} -> review-${slug}.html`);

  assert.deepEqual(missing, [], 'slugs must match the published review-page filenames');
});

test('board slugs are unique across the whole database', () => {
  const slugs = allSlugs();

  assert.equal(new Set(slugs).size, slugs.length, 'a collision would make one board unshareable');
});

test('slugs are URL-safe: lowercase letters, digits and hyphens only', () => {
  for (const slug of allSlugs()) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, slug);
  }
});

test('the compare page still works where history.replaceState is unavailable', () => {
  const page = loadComparePage(`?boards=${SLUG_B650_ELITE}`, { withReplaceState: false });
  page.selectBoard(1, MSI_MAG_B650_TOMAHAWK_WIFI);

  assert.deepEqual(page.slotSelection(), [GIGABYTE_B650_AORUS_ELITE_AX, MSI_MAG_B650_TOMAHAWK_WIFI]);
  assert.match(page.tableHtml(), /MSI MAG B650 Tomahawk WiFi/);
});

test('pages without a comparison table never touch the URL', () => {
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
  const replaceStateCalls = [];
  const context = vm.createContext({
    document,
    window: {
      addEventListener() {},
      scrollTo() {},
      scrollY: 0,
      location: {
        pathname: '/index.html',
        search: '?boards=nonsense',
        hash: '',
        href: 'https://motherboardcentral.com/'
      }
    },
    history: {
      pushState() {},
      replaceState(state, title, url) {
        replaceStateCalls.push(url);
      }
    },
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

  assert.deepEqual(replaceStateCalls, []);
});
