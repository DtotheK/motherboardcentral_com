import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

/* js/main.js is a plain browser script, not a module. Run it in a sandbox with
   a stub document so the glossary API it hangs on `window` can be tested. */

const ROOT = new URL('../', import.meta.url);
const SRC = readFileSync(new URL('js/main.js', ROOT), 'utf8');

function loadGlossary(doc, win) {
  doc = doc || { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] };
  win = win || { addEventListener() {} };
  win.document = doc;
  const ctx = { window: win, document: doc, console };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return ctx.window.MBCGlossary;
}

const G = loadGlossary();

/* ----------------------------------------------------------- dictionary -- */

test('exposes a glossary API on window', () => {
  assert.equal(typeof G, 'object');
  assert.ok(Array.isArray(G.TERMS));
  assert.ok(G.TERMS.length > 0);
});

test('every term has an id, a label, a pattern and a definition', () => {
  for (const t of G.TERMS) {
    assert.match(t.id, /^[a-z0-9-]+$/, `bad id: ${t.id}`);
    assert.ok(t.label && t.label.length > 0, `no label: ${t.id}`);
    // Sandbox regexes come from another realm, so instanceof will not do.
    assert.equal(Object.prototype.toString.call(t.pattern), '[object RegExp]', `no pattern: ${t.id}`);
    assert.ok(t.definition && t.definition.length > 0, `no definition: ${t.id}`);
  }
});

test('term ids are unique', () => {
  const ids = G.TERMS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('definitions are one or two plain sentences', () => {
  for (const t of G.TERMS) {
    const sentences = t.definition.match(/[.!?](?=\s|$)/g) || [];
    assert.ok(
      sentences.length >= 1 && sentences.length <= 2,
      `${t.id} has ${sentences.length} sentences: ${t.definition}`,
    );
  }
});

test('guide links point at a page and anchor that exist', () => {
  for (const t of G.TERMS) {
    if (!t.guide) continue;
    const [file, anchor] = t.guide.split('#');
    const path = fileURLToPath(new URL(file, ROOT));
    assert.ok(existsSync(path), `${t.id} links to missing page ${file}`);
    if (anchor) {
      assert.ok(
        readFileSync(path, 'utf8').includes(`id="${anchor}"`),
        `${t.id} links to missing anchor #${anchor} in ${file}`,
      );
    }
    assert.ok(t.guideLabel, `${t.id} has a guide but no link text`);
  }
});

/* ------------------------------------------------------------- annotate -- */

test('marks a known term inside cell text', () => {
  const html = G.annotate('VRM & Power Delivery');
  assert.match(html, /class="glossary-term"/);
  assert.match(html, />VRM</);
});

test('returns null when the text holds no known term', () => {
  assert.equal(G.annotate('4'), null);
  assert.equal(G.annotate('Rear USB'), null);
});

test('escapes HTML in the text it passes through', () => {
  const html = G.annotate('DDR5 <b>&</b>');
  assert.match(html, /&lt;b&gt;&amp;&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>/);
});

test('marks a power phase count', () => {
  const html = G.annotate('14+2+1');
  assert.match(html, />14\+2\+1</);
});

test('marks a Realtek audio codec number', () => {
  assert.match(G.annotate('ALC897'), />ALC897</);
  assert.match(G.annotate('ALC4082'), />ALC4082</);
});

test('marks only the first occurrence of a term in one cell', () => {
  const html = G.annotate('M.2 heatsink over the second M.2 slot');
  assert.equal((html.match(/class="glossary-term"/g) || []).length, 1);
});

test('does not mark a term that is only part of a longer token', () => {
  assert.equal(G.annotate('up to 128GB'), null);
});

test('prefers the longest match, so Micro-ATX is not marked as ATX', () => {
  const html = G.annotate('Micro-ATX');
  assert.match(html, />Micro-ATX</);
  assert.equal((html.match(/class="glossary-term"/g) || []).length, 1);
});

test('does not mark a term that follows a hyphen, so E-ATX is left alone', () => {
  assert.equal(G.annotate('E-ATX'), null);
});

test('marks each term once when a cell holds several', () => {
  const html = G.annotate('DDR5, 4 DIMM slots, up to 128GB');
  assert.equal((html.match(/class="glossary-term"/g) || []).length, 1);
  const two = G.annotate('1x PCIe 5.0 x16 and 3x M.2');
  assert.equal((two.match(/class="glossary-term"/g) || []).length, 2);
});

test('ends the tooltip with a guide link when a guide exists', () => {
  const html = G.annotate('3x M.2');
  assert.match(html, /href="guide-storage\.html#m2-nvme"/);
});

test('omits the guide link for terms with no matching guide', () => {
  const html = G.annotate('ALC897');
  assert.doesNotMatch(html, /<a /);
});

test('wires the term to its tooltip for screen readers', () => {
  const html = G.annotate('VRM');
  const described = html.match(/aria-describedby="([^"]+)"/);
  assert.ok(described, 'no aria-describedby');
  assert.ok(html.includes(`id="${described[1]}"`), 'tooltip id does not match');
  assert.match(html, /role="tooltip"/);
});

test('gives every marked term a unique tooltip id', () => {
  const a = G.annotate('VRM').match(/aria-describedby="([^"]+)"/)[1];
  const b = G.annotate('VRM').match(/aria-describedby="([^"]+)"/)[1];
  assert.notEqual(a, b);
});

test('marks the term as a real button so it is keyboard reachable', () => {
  const html = G.annotate('VRM');
  assert.match(html, /<button type="button"[^>]*class="glossary-term"/);
  assert.match(html, /aria-expanded="false"/);
});

/* ------------------------------------------------------------ placement -- */

/* Spec tables clip their overflow, so the tooltip is positioned against the
   viewport rather than the cell. */

const VIEW = { width: 1000, height: 800 };
const TIP = { width: 300, height: 100 };
const anchor = (left, top) => ({ left, top, right: left + 40, bottom: top + 20, width: 40, height: 20 });

test('centres the tooltip under the term', () => {
  const pos = G.tipPosition(anchor(500, 300), TIP, VIEW);
  assert.equal(pos.left, 500 + 20 - 150);
  assert.ok(pos.top > 320, 'sits below the term');
});

test('clamps the tooltip to the left edge of the viewport', () => {
  const pos = G.tipPosition(anchor(5, 300), TIP, VIEW);
  assert.ok(pos.left >= 0, `left edge overflow: ${pos.left}`);
});

test('clamps the tooltip to the right edge of the viewport', () => {
  const pos = G.tipPosition(anchor(960, 300), TIP, VIEW);
  assert.ok(pos.left + TIP.width <= VIEW.width, `right edge overflow: ${pos.left}`);
});

test('flips the tooltip above the term when there is no room below', () => {
  const pos = G.tipPosition(anchor(500, 760), TIP, VIEW);
  assert.ok(pos.top + TIP.height <= 760, `overflows the fold: ${pos.top}`);
  assert.ok(pos.top >= 0, 'stays on screen');
});

/* -------------------------------------------------------------- enhance -- */

function stubCell(text, childCount = 0) {
  return {
    textContent: text,
    innerHTML: text,
    children: { length: childCount },
    dataset: {},
  };
}

function stubRoot(cells) {
  return { querySelectorAll: () => cells };
}

test('annotates plain-text cells and marks them done', () => {
  const cell = stubCell('14+2+1');
  const changed = G.enhance(stubRoot([cell]));
  assert.equal(changed, 1);
  assert.match(cell.innerHTML, /class="glossary-term"/);
  assert.equal(cell.dataset.glossary, 'done');
});

test('leaves cells that already contain markup untouched', () => {
  const cell = stubCell('Check Price', 1);
  assert.equal(G.enhance(stubRoot([cell])), 0);
  assert.equal(cell.innerHTML, 'Check Price');
});

test('leaves cells with no known term untouched', () => {
  const cell = stubCell('4');
  assert.equal(G.enhance(stubRoot([cell])), 0);
  assert.equal(cell.innerHTML, '4');
});

test('is idempotent - a second pass changes nothing', () => {
  const cell = stubCell('WiFi 6E');
  assert.equal(G.enhance(stubRoot([cell])), 1);
  const first = cell.innerHTML;
  assert.equal(G.enhance(stubRoot([cell])), 0);
  assert.equal(cell.innerHTML, first);
});

test('targets spec tables and the compare table', () => {
  assert.match(G.CELL_SELECTOR, /\.spec-table td/);
  assert.match(G.CELL_SELECTOR, /\.compare-table/);
});

/* ----------------------------------------------------------- behaviour -- */

/* Just enough DOM to drive the delegated handlers init() installs. */

class FakeEl {
  constructor(className, tagName = 'span') {
    this.tagName = tagName.toUpperCase();
    this.classes = new Set(className.split(' ').filter(Boolean));
    this.attrs = {};
    this.style = {};
    this.childNodes = [];
    this.parentNode = null;
    this.offsetWidth = 300;
    this.offsetHeight = 100;
    this.classList = {
      add: (c) => this.classes.add(c),
      remove: (c) => this.classes.delete(c),
      contains: (c) => this.classes.has(c),
    };
  }
  append(child) {
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  getBoundingClientRect() { return { left: 100, top: 100, right: 140, bottom: 120, width: 40, height: 20 }; }
  matches(sel) {
    return sel.split(',').some((part) => {
      const classes = part.trim().split('.').filter(Boolean);
      return classes.length > 0 && classes.every((c) => this.classes.has(c));
    });
  }
  closest(sel) {
    let node = this;
    while (node) {
      if (node.matches(sel)) return node;
      node = node.parentNode;
    }
    return null;
  }
  querySelector(sel) {
    for (const child of this.childNodes) {
      if (child.matches(sel)) return child;
      const deep = child.querySelector(sel);
      if (deep) return deep;
    }
    return null;
  }
  contains(node) {
    let cur = node;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentNode;
    }
    return false;
  }
}

function page() {
  const wrap = new FakeEl('glossary');
  const term = wrap.append(new FakeEl('glossary-term', 'button'));
  term.setAttribute('aria-expanded', 'false');
  const tip = wrap.append(new FakeEl('glossary-tip'));
  const elsewhere = new FakeEl('paragraph');

  const handlers = {};
  const doc = {
    body: null,                                   // skips the MutationObserver
    activeElement: null,
    documentElement: { clientWidth: 1000, clientHeight: 800 },
    addEventListener(type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
    querySelector: () => null,
    querySelectorAll: (sel) => [wrap].filter((el) => el.matches(sel)),
  };
  const win = { innerWidth: 1000, innerHeight: 800, addEventListener() {} };

  loadGlossary(doc, win).init();

  const fire = (type, event) => (handlers[type] || []).forEach((fn) => fn(event));
  const isOpen = () => wrap.classList.contains('is-open');

  return { wrap, term, tip, elsewhere, fire, isOpen };
}

test('re-runs after the DOM changes, for compare.html\'s rendered table', () => {
  const cells = [stubCell('ALC4082')];
  let observed = null;
  let notify = null;
  const doc = {
    body: {},
    activeElement: null,
    documentElement: { clientWidth: 1000, clientHeight: 800 },
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: (sel) => (/glossary/.test(sel) ? [] : cells),
  };
  const win = {
    innerWidth: 1000,
    innerHeight: 800,
    addEventListener() {},
    setTimeout: (fn) => fn(),
    MutationObserver: function (cb) {
      notify = cb;
      this.observe = (target, opts) => { observed = { target, opts }; };
    },
  };

  loadGlossary(doc, win).init();
  assert.equal(observed.target, doc.body, 'never observed the document');
  assert.equal(observed.opts.subtree, true);

  // A re-render replaces the cells; the observer has to annotate the new ones.
  cells[0] = stubCell('WiFi 6E');
  notify();
  assert.match(cells[0].innerHTML, /class="glossary-term"/);
});

test('hovering a term with a mouse opens its definition', () => {
  const p = page();
  p.fire('pointerover', { pointerType: 'mouse', target: p.term });
  assert.equal(p.isOpen(), true);
  assert.equal(p.term.getAttribute('aria-expanded'), 'true');
  assert.ok(p.tip.style.left, 'tooltip was never positioned');
});

test('hovering away again closes it', () => {
  const p = page();
  p.fire('pointerover', { pointerType: 'mouse', target: p.term });
  p.fire('pointerover', { pointerType: 'mouse', target: p.elsewhere });
  assert.equal(p.isOpen(), false);
  assert.equal(p.term.getAttribute('aria-expanded'), 'false');
});

test('a touch does not trigger the hover path', () => {
  const p = page();
  p.fire('pointerover', { pointerType: 'touch', target: p.term });
  assert.equal(p.isOpen(), false);
});

test('tapping a term opens it and tapping it again closes it', () => {
  const p = page();
  p.fire('click', { target: p.term, detail: 1 });
  assert.equal(p.isOpen(), true);
  p.fire('click', { target: p.term, detail: 1 });
  assert.equal(p.isOpen(), false);
});

test('tapping away closes an open definition', () => {
  const p = page();
  p.fire('click', { target: p.term, detail: 1 });
  p.fire('click', { target: p.elsewhere, detail: 1 });
  assert.equal(p.isOpen(), false);
});

test('tapping inside the tooltip leaves it open, so its link is reachable', () => {
  const p = page();
  p.fire('click', { target: p.term, detail: 1 });
  p.fire('click', { target: p.tip, detail: 1 });
  assert.equal(p.isOpen(), true);
});

test('keyboard focus opens the definition and moving on closes it', () => {
  const p = page();
  p.fire('focusin', { target: p.term });
  assert.equal(p.isOpen(), true);
  p.fire('focusout', { target: p.term, relatedTarget: p.elsewhere });
  assert.equal(p.isOpen(), false);
});

test('tabbing from the term into its tooltip keeps it open', () => {
  const p = page();
  p.fire('focusin', { target: p.term });
  p.fire('focusout', { target: p.term, relatedTarget: p.tip });
  assert.equal(p.isOpen(), true);
});

test('Escape closes an open definition', () => {
  const p = page();
  p.fire('focusin', { target: p.term });
  p.fire('keydown', { key: 'Escape' });
  assert.equal(p.isOpen(), false);
  assert.equal(p.term.getAttribute('aria-expanded'), 'false');
});

test('pressing Enter on a focused term does not close it', () => {
  const p = page();
  p.fire('focusin', { target: p.term });
  p.fire('click', { target: p.term, detail: 0 });   // detail 0 = keyboard activation
  assert.equal(p.isOpen(), true);
});
