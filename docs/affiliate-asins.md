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
| ASUS Prime X870-P WiFi | B0DDZY6HTW | `review-asus-prime-x870-p-wifi.html` | 2026-08-20 (#50) |
| ASUS TUF Gaming X870-Plus WiFi | B0DGB8Q19Y | `review-asus-tuf-gaming-x870-plus-wifi.html` | 2026-08-20 (#50) |
| GIGABYTE X870 AORUS Elite WiFi7 | B0DGVC3DDW | `review-gigabyte-x870-aorus-elite-wifi7.html` | 2026-08-20 (#50) |
| MSI MAG X870 Tomahawk WiFi | B0DG3HK897 | `review-msi-mag-x870-tomahawk-wifi.html` | 2026-08-20 (#50) |
| MSI PRO X870-P WiFi | B0DG3SSGLF | `review-msi-pro-x870-p-wifi.html` | 2026-08-20 (#50) |

## Unconverted

None from batch #52 — all nine boards converted.

None from batch #50 — all five boards converted.
