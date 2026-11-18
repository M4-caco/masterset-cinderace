import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { removeStrayShinyWhites } from '../pokemon/face-animation.js';

const source = await readFile(new URL('../pokemon/face-animation.js', import.meta.url), 'utf8');
const model = JSON.parse(await readFile(new URL('../pokemon/models/cinderace.gltf', import.meta.url),'utf8'));

assert.equal(model.images[7].name,'pm0815_00_Eye_Col_rare');
assert.match(source,/loadFrames\(id, shiny\.map, true\)/);
assert.match(source,/removeStrayShinyWhites\(frame\.data, canvas\.width, canvas\.height\)/);
assert.match(source,/rare\.color\.set\('#98918a'\)/);
assert.doesNotMatch(source,/nativeCinderaceRareEyes|composeShinyEyePixels|nativeCinderaceShinyFrame/);
assert.doesNotMatch(source,/\.flipX|\.scaleX|\.rotate\(|\.scale\.x\s*=/);

const w=256,h=256,base=new Uint8ClampedArray(w*h*4);
for(let i=0;i<base.length;i+=4)base.set([183,171,159,255],i);
function put(x,y,rgba){base.set(rgba,(y*w+x)*4)}
function pixel(buffer,x,y){return [...buffer.slice((y*w+x)*4,(y*w+x)*4+4)]}
put(70,52,[185,66,47,255]);       // first real red eye
put(185,52,[185,66,47,255]);      // second red eye
put(75,53,[245,244,241,255]);     // legitimate thin sclera near iris
put(180,54,[245,244,241,255]);    // legitimate sclera on other eye
put(24,50,[248,248,246,255]);     // unwanted white spot far from left iris
put(231,50,[248,248,246,255]);    // unwanted white spot far from right iris
put(100,98,[230,228,238,255]);    // lilac background must NOT be replaced
put(50,115,[178,169,158,255]);    // warm face colour stays original
const output=removeStrayShinyWhites(base,w,h);
assert.deepEqual(pixel(output,70,52),[185,66,47,255]);
assert.deepEqual(pixel(output,185,52),[185,66,47,255]);
assert.deepEqual(pixel(output,75,53),[245,244,241,255]);
assert.deepEqual(pixel(output,180,54),[245,244,241,255]);
assert.deepEqual(pixel(output,24,50),[184,171,159,255]);
assert.deepEqual(pixel(output,231,50),[184,171,159,255]);
assert.deepEqual(pixel(output,100,98),[230,228,238,255]);
assert.deepEqual(pixel(output,50,115),[178,169,158,255]);
assert.deepEqual(pixel(base,24,50),[248,248,246,255],'input remains untouched');
assert.throws(()=>removeStrayShinyWhites(new Uint8ClampedArray(13),w,h));
console.log('PASS: original eye shape, two pupils, sclera and facial animations kept; only stray white spots eliminated.');
