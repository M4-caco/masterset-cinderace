import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nativeRareFacePixels } from '../pokemon/face-animation.js';

const width=256,height=256,pixels=new Uint8ClampedArray(width*height*4);
for(let i=0;i<pixels.length;i+=4)pixels.set([231,228,237,255],i);
const draw=(x,y,r,g,b)=>pixels.set([r,g,b,255],4*(y*width+x));
for(const c of [68,188]){
  draw(c,64,182,55,38); // original red pupil
  draw(c+2,64,38,34,36); // native outline
  draw(c+2,62,246,243,241); // small sclera highlight
}
const output=nativeRareFacePixels(pixels,width,height);
const a=(x,y)=>output[(y*width+x)*4+3];
assert.equal(a(0,0),0,'lilac original background is transparent');
assert.equal(a(100,70),0,'no blanket masking over Shiny cheek');
assert.equal(a(68,64),255,'left eye from native texture');
assert.equal(a(188,64),255,'right eye from native texture');
assert.equal(a(70,62),255,'native eye highlight is preserved');
assert.ok(a(68,64)===a(188,64),'no asymmetric alpha changes');
assert.throws(()=>nativeRareFacePixels(new Uint8ClampedArray(5),256,256));
const face=await readFile(new URL('../pokemon/face-animation.js',import.meta.url),'utf8');
assert.match(face,/id === 'cinderace' && shiny/);
assert.match(face,/return \[native, native, native\]/);
assert.match(face,/nativeCinderaceRareEyes\(original\)/);
assert.doesNotMatch(face,/composeShinyEyePixels|cinderace-face-shiny\.webp/);
assert.match(face,/rare\.transparent = true/);
assert.match(face,/rare\.alphaTest = 0\.03/);
const gltf=JSON.parse(await readFile(new URL('../pokemon/models/cinderace.gltf',import.meta.url),'utf8'));
assert.equal(gltf.images[7].name,'pm0815_00_Eye_Col_rare');
assert.equal(gltf.meshes[4].primitives[2].material,6);
assert.equal(gltf.meshes[4].primitives[2].extras.shinyMaterial,7);
assert.notDeepEqual(gltf.meshes[4].primitives[2].attributes.TEXCOORD_0,gltf.meshes[4].primitives[1].attributes.TEXCOORD_0);
const entry=await readFile(new URL('../pokemon/entry.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(entry,/showcase\.js\?v=46/);
assert.match(html,/pokemon\/entry\.js\?v=46/);
console.log('PASS: original Eye_Col_rare art and original UV layout, no artificial mirrored eyes or opaque lilac face.');
