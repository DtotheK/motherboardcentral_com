/**
 * Board-vs-board pairings (issue #39).
 *
 * Empty on purpose. The generator is ready; the data is not. Before a pair
 * goes in here, every spec row the page will print must have been read off
 * that manufacturer's own spec page -- see the D14 gate in docs/vs-pages.md.
 * "It matches our review" is not verification: the review and the database are
 * the same numbers typed once, so they can agree and both be wrong, and five
 * of five ASUS boards checked in #39 were.
 *
 * Never hand-edit a generated compare-*-vs-*.html. Change this file and run
 * `npm run vs -- --build`; `npm test` fails if a page and this file disagree.
 *
 * Each entry:
 *
 *   {
 *     a: 'gigabyte-b650-aorus-elite-ax',   // slugs, alphabetical order:
 *     b: 'msi-mag-b650-tomahawk-wifi',     // the filename sorts them
 *     verified: {
 *       // one per slug: the manufacturer page the specs were read from,
 *       // and the day someone read it
 *       'gigabyte-b650-aorus-elite-ax': { source: 'https://...', date: '2026-08-22' },
 *       'msi-mag-b650-tomahawk-wifi':   { source: 'https://...', date: '2026-08-22' },
 *     },
 *     intro:    '40-60 words',
 *     glance:   ['three', 'short', 'bullets'],
 *     body:     '150-300 words on what the differences mean in practice',
 *     verdictA: 'Get the first board if...',
 *     verdictB: 'Get the second board if...',
 *   }
 *
 * No spec value may be typed into the prose. Write `{a.m2Slots}`, `{b.lan}`,
 * `{a.name}` and so on: the generator fills those from `motherboardDatabase`,
 * and rejects the pair if it finds a spec-shaped literal instead.
 */

export const pairs = [];
