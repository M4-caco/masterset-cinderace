import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { shinyFaceInk } from '../pokemon/face-animation.js';

const root = new URL('../', import.meta.url);
const gltf = JSON.parse(await readFile(new URL('pokemon/models/cinderace.gltf', root), 'utf8'));
const materials = gltf.materials.map(x => x.name);
assert.ok(materials.includes('BodyAll_SHINY _FaceComposite'));
assert.ok(materials.includes('BodyAll _FaceComposite'));
const face = await readFile(new URL('pokemon/face-animation.js', root), 'utf8');
assert.match(face, /id === 'cinderace' && shiny && i === 0/);
assert.match(face, /frames\.push\(original\)/);
assert.match(face, /nativeCinderaceShinyFrame\(original, atlas, i\)/);
// Preserve actual pupil, white sclera and dark outline while rejecting the
// brown/tan 'eye mask' that was accidentally introduced by the custom atlas.
assert.equal(shinyFaceInk(183, 169, 155), false, 'tan mask');
assert.equal(shinyFaceInk(200, 182, 170), false, 'antialiased tan mask');
assert.equal(shinyFaceInk(188, 72, 50), true, 'native orange iris');
assert.equal(shinyFaceInk(48, 42, 45), true, 'black eye outline');
assert.equal(shinyFaceInk(245, 243, 241), true, 'white sclera');
const entry = await readFile(new URL('pokemon/entry.js', root), 'utf8');
const html = await readFile(new URL('index.html', root), 'utf8');
assert.match(entry, /showcase\.js\?v=44/);
assert.match(html, /pokemon\/entry\.js\?v=44/);
console.log('PASS: native Cinderace Shiny eye map used at idle; animated lids exclude tan patches; cache chain valid.');
