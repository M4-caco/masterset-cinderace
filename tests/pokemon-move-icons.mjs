import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controls=await readFile(new URL('../pokemon/showcase-controls.js',import.meta.url),'utf8');
const viewer=await readFile(new URL('../pokemon/showcase.js',import.meta.url),'utf8');
const entry=await readFile(new URL('../pokemon/entry.js',import.meta.url),'utf8');
const page=await readFile(new URL('../index.html',import.meta.url),'utf8');

for(const symbol of ['move-physical','fire','move-alternate','move-max']){
    assert.ok(controls.includes(symbol+':')||controls.includes("'"+symbol+"':"),
        'defined SVG glyph for '+symbol);
}
for(const symbol of ['move-physical','fire','move-alternate','move-max'])
    assert.ok(viewer.includes("'"+symbol+"'"), 'viewer uses '+symbol);
assert.match(controls,/GLYPHS\[name\]\s*\?\?\s*GLYPHS\.normal/,
    'an absent icon must have a visual fallback');
assert.doesNotMatch(viewer,/iconControl\(name, 'move-normal'/);
assert.match(viewer,/showcase-controls\.js\?v=15/);
assert.match(entry,/showcase\.js\?v=50/);
assert.match(page,/pokemon\/entry\.js\?v=50/);
assert.match(viewer,/this\.play\(clip, 'battle'\)/, 'native animations remain');
console.log('PASS: physical, fire, alternate and Max SVG symbols defined, connected and cached.');
