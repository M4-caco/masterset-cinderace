import assert from 'node:assert/strict';
import { isRapidTap, SINGLE_TAP_WINDOW_MS, RAPID_TAP_GRACE_MS } from '../pokemon/tap-gestures.mjs';

assert.equal(SINGLE_TAP_WINDOW_MS, 300);
assert.equal(RAPID_TAP_GRACE_MS, 440);

// An isolated first click must remain pending until the short window expires.
assert.equal(isRapidTap(1000, -Infinity, -Infinity), false);
// Double click, even at the window boundary, becomes the original fast attack.
assert.equal(isRapidTap(1270, 1000, -Infinity), true);
assert.equal(isRapidTap(1300, 1000, -Infinity), true);
// A delayed second click is another standalone fire attack.
assert.equal(isRapidTap(1301, 1000, -Infinity), false);
// After a rapid sequence has begun, taps within the grace period stay rapid.
assert.equal(isRapidTap(1800, 1310, 1840), true);
assert.equal(isRapidTap(1840, 1310, 1840), false);
// Attack input remains available, but no invented FX mapping is exported.
assert.equal('singleTapEffect' in await import('../pokemon/tap-gestures.mjs'), false);
console.log('PASS: tap sequencing remains, custom attack effects disabled.');
