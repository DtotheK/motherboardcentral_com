/* Spent planning probe for issue #35 -- it tested whether a vendor datasheet
 * PDF could be text-extracted when the vendor's HTML spec page 403s WebFetch.
 * Result: streams inflate (469k chars) but the fonts are glyph-subset encoded,
 * so no spec keyword ("B850", "PCIe", "SATA") is recoverable without a
 * ToUnicode CMap parser. Route rejected in the plan comment.
 * Kept as a no-op stub because this session cannot delete files; it is
 * untracked and must never be committed. */

import { test } from 'node:test';

test.skip('tmp b850 pdf probe (spent)', () => {});
