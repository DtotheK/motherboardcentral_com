# Affiliate ASIN ledger

One row per board. An ASIN appears exactly once and maps to exactly one board.

Link format is always:
`https://www.amazon.com/dp/<ASIN>?tag=motherboardcentral.com-20`

"Verified" means all four tests in the conversion recipe passed: exact
model-name match against our `<h1>` and spec table, a live fetch of
`/dp/<ASIN>` returning a real product page, socket + chipset + memory
generation agreeing with our spec table, and a new, bare listing (not
Renewed, not a bundle).

| Board | ASIN | Review page | Verified |
|---|---|---|---|
| ASUS ROG Maximus Z790 Hero | B0BG6M53DG | `review-asus-rog-maximus-z790-hero.html` | pilot (#3) |
| ASUS ROG Strix X670E-E Gaming WiFi | B0BDTHQTJV | `review-asus-rog-strix-x670e-e-gaming-wifi.html` | pilot (#3) |
| GIGABYTE B650 AORUS ELITE AX | B0BH7GTY9C | `review-gigabyte-b650-aorus-elite-ax.html` | pilot (#3) |
| MSI MAG B760 Tomahawk WiFi | B0BRQV1P6M | `review-msi-mag-b760-tomahawk-wifi.html` | pilot (#3) |
| ASUS ROG Crosshair X670E Hero | B0BDTN8SNJ | `review-asus-rog-crosshair-x670e-hero.html` | 2026-08-19 (#51) |
| GIGABYTE X670E AORUS Master | B0BFNVND8B | `review-gigabyte-x670e-aorus-master.html` | 2026-08-19 (#51) |
| MSI MEG X670E ACE | B0B6Q4X5NF | `review-msi-meg-x670e-ace.html` | 2026-08-19 (#51) |
| MSI MPG X670E Carbon WiFi | B0B6Q23SPC | `review-msi-mpg-x670e-carbon-wifi.html` | 2026-08-19 (#51) |

## Unconverted

| Board | Review page | Status | Notes |
|---|---|---|---|
| ASRock X670E Taichi | `review-asrock-x670e-taichi.html` | UNVERIFIED (#51) | Only genuine listing found is B0BGPF7K2P; every fetch of it returned HTTP 500, so test (b) could not pass. Links left as search URLs. Every other candidate was rejected by the reject list (Carrara SKU, "Fit for" clones, RAM accessories). |
