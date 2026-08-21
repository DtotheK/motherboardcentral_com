# Deal note pattern (review pages)

Status: pilot. Live on three review pages. Enforced by `checkDealNote` in
`scripts/validate.mjs`.

This block is a **launch-MSRP price anchor**, not a deal note. It never carries
a current price, a projected price, a "was/now" pair, or a price band. Read
"Why there is no live price" below before changing anything here.

## 1. Canonical markup

Copy this verbatim and substitute only the dollar figure, the citation link,
the outlet name, the article date, and the Amazon href.

```html
<aside class="deal-note">
  <h4>Price check</h4>
  <p>Launch MSRP <strong>$499</strong>, per <a href="https://www.pcworld.com/article/1384251/asus-rog-strix-x670-e-motherboard-review.html" target="_blank" rel="noopener">PCWorld</a> (23 November 2022). That is the launch figure, not a current price &mdash; street prices move week to week and we don&#x27;t publish live prices. <a href="https://www.amazon.com/dp/B0BDTHQTJV?tag=motherboardcentral.com-20" target="_blank" rel="nofollow noopener noreferrer">Check the current price on Amazon</a>.</p>
  <p class="deal-note-meta">Launch MSRP and affiliate link last verified <time datetime="2026-08-21">21 August 2026</time>.</p>
</aside>
```

Styling lives in `css/style.css` under `.deal-note` / `.deal-note-meta`. Do not
use inline styles, and do not overload `.info-box`.

## 2. Placement

Exactly **one** block per review page, immediately before
`<h2 id="overview">Overview</h2>`, at the same indentation as that heading.
Never two. No "On This Page" TOC entry — it is not a section, and leaving the
sidebar alone keeps the shared markup untouched.

## 3. Why there is no live price

Every retailer link on this site is Amazon. Amazon's Associates operating
policies (https://affiliate-program.amazon.com/help/operating/policies) say:

> "Because prices for and availability of Products that you have listed on your
> Site may change, your Site may only show prices and availability if: (a) we
> serve the link in which that price and availability data are displayed, or
> (b) you obtain Product pricing and availability data via Creators API or PA
> API…"

> "You may store other Product Advertising Content that does not consist of
> images for caching purposes for up to 24 hours, but if you do so you must
> immediately thereafter refresh and re-display the Product Advertising
> Content…"

A price hand-committed into a static `review-*.html` is not Amazon-served, is
not PA-API sourced, and cannot refresh within 24 hours. So it cannot be
published at all — not with a date stamp, not with a disclaimer, not for a
short window.

A **launch MSRP** is different: it is historical manufacturer information about
the product, not Amazon pricing and availability data, so the rule above does
not reach it. It also never goes stale.

## 4. Sourcing rule for the MSRP

> A launch MSRP may be published only if the figure appears, with the word
> **MSRP** or **suggested retail price**, in one of:
> **(a)** the manufacturer's own product page or press release for that exact
> model, or
> **(b)** a full review of that exact model by a named editorial outlet, in an
> article the agent **fetched successfully and read** — no date window.
>
> Not acceptable, ever: deal aggregators, "best deals" round-ups, price-history
> sites (Pangoly, camelcamelcamel), retailer listings, forum posts, and
> **search-engine result summaries**. A search snippet is not a citation; fetch
> the article or drop the board.
>
> The cited model must match the page's ASIN exactly. Variant suffixes
> (`MAX`, `Ti`, `II`, `D4`, `WIFI7`) are different products with different
> MSRPs.

That last clause is not theoretical: searching the MSI MPG X870E Carbon WiFi
surfaces a $499 MSRP belonging to the X870E Carbon **MAX** WiFi, a different
board.

## 5. No figure, no block

Absent a citable launch MSRP under the rule above, omit the block entirely. No
placeholder, no rounding, no guess. Two pages with a note beat three with an
invented number.

## 6. Affiliate links

Never add, edit or remove an affiliate tag. Reuse the page's existing `/dp/`
URL verbatim, copied byte-for-byte from that same file. A page whose only
Amazon link is a `/s?k=` search URL does not get a block.

## 7. The MSRP and the Amazon link must never be adjacent

Pairing a dollar figure with a buy button invites reading the figure as the
current price. The link is **inline body text, never a `.btn`**, and a
disclaiming clause ("That is the launch figure, not a current price…") always
sits between the figure and the link.

Every review page already carries three `Check Price on Amazon` buttons
(sidebar, overview, article footer), so demoting this one costs no conversions.

## 8. Re-verification: N = 180 days

A block whose `<time datetime>` is more than 180 days old should be
re-verified. Re-verification means checking that:

- the ASIN in the Amazon href is still the right product,
- the board has not been discontinued,
- the citation URL still resolves and still contains the quoted MSRP,
- the MSRP figure is unchanged.

This is a **manual obligation. It is not enforced by `npm run validate`**, and
deliberately so: a time-based build gate on an auto-deploying repo breaks
whichever unrelated PR happens to be open on the day it trips. The block
contains no volatile figure, so an unreviewed block is not a wrong block.

If live prices are ever added via PA-API, **N becomes 24 hours**, per the
Amazon text quoted in section 3.

## 9. Amazon's prescribed disclaimer — not used today

If a price is ever displayed via PA-API, Amazon requires this sentence adjacent
to it, alongside a date/time stamp. It is recorded here for that eventuality
only and is **not** used by the current pattern, which displays no Amazon
price:

> "Product prices and availability are accurate as of the date/time indicated
> and are subject to change. Any price and availability information displayed
> on [relevant Amazon Site(s), as applicable] at the time of purchase will
> apply to the purchase of this product."

## 10. What the validator checks

`checkDealNote` in `scripts/validate.mjs`:

| Rule | Fires when |
|---|---|
| `deal-note-duplicate` | more than one block on a page |
| `deal-note-missing-date` | block has no `<time datetime="YYYY-MM-DD">` |
| `deal-note-unlabelled-price` | a `$` figure in the block is not introduced by "Launch MSRP" |
| `deal-note-no-affiliate-link` | block has no `amazon.com/dp/` href carrying our tag |

`deal-note-unlabelled-price` is what mechanically enforces section 3. It must
not be softened or removed.
