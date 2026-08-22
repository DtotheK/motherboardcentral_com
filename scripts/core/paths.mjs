/**
 * Repo root. A leaf module on purpose: config.mjs needs ROOT to find the
 * manifest, and collect.mjs needs config to know what to skip, so ROOT cannot
 * live in either without making the two import each other.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root, two levels up from scripts/core/. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
