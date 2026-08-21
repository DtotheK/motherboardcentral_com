import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../', import.meta.url);
const doc = { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] };
const ctx = { window: { document: doc, addEventListener() {} }, document: doc, console };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('js/main.js', ROOT), 'utf8'), ctx);
const G = ctx.window.MBCGlossary;

for (const page of ['review-msi-mag-b650-tomahawk-wifi.html', 'review-asus-rog-maximus-z890-hero.html', 'guide-ram.html']) {
  const html = readFileSync(new URL(page, ROOT), 'utf8');
  const cells = [...html.matchAll(/<td>([^<]*)<\/td>/g)].map((m) => m[1].trim());
  let marked = 0;
  console.log('\n=== ' + page + ' (' + cells.length + ' plain td cells)');
  for (const c of cells) {
    const out = G.annotate(c);
    if (!out) continue;
    marked++;
    const terms = [...out.matchAll(/class="glossary-term"[^>]*>([^<]*)</g)].map((m) => m[1]);
    console.log('  ' + JSON.stringify(c).padEnd(42) + ' -> ' + terms.join(', '));
  }
  console.log('  marked ' + marked + '/' + cells.length + ' cells');
}

console.log('\n=== sample markup\n' + G.annotate('14+2+1'));
console.log('\n' + G.annotate('1x PCIe 5.0 x16'));
