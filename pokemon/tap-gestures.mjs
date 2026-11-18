// Distinguish isolated and repeated taps for the original character animation.
// No custom attack effects are generated.
export const SINGLE_TAP_WINDOW_MS = 300;
export const RAPID_TAP_GRACE_MS = 440;

export function isRapidTap(now, previous, rapidUntil) {
    return now - previous <= SINGLE_TAP_WINDOW_MS || now < rapidUntil;
}

