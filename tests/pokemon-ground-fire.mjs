import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Group, Scene } from '../pokemon/vendor/three-gltf.js';
import { GroundFireTrail, groundFlameMotion } from '../pokemon/ground-fire.js';
import { isRapidTap, SINGLE_TAP_WINDOW_MS, RAPID_TAP_GRACE_MS } from '../pokemon/tap-gestures.mjs';

for (const compact of [false, true]) {
    const scene = new Scene();
    const texture = { isTexture: true, dispose() {} };
    const flames = new GroundFireTrail(scene, compact, texture);
    const count = compact ? 8 : 14;
    assert.equal(flames.group.children.length, count);
    const turntable = new Group(), root = new Group(), foot = new Group();
    foot.name = 'RFoot_01';
    foot.position.set(0.15, 0.08, 0.12);
    root.add(foot);
    turntable.add(root);
    const model = { root };
    const origin = { x: 0.15, y: 0, z: 0.12 };
    assert.equal(groundFlameMotion(0, 0, 2, origin, 0), null);
    assert.ok(groundFlameMotion(0, 0.25, 2, origin, 0));
    assert.equal(groundFlameMotion(0, 1.25, 2, origin, 0), null);

    for (let i = 0; i < 100; i++) {
        flames.begin();
        for (const t of [0.14, 0.24, 0.44, 0.82, 1.12, 1.34]) {
            flames.update(t, model, turntable, i * Math.PI / 100, 2);
            for (const particle of flames.particles) {
                const m = particle.mesh;
                assert.ok([m.position.x, m.position.y, m.position.z,
                    m.material.opacity].every(Number.isFinite));
                assert.ok(m.position.y >= 0, 'fire must not cross the floor');
            }
        }
        flames.clear();
        assert.equal(flames.group.children.length, count, 'must reuse fire pool');
        assert.ok(flames.particles.every(p => !p.mesh.visible && p.origin === null));
    }
    flames.begin();
    flames.update(2, model, turntable, 0, 2);
    assert.equal(flames.active, false);
    flames.dispose();
    assert.equal(scene.children.length, 0);
}

// Inspect integration: no more generic 2D ground orbit.
const showcase = await readFile(new URL('../pokemon/showcase.js', import.meta.url), 'utf8');
const effects = await readFile(new URL('../pokemon/battle-effects.js', import.meta.url), 'utf8');
const entry = await readFile(new URL('../pokemon/entry.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(showcase, /this\.groundFlames = new GroundFireTrail\(this\.scene, mobile\.matches\)/);
assert.match(showcase, /this\.groundFlames\?\.begin\(\)/);
assert.match(showcase, /this\.groundFlames\?\.update\(this\.attack\.time/);
assert.doesNotMatch(effects, /drawGroundFire|frame\.groundFire/);
assert.match(entry, /showcase\.js\?v=43/);
assert.match(html, /pokemon\/entry\.js\?v=43/);

// Exercise the actual Gigamax tap method with deterministic timers.
// A lone tap reacts with the available 'Rugido' clip, a double tap does not
// invent a physical / G-Max attack. The special button is untouched.
const body = showcase.split('    tapGigamaxReaction() {')[1].split('    playQuickAttack() {')[0];
assert.ok(body, 'Gigamax click handler not found');
let clock = 1000;
const scheduled = [];
const fakePerformance = { now: () => clock };
const fakeSetTimeout = callback => { scheduled.push(callback); return scheduled.length; };
const method = new Function(
    'performance', 'isRapidTap', 'RAPID_TAP_GRACE_MS', 'SINGLE_TAP_WINDOW_MS', 'setTimeout', 'MOVES',
    'return function() {' + body.slice(0, body.lastIndexOf('}')) + '}',
)(fakePerformance, isRapidTap, RAPID_TAP_GRACE_MS, SINGLE_TAP_WINDOW_MS,
    fakeSetTimeout, { roar: 'Rugido' });
let roars = 0, cries = 0;
const actor = {
    model: {}, form: 'gigamax', loading: false, attack: null,
    lastTapAt: -Infinity, rapidTapUntil: -Infinity,
    showcase: { classList: { contains: () => false } },
    clearPendingSingleTap() { this.pendingSingleTap = null; },
    playAttackCry() { cries++; },
    play(name, kind) {
        assert.equal(name, 'Rugido');
        assert.equal(kind, 'gigamax-reaction');
        roars++;
    },
};
method.call(actor);
clock = 1220;
method.call(actor);
scheduled.forEach(fn => fn());
assert.equal(roars, 0, 'rapid double tap must cancel the isolated roar');
clock = 2100;
method.call(actor);
scheduled[2]();
assert.equal(roars, 1, 'isolated Gigamax tap must play the roar');
assert.equal(cries, 2);
console.log('PASS: 100 ground fire reuses per profile, physical floor, 3D integration, Gigamax single and rapid taps.');
