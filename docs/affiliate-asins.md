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
| ASUS ROG Strix B650E-E Gaming WiFi | B0BHMTC99Q | `review-asus-rog-strix-b650e-e-gaming-wifi.html` | 2026-08-19 (#52) |
| ASUS ROG Strix B650E-I Gaming WiFi | B0BP9LJBP8 | `review-asus-rog-strix-b650e-i-gaming-wifi.html` | 2026-08-19 (#52) |
| ASUS Prime B650M-A AX II | B0BSP52VJC | `review-asus-prime-b650m-a-ax-ii.html` | 2026-08-19 (#52) |
| ASUS TUF Gaming B650-Plus WiFi | B0BHN7GGBQ | `review-asus-tuf-gaming-b650-plus-wifi.html` | 2026-08-19 (#52) |
| GIGABYTE B650I AORUS Ultra | B083R826VW | `review-gigabyte-b650i-aorus-ultra.html` | 2026-08-19 (#52) |
| GIGABYTE B650M AORUS Elite AX | B0BH6XND27 | `review-gigabyte-b650m-aorus-elite-ax.html` | 2026-08-19 (#52) |
| MSI MAG B650 Tomahawk WiFi | B0BHCCNSRH | `review-msi-mag-b650-tomahawk-wifi.html` | 2026-08-19 (#52) |
| MSI MAG B650M Mortar WiFi | B0BHC39YG7 | `review-msi-mag-b650m-mortar-wifi.html` | 2026-08-19 (#52) |
| MSI PRO B650-P WiFi | B0BHBT5BD3 | `review-msi-pro-b650-p-wifi.html` | 2026-08-19 (#52) |
| ASRock B550M Steel Legend | B089W2Q2QC | `review-asrock-b550m-steel-legend.html` | 2026-08-20 (#54) |
| ASUS ROG Strix B550-F Gaming WiFi II | B09GP7P1XS | `review-asus-rog-strix-b550-f-gaming-wifi-ii.html` | 2026-08-20 (#54) |
| GIGABYTE B550 AORUS Elite V2 | B08JHDL4WP | `review-gigabyte-b550-aorus-elite-v2.html` | 2026-08-20 (#54) |
| MSI MAG B550 Tomahawk | B089CWDHFZ | `review-msi-mag-b550-tomahawk.html` | 2026-08-20 (#54) |

## Unconverted

None from batch #52 — all nine boards converted.

Batch #54 (AM4 legacy) left two boards on search URLs, both PENDING-HUMAN:

| Board | Review page | Reason |
|---|---|---|
| ASUS ROG Crosshair VIII Dark Hero | `review-asus-rog-crosshair-viii-dark-hero.html` | Our spec table says chipset `X570`; the genuine listing `B08MTKJ6HM` is titled `X570S`. Flagged in advance by issue #54; not resolvable by a link conversion. |
| MSI MEG X570S Unify-X Max | `review-msi-meg-x570s-unify-x-max.html` | Our spec table says chipset `X570`; listing `B09GLBW5LL` reports chipset `X570S`. Verification test (c) fails, so the ASIN was not used. |

Neither ASIN is recorded above, because neither board was converted. Whether
our pages should read `X570` or `X570S` is a spec question for a human to
settle against the manufacturer's own spec page.
