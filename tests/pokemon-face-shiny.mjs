import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { composeShinyEyePixels, shinyFaceInk } from '../pokemon/face-animation.js';

const root = new URL('../', import.meta.url);
const gltf = JSON.parse(await readFile(new URL('pokemon/models/cinderace.gltf', root), 'utf8'));
const materials = gltf.materials.map(x => x.name);
assert.ok(materials.includes('BodyAll_SHINY _FaceComposite'));
assert.ok(materials.includes('BodyAll_SHINY _FaceBase'));
assert.ok(materials.includes('BodyAll _FaceComposite'));

assert.equal(shinyFaceInk(230, 228, 238), false, 'lavender atlas background must be transparent');
assert.equal(shinyFaceInk(183, 169, 155), false, 'tan mask must be transparent');
assert.equal(shinyFaceInk(188, 72, 50), true, 'red iris');
assert.equal(shinyFaceInk(48, 42, 45), true, 'dark eye outline');
assert.equal(shinyFaceInk(245, 243, 241), true, 'near-neutral sclera white');

const width = 256, height = 256;
const native = new Uint8ClampedArray(width * height * 4);
const pose = new Uint8ClampedArray(width * height * 4);
function pixel(array, x, y, rgb) {
    const i = (y * width + x) * 4;
    array.set([...rgb, 255], i);
}
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    pixel(native, x, y, [232, 228, 235]);
    pixel(pose, x, y, [230, 228, 238]);
}
for (const centre of [69, 187]) {
    for (let y = 35; y < 91; y++)
        for (let x = centre - 23; x < centre + 23; x++)
            pixel(pose, x, y, [185, 171, 158]); // old massive tan patch
    pixel(pose, centre, 63, [180, 68, 48]);    // genuine red iris
    pixel(pose, centre + 1, 63, [45, 42, 45]); // dark outline
    pixel(pose, centre + 3, 63, [245, 243, 241]); // adjacent white
    pixel(pose, centre - 14, 46, [247, 246, 245]); // stray brow streak
}
pixel(native, 74, 163, [180, 67, 48]);   // mouth remains original
const result = composeShinyEyePixels(native, pose, width, height);
const alpha = (x, y) => result[(y * width + x) * 4 + 3];
assert.equal(alpha(0, 0), 0, 'background must be truly transparent');
assert.equal(alpha(110, 70), 0, 'old overlay cannot cover the Shiny cheek');
assert.equal(alpha(69, 40), 0, 'tan eye mask must not render');
assert.equal(alpha(187, 40), 0, 'both eye masks must be transparent');
assert.equal(alpha(69, 63), 255, 'left red iris');
assert.equal(alpha(187, 63), 255, 'right red iris');
assert.equal(alpha(72, 63), 255, 'white sclera next to actual eye');
assert.equal(alpha(190, 63), 255, 'right sclera');
assert.equal(alpha(55, 46), 0, 'white brow streak away from eye must not show');
assert.equal(alpha(74, 163), 255, 'original mouth element preserved');
assert.equal(alpha(128, 63), 0, 'no white stripe between eyes');

const face = await readFile(new URL('pokemon/face-animation.js', root), 'utf8');
assert.match(face, /id === 'cinderace' && shiny/);
assert.match(face, /transparentCinderaceShinyFrame\(original, atlas, i\)/);
assert.match(face, /shiny\.transparent = true/);
assert.match(face, /shiny\.alphaTest = 0\.05/);
assert.match(face, /shiny\.depthWrite = false/);
assert.doesNotMatch(face, /nativeCinderaceShinyFrame/);
const entry = await readFile(new URL('pokemon/entry.js', root), 'utf8');
const html = await readFile(new URL('index.html', root), 'utf8');
assert.match(entry, /showcase\.js\?v=45/);
assert.match(html, /pokemon\/entry\.js\?v=45/);
console.log('PASS: Cinderace Shiny has symmetric native-backed eyes, no lavender/white/tan face patches, genuine iris and updated cache chain.');
