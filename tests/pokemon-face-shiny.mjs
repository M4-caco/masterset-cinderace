import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../pokemon/face-animation.js', import.meta.url),'utf8');
const model=JSON.parse(await readFile(new URL('../pokemon/models/cinderace.gltf',import.meta.url),'utf8'));
assert.match(source,/loadFrames\(id, shiny\.map, true\)/);
assert.match(source,/canvas\.getContext\('2d', \{ alpha: false \}\)\.drawImage/);
assert.doesNotMatch(source,/nativeCinderaceRareEyes|composeShinyEyePixels/);
assert.equal(model.images[7].name,'pm0815_00_Eye_Col_rare');
console.log('PASS: preserving original Shiny eye orientation in original three-frame atlas.');
