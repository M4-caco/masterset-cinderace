import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controls=await readFile(new URL('../pokemon/showcase-controls.js',import.meta.url),'utf8');
const viewer=await readFile(new URL('../pokemon/showcase.js',import.meta.url),'utf8');
const css=await readFile(new URL('../pokemon/showcase.css',import.meta.url),'utf8');
const entry=await readFile(new URL('../pokemon/entry.js',import.meta.url),'utf8');
const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
for (const symbol of ['fire','normal']){
    assert.match(controls,new RegExp('\\b'+symbol+':'));
    assert.match(viewer,new RegExp("'"+symbol+"'"));
}
for (const kind of ['move-fire','move-normal'])assert.ok(css.includes('.pokemon-badge-'+kind));
assert.match(viewer,/button\.dataset\.moveType = type/);
assert.match(viewer,/type === 'fire' \? 'fire' : 'normal'/);
assert.match(controls,/GLYPHS\[name\]\s*\?\?\s*GLYPHS\.normal/);
assert.match(entry,/showcase\.js\?v=52/);
assert.match(page,/pokemon\/entry\.js\?v=52/);
assert.match(page,/pokemon\/showcase\.css\?v=30/);
assert.match(viewer,/this\.play\(clip, 'battle'\)/);
console.log('PASS: original Normal/Fire move-type SVGs and colored badges restored.');
