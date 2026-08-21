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
| ASUS ROG Crosshair X870E Hero | B0DDZSP2BG | `review-asus-rog-crosshair-x870e-hero.html` | 2026-08-20 (#49) |
| ASUS ROG Strix X870E-E Gaming WiFi | B0DGQ7NHT2 | `review-asus-rog-strix-x870e-e-gaming-wifi.html` | 2026-08-20 (#49) |
| GIGABYTE X870E AORUS Master | B0DGVSW4FD | `review-gigabyte-x870e-aorus-master.html` | 2026-08-20 (#49) |
| MSI MPG X870E Carbon WiFi | B0DG3QW9TJ | `review-msi-mpg-x870e-carbon-wifi.html` | 2026-08-20 (#49) |
| ASRock B760M Pro RS/D4 | B0BQWR37J4 | `review-asrock-b760m-pro-rs-d4.html` | 2026-08-20 (#48) |
| ASRock B760M Steel Legend WiFi | B0BQWPLY57 | `review-asrock-b760m-steel-legend-wifi.html` | 2026-08-20 (#48) |
| MSI MAG B760M Mortar WiFi | B0BRQSXRB2 | `review-msi-mag-b760m-mortar-wifi.html` | 2026-08-20 (#48) |
| ASRock Z790 Steel Legend WiFi | B0BJF1RS19 | `review-asrock-z790-steel-legend-wifi.html` | 2026-08-20 (#47) |
| ASUS Prime Z790-A WiFi | B0BG6NVPVG | `review-asus-prime-z790-a-wifi.html` | 2026-08-20 (#47) |
| ASUS ROG Strix Z790-A Gaming WiFi | B0BSP5MPC5 | `review-asus-rog-strix-z790-a-gaming-wifi.html` | 2026-08-20 (#47) |
| ASUS ROG Strix Z790-I Gaming WiFi | B0BHXS6HLH | `review-asus-rog-strix-z790-i-gaming-wifi.html` | 2026-08-20 (#47) |
| ASUS TUF Gaming Z790-Plus WiFi | B0BPHCPSCM | `review-asus-tuf-gaming-z790-plus-wifi.html` | 2026-08-20 (#47) |
| GIGABYTE Z790 AORUS Elite AX | B0BH9DXY38 | `review-gigabyte-z790-aorus-elite-ax.html` | 2026-08-20 (#47) |
| MSI MPG Z790 Carbon WiFi | B0BHCJ1QK8 | `review-msi-mpg-z790-carbon-wifi.html` | 2026-08-20 (#47) |
| MSI MPG Z790 Edge WiFi | B0BL92SPJQ | `review-msi-mpg-z790-edge-wifi.html` | 2026-08-20 (#47) |
| MSI MPG Z790I Edge WiFi | B0BHCJ6KQ2 | `review-msi-mpg-z790i-edge-wifi.html` | 2026-08-20 (#47) |
| ASUS Prime Z890-P WiFi | B0DGWTQWL3 | `review-asus-prime-z890-p-wifi.html` | 2026-08-21 (#45) |
| ASUS TUF Gaming Z890-Plus WiFi | B0DGWNVCHL | `review-asus-tuf-gaming-z890-plus-wifi.html` | 2026-08-21 (#45) |
| MSI MPG Z890 Carbon WiFi | B0DJPTRFN6 | `review-msi-mpg-z890-carbon-wifi.html` | 2026-08-21 (#45) |
| MSI MPG Z890 Edge TI WiFi | B0DK4C8GYK | `review-msi-mpg-z890-edge-ti-wifi.html` | 2026-08-21 (#45) |
| MSI PRO Z890-A WiFi | B0DH6W5M6R | `review-msi-pro-z890-a-wifi.html` | 2026-08-21 (#45) |

## Unconverted

Batch #51 (X670E) converted four of five boards. The fifth keeps its search
URL:

| Board | Review page | Status | Notes |
|---|---|---|---|
| ASRock X670E Taichi | `review-asrock-x670e-taichi.html` | UNVERIFIED (#51) | Only genuine listing found is B0BGPF7K2P; every fetch of it returned HTTP 500, so test (b) could not pass. Links left as search URLs. Every other candidate was rejected by the reject list (Carrara SKU, "Fit for" clones, RAM accessories). |

`B0BGPF7K2P` is not recorded above, because the board was not converted.

None from batch #52 — all nine boards converted.

Batch #54 (AM4 legacy) left two boards on search URLs, both PENDING-HUMAN:

| Board | Review page | Reason |
|---|---|---|
| ASUS ROG Crosshair VIII Dark Hero | `review-asus-rog-crosshair-viii-dark-hero.html` | Our spec table says chipset `X570`; the genuine listing `B08MTKJ6HM` is titled `X570S`. Flagged in advance by issue #54; not resolvable by a link conversion. |
| MSI MEG X570S Unify-X Max | `review-msi-meg-x570s-unify-x-max.html` | Our spec table says chipset `X570`; listing `B09GLBW5LL` reports chipset `X570S`. Verification test (c) fails, so the ASIN was not used. |

Neither ASIN is recorded above, because neither board was converted. Whether
our pages should read `X570` or `X570S` is a spec question for a human to
settle against the manufacturer's own spec page.

Batch #49 (X870E) left one board on its search URL, PENDING-HUMAN:

| Board | Review page | Reason |
|---|---|---|
| ASRock X870E Taichi | `review-asrock-x870e-taichi.html` | Our spec table says form factor `ATX`; the genuine listing `B0DFP2Q3TM` and ASRock's own product listing both say `EATX`. Form factor is one of the specs the conversion recipe compares, so the ASIN was not used. |

`B0DFP2Q3TM` is not recorded above, because the board was not converted.

Batch #48 (B760) converted three of eight boards. The other five keep their
search URLs:

| Board | Review page | Status | Reason |
|---|---|---|---|
| ASRock B760M-ITX/D4 WiFi | `review-asrock-b760m-itx-d4-wifi.html` | PENDING-HUMAN | Candidate `B0BQWQ9QPK` is the right board and agrees on socket, chipset, memory generation and form factor, but ASRock's own spec page lists a WiFi 6E module and Gigabit LAN while our table says `WiFi 6` and `2.5G`. WiFi variant is part of the comparison set, so the ASIN was not used. |
| ASUS Prime B760M-A WiFi D4 | `review-asus-prime-b760m-a-wifi-d4.html` | UNVERIFIED | No Amazon listing carries this exact model name. The US SKU is `PRIME B760M-A AX D4` (`B0BR8SH6PD`), whose specs all match ours; `AX` vs `WiFi` fails the token-by-token name test. Whether the two names denote one board is a naming question for a human. |
| ASUS TUF Gaming B760-PLUS WiFi D4 | `review-asus-tuf-gaming-b760-plus-wifi-d4.html` | UNVERIFIED | Exact-name candidate `B0BR8TN1H4` found, but `/dp/` and the long SEO URL both returned HTTP 500 on three attempts, so the live-fetch test never ran. Retry in a later batch. |
| GIGABYTE B760 AORUS Elite AX DDR4 | `review-gigabyte-b760-aorus-elite-ax-ddr4.html` | UNVERIFIED | The board exists on GIGABYTE's site, but no Amazon listing was found for the ATX DDR4 variant. Amazon carries the ATX DDR5 board and the micro-ATX DDR4 board, both rejecting mismatches. |
| GIGABYTE B760M DS3H AX DDR4 | `review-gigabyte-b760m-ds3h-ax-ddr4.html` | PENDING-HUMAN | Candidate `B083R7SWF5` matches on socket, chipset, memory generation and form factor, but both the listing and GIGABYTE's spec page say Wi-Fi 6E while our table says `WiFi 6`. |

None of these ASINs are recorded above, because none of the boards were
converted.

Batch #47 (Z790) converted nine of ten boards. The tenth keeps its search URL:

| Board | Review page | Status | Reason |
|---|---|---|---|
| ASUS ROG Strix Z790-E Gaming WiFi II | `review-asus-rog-strix-z790-e-gaming-wifi-ii.html` | PENDING-HUMAN | Candidate `B0CJMQ2S5M` is the right board and agrees on socket, chipset, memory generation and form factor, but both the listing and ASUS's own spec page report Wi-Fi 7 while our table says `WiFi 6E`. ASUS also lists five M.2 slots against our four. WiFi variant is part of the comparison set, so the ASIN was not used. |

`B0CJMQ2S5M` is not recorded above, because the board was not converted.

Batch #45 (Z890 mainstream) converted all five boards. Each one passed the
full comparison set used by every previous batch — exact model name, live
`/dp/` fetch, socket, chipset, memory generation, form factor and WiFi
variant. No board was left on a search URL, so there are no UNVERIFIED or
PENDING-HUMAN entries for this batch.

Every board in the batch did, however, turn up a spec-table discrepancy
outside that comparison set. None of them casts doubt on board identity, and
no spec table was edited (issue #45 forbids it), but all five are recorded
here so a human can settle them:

| Board | Spec | Our table | Source consulted | Source says |
|---|---|---|---|---|
| ASUS Prime Z890-P WiFi | M.2 slots | `3x M.2` | ASUS techspec page | 4 x M.2 |
| ASUS TUF Gaming Z890-Plus WiFi | M.2 slots | `3x M.2` | ASUS techspec page | 4 x M.2 |
| MSI MPG Z890 Carbon WiFi | LAN | `2.5G` | secondary (MSI 403s) | dual LAN: 5G Killer E5000B + 2.5G Intel I226V |
| MSI MPG Z890 Edge TI WiFi | M.2 slots / LAN | `4x M.2` / `2.5G` | secondary (MSI 403s) | 5x M.2 / 5G Killer E5000B |
| MSI PRO Z890-A WiFi | M.2 slots / LAN / SATA | `3x M.2` / `2.5G` / `6` | secondary (MSI 403s) | 4x M.2 / 5G Realtek / 4x SATA |

The two ASUS rows are confirmed against ASUS's own techspec pages, so our
tables are wrong there. The three MSI rows are **not** settled: MSI's spec
pages return HTTP 403, so those figures come from retailer and reviewer
sources rather than the manufacturer, and need a human check against MSI's
own page before any table is edited.
