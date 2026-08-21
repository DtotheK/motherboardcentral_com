// Issue #43 — homepage star ratings disagree with the same boards' review pages.
//
// Sitewide rule, verified across all 70 review-*.html pages: a rating >= 4.6
// draws five filled stars (&#9733; x5); a rating <= 4.5 draws four filled plus
// one outline (&#9733; x4 + &#9734;).
//
// Scoped to index.html on purpose. reviews.html is deliberately NOT asserted
// here: it has a known disagreement of its own (GIGABYTE B650 AORUS Elite AX,
// 4.5, drawn with five filled stars) which issue #43 puts out of scope --
// "No other page is modified -- this is index.html only."

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (name) => readFileSync(join(ROOT, name), 'utf8');

const FILLED = '&#9733;';
const OUTLINE = '&#9734;';
const FIVE_FILLED = FILLED.repeat(5);
const FOUR_PLUS_OUTLINE = FILLED.repeat(4) + OUTLINE;

const countFilled = (stars) => stars.split(FILLED).length - 1;

/** The sitewide rule under test. */
const expectedStarsFor = (rating) => (rating >= 4.6 ? FIVE_FILLED : FOUR_PLUS_OUTLINE);

/**
 * Every review card on the homepage: its star glyphs, its numeric rating, and
 * the review page it links to.
 */
function homepageCards() {
  const html = read('index.html');
  const cardRating =
    /<div class="card-rating">\s*<span class="stars">([^<]*)<\/span>\s*<span class="rating-number">([0-9.]+)\/5<\/span>/g;

  const cards = [];
  for (const m of html.matchAll(cardRating)) {
    const rest = html.slice(m.index);
    const title = /<h3>([^<]+)<\/h3>/.exec(rest);
    const href = /href="(review-[a-z0-9-]+\.html)"/.exec(rest);
    assert.ok(title, `no <h3> title found after card-rating at index ${m.index}`);
    assert.ok(href, `no review-*.html link found after card-rating at index ${m.index}`);
    cards.push({
      board: title[1].trim(),
      stars: m[1],
      rating: Number(m[2]),
      reviewPage: href[1],
    });
  }
  return cards;
}

/** The star glyphs and rating in a review page's own rating block. */
function reviewPageRating(name) {
  const html = read(name);
  const m =
    /<span style="font-size:1\.5rem;color:#fbbf24;">([^<]*)<\/span>\s*<span style="color:var\(--text-secondary\);margin-left:0\.5rem;">([0-9.]+) \/ 5\.0<\/span>/.exec(
      html,
    );
  assert.ok(m, `${name}: could not find the review-page rating block`);
  return { stars: m[1], rating: Number(m[2]) };
}

test('homepage has the four review cards this issue covers', () => {
  const cards = homepageCards();
  assert.equal(cards.length, 4);
});

test('every homepage review card draws stars per the sitewide >= 4.6 rule', () => {
  for (const card of homepageCards()) {
    assert.equal(
      card.stars,
      expectedStarsFor(card.rating),
      `${card.board} (${card.rating}/5) draws ${countFilled(card.stars)} filled stars on index.html`,
    );
  }
});

test('every homepage review card draws the same stars as its own review page', () => {
  for (const card of homepageCards()) {
    const review = reviewPageRating(card.reviewPage);
    assert.equal(
      review.rating,
      card.rating,
      `${card.board}: index.html says ${card.rating}/5, ${card.reviewPage} says ${review.rating}/5`,
    );
    assert.equal(
      countFilled(card.stars),
      countFilled(review.stars),
      `${card.board}: index.html draws ${countFilled(card.stars)} filled stars, ` +
        `${card.reviewPage} draws ${countFilled(review.stars)}`,
    );
  }
});

test('the numeric ratings on the homepage are unchanged', () => {
  const byBoard = Object.fromEntries(homepageCards().map((c) => [c.board, c.rating]));
  assert.deepEqual(byBoard, {
    'ASUS ROG Maximus Z790 Hero': 4.8,
    'MSI MAG B760 Tomahawk WiFi': 4.6,
    'GIGABYTE B650 AORUS Elite AX': 4.5,
    'ASUS ROG Strix X670E-E Gaming WiFi': 4.7,
  });
});
