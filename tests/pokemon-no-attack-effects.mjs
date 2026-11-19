import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const showcase = await read('pokemon/showcase.js');
const gesture = await read('pokemon/tap-gestures.mjs');
const html = await read('index.html');
const entry = await read('pokemon/entry.js');
const css = await read('pokemon/showcase.css');

// No attack FX loader or renderer remains in the live viewer. This prevents
// old experimental flames or projectiles from accidentally restarting.
for (const forbidden of [
    'BattleEffects', 'GroundFireTrail', 'loadAttackSprites',
    'effectSpace', 'battleEffects', 'groundFlames', 'singleTapEffect',
    'data-attack-away', 'tacklePath', 'moveTackle',
]) {
    assert.equal(showcase.includes(forbidden), false, 'discontinued FX code: ' + forbidden);
}
assert.doesNotMatch(showcase, /this\.attack\?\.effect|this\.attack\.effect/);
assert.doesNotMatch(showcase, /this\.play\([^)]*,\s*['"]battle['"]\s*,/);
assert.doesNotMatch(showcase, /new BattleEffects|new GroundFireTrail/);
assert.doesNotMatch(gesture, /singleTapEffect/);

// Only original Pokémon GO model animation clips and existing cry files stay.
for (const native of [
    'Ataque físico', 'Ataque especial', 'Ataque especial alternativo',
    'Rugido', 'this.play(MOVES.special,',
    "this.play(clip, 'battle')", 'this.playAttackCry()',
]) assert.ok(showcase.includes(native), 'native animation not retained: ' + native);

assert.match(showcase, /new MaxLandingImpact\(this\.scene, mobile\.matches\)/);
assert.match(showcase, /this\.maxLanding\.start\(/);
assert.match(showcase, /this\.maxLanding\?\.update\(now\)/);
assert.doesNotMatch(css, /pokemon-battle-effects|data-attack-away/);
assert.match(entry, /showcase\.js\?v=52/);
assert.match(html, /pokemon\/entry\.js\?v=52/);
assert.match(html, /pokemon\/showcase\.css\?v=30/);

const deadModules = [
    'pokemon/battle-effects.js', 'pokemon/ground-fire.js',
    'pokemon/effect-space.js', 'pokemon/visuals/attack-fx.webp',
    'tests/pokemon-ground-fire.mjs', 'tests/pokemon-effect-space.mjs',
];
for (const file of deadModules) {
    let exists = true;
    try { await access(new URL(file, root)); }
    catch (error) {
        if (error.code !== 'ENOENT') throw error;
        exists = false;
    }
    assert.equal(exists, false, 'retired file still deployed: ' + file);
}
console.log('PASS: all custom attack FX retired, only original clip animations and Max transformation remain.');
