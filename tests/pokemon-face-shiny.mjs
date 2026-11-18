import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locateShinyIrisCenters, isolateShinyEyeArtwork } from '../pokemon/face-animation.js';

const width=256, height=256, source=new Uint8ClampedArray(width*height*4);
for(let i=0;i<source.length;i+=4)source.set([230,228,238,255],i);
const draw=(x,y,c,buffer=source)=>buffer.set([...c,255],(y*width+x)*4);
const pixel=(a,x,y)=>[...a.slice((y*width+x)*4,(y*width+x)*4+4)];
for(const center of [70,185]){
    for(let dx=-5;dx<=5;dx++)for(let dy=-5;dy<=5;dy++)
        draw(center+dx,65+dy,[183,66,48]); // original pupils, never redraw or rotate
    draw(center-6,65,[29,25,30]);           // black outline
    draw(center+8,65,[245,242,240]);        // thin white sclera
    draw(center+19,65,[180,169,156]);       // artificial tan cheek patch
    draw(center+23,90,[252,249,248]);       // stray bright facial perimeter
    draw(center-4,156,[58,51,56]);         // stray dark mark at lower cheek
}
draw(128,78,[40,36,40]); // nose shadow: does not belong to either eye
draw(128,102,[250,249,248]); // white line in centre of face
const centers=locateShinyIrisCenters(source,width,height);
assert.equal(centers.length,2);
assert.ok(Math.abs(centers[0][0]-70)<1);
assert.ok(Math.abs(centers[1][0]-185)<1);
const out=isolateShinyEyeArtwork(source,width,height,centers);
for(const center of [70,185]){
    assert.deepEqual(pixel(out,center,65),[183,66,48,255],'same iris colour and placement');
    assert.deepEqual(pixel(out,center-6,65),[29,25,30,255],'same natural black outline');
    assert.deepEqual(pixel(out,center+8,65),[245,242,240,255],'thin white sclera preserved');
    assert.equal(pixel(out,center+19,65)[3],0,'tan cheek no longer overlays face');
    assert.equal(pixel(out,center+23,90)[3],0,'white facial edge no longer overlays face');
    assert.equal(pixel(out,center-4,156)[3],0,'lower dark cheek decoration removed');
}
assert.equal(pixel(out,128,78)[3],0,'dark nose mark removed');
assert.equal(pixel(out,128,102)[3],0,'central white line removed');
assert.equal(pixel(out,128,210)[3],0,'original lavender background transparent');
assert.deepEqual(pixel(source,128,78),[40,36,40,255],'input remains immutable');
assert.throws(()=>isolateShinyEyeArtwork(new Uint8ClampedArray(13),width,height,centers));

const eyes=await readFile(new URL('../pokemon/face-animation.js',import.meta.url),'utf8');
assert.match(eyes,/loadFrames\(id, shiny\.map, true\)/);
assert.match(eyes,/isolateShinyEyeArtwork\(frame\.data, canvas\.width, canvas\.height, shinyCenters\)/);
assert.match(eyes,/shiny\.transparent = true/);
assert.match(eyes,/shiny\.depthWrite = false/);
assert.doesNotMatch(eyes,/nativeCinderaceRareEyes|nativeCinderaceShinyFrame|composeShinyEyePixels/);
const gltf=JSON.parse(await readFile(new URL('../pokemon/models/cinderace.gltf',import.meta.url),'utf8'));
assert.equal(gltf.images[7].name,'pm0815_00_Eye_Col_rare');
const entry=await readFile(new URL('../pokemon/entry.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(entry,/showcase\.js\?v=47/);
assert.match(html,/pokemon\/entry\.js\?v=47/);
console.log('PASS: two original eyes and blink frames preserved, dark nose/cheek marks and white face border removed.');
