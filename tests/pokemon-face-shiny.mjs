import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recolorNormalFaceForShiny } from '../pokemon/face-animation.js';

// The normal eye art is the source of truth: its exact contours, pupils,
// eyelashes, white sclera, three expressions and alpha must all survive.
const width=256,height=256,background=[238,238,238,255];
const put=(a,x,y,rgba)=>a.set(rgba,(y*width+x)*4);
const rgba=(a,x,y)=>[...a.slice((y*width+x)*4,(y*width+x)*4+4)];
for (const pose of ['idle','angry','blink']) {
    const input=new Uint8ClampedArray(width*height*4);
    for(let i=0;i<input.length;i+=4)input.set(background,i);
    const eyeTop=pose==='blink'?51:pose==='angry'?38:43;
    for(const cx of [69,189]) {
        // Closed black eyelid/eye contour, with white protected within.
        for(let y=eyeTop;y<104;y++)for(let x=cx-28;x<=cx+28;x++) {
            if (x===cx-28||x===cx+28||y===eyeTop||y===103)
                put(input,x,y,[33,32,35,255]);
            else put(input,x,y,[249,249,249,255]); // original white sclera
        }
        put(input,cx,77,[198,62,43,255]); // red pupil
        put(input,cx-13,eyeTop,[20,43,79,255]); // navy outer lash
        put(input,cx-12,eyeTop+1,[36,39,41,255]); // thin dark lash
    }
    put(input,54,192,[45,40,42,255]); // original mouth
    put(input,199,201,[211,75,56,255]);
    // Preserve the original alpha, even where 3D texture filtering gave
    // antialiasing. No newly transparent skin pixels are permitted.
    put(input,11,233,[239,239,239,187]);
    const out=recolorNormalFaceForShiny(input,width,height);
    assert.deepEqual(rgba(out,4,4),[181,170,161,255],pose+' skin replaces background');
    for(const cx of [69,189]) {
        assert.deepEqual(rgba(out,cx+10,90),[249,249,249,255],pose+' sclera unchanged');
        assert.deepEqual(rgba(out,cx,77),[198,62,43,255],pose+' original iris');
        assert.deepEqual(rgba(out,cx-12,eyeTop+1),[36,39,41,255],pose+' eyeliner');
        const lash=rgba(out,cx-13,eyeTop);
        assert.ok(lash[0]>220&&lash[1]>210&&lash[2]>210,pose+' blue lash becomes pale shiny ivory');
        assert.equal(lash[3],255);
    }
    assert.deepEqual(rgba(out,54,192),[45,40,42,255],pose+' mouth intact');
    assert.deepEqual(rgba(out,199,201),[211,75,56,255],pose+' other mouth detail intact');
    assert.equal(rgba(out,11,233)[3],187,'antialiased skin alpha preserved');
    assert.deepEqual(rgba(input,4,4),background,'normal source remains untouched');
    for(let i=3;i<input.length;i+=4)
        assert.equal(out[i],input[i],'no pixel loses skin/eye alpha');
}
assert.throws(()=>recolorNormalFaceForShiny(new Uint8ClampedArray(15),width,height));
const face=await readFile(new URL('../pokemon/face-animation.js',import.meta.url),'utf8');
assert.match(face,/id === 'cinderace' && shiny/);
assert.match(face,/shiny && !fromNormal/);
assert.match(face,/recolorNormalFaceForShiny\(/);
assert.doesNotMatch(face,/restoreShinyFaceArtwork|isolateShinyEyeArtwork|removeStrayShinyWhites/);
assert.match(face,/shiny\.transparent = true/);
assert.match(face,/shiny\.depthWrite = false/);
assert.match(face,/shiny\.polygonOffset = true/);
assert.match(face,/rare\.transparent = false/);
const gltf=JSON.parse(await readFile(new URL('../pokemon/models/cinderace.gltf',import.meta.url),'utf8'));
assert.equal(gltf.images[7].name,'pm0815_00_Eye_Col_rare');
const showcase=await readFile(new URL('../pokemon/showcase.js',import.meta.url),'utf8');
const entry=await readFile(new URL('../pokemon/entry.js',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(showcase,/face-animation\.js\?v=19/);
assert.match(entry,/showcase\.js\?v=54/);
assert.match(index,/pokemon\/entry\.js\?v=54/);
console.log('PASS: normal Cinderace facial art used for Shiny without alpha changes in three poses.');
