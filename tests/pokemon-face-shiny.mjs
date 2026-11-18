import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { restoreShinyFaceArtwork } from '../pokemon/face-animation.js';

const width=256,height=256,background=[230,228,238,255];
const at=(array,x,y)=>[...array.slice((y*width+x)*4,(y*width+x)*4+4)];
const put=(array,x,y,rgba)=>array.set(rgba,(y*width+x)*4);
for(const pose of ['idle','angry','blink']){
    const input=new Uint8ClampedArray(width*height*4);
    for(let i=0;i<input.length;i+=4)input.set(background,i);
    for(const x0 of [20,147])for(let y=29;y<112;y++)for(let x=x0;x<x0+93;x++)
        put(input,x,y,[184,171,159,255]); // original Shiny skin around both eyes
    const lidY=pose==='blink'?60:pose==='angry'?49:42;
    for(const center of [68,187]){
        for(let dx=-15;dx<=15;dx++)put(input,center+dx,lidY,[32,29,31,255]);
        put(input,center,65,[183,66,48,255]); // original iris
        put(input,center+7,65,[247,246,244,255]); // sclera
        put(input,center-11,lidY-2,[233,229,222,255]); // pale lid
    }
    // A very pale white patch is intentionally close to the lavender RGB;
    // it must remain when surrounded by the true facial art, not be erased
    // merely because its colour resembles the background.
    for(let y=77;y<89;y++)for(let x=54;x<80;x++)
        put(input,x,y,[184,171,159,255]);
    put(input,68,83,[235,233,239,255]); // delicate sclera
    put(input,69,83,[36,32,35,255]); // one-pixel lash/liner
    put(input,55,175,[42,36,40,255]); // original mouth details
    put(input,198,203,[188,70,50,255]);
    put(input,120,124,[229,229,237,255]); // background variation
    const out=restoreShinyFaceArtwork(input,width,height);
    for(const x of [30,155])assert.deepEqual(at(out,x,100),[184,171,159,255],pose+' skin');
    for(const center of [68,187]){
        assert.deepEqual(at(out,center,lidY),[32,29,31,255],pose+' eyeliner');
        assert.deepEqual(at(out,center,65),[183,66,48,255],pose+' iris');
        assert.deepEqual(at(out,center+7,65),[247,246,244,255],pose+' sclera');
        assert.deepEqual(at(out,center-11,lidY-2),[233,229,222,255],pose+' eyelid');
    }
    assert.deepEqual(at(out,68,83),[235,233,239,255],'pale white inside eye preserved');
    assert.deepEqual(at(out,69,83),[36,32,35,255],'thin eyelash line preserved');
    assert.deepEqual(at(out,55,175),[42,36,40,255]);
    assert.deepEqual(at(out,198,203),[188,70,50,255]);
    assert.equal(at(out,128,235)[3],0,'lilac backing transparent');
    assert.equal(at(out,120,124)[3],0,'background halo transparent');
    assert.deepEqual(at(input,128,235),background,'input remains unchanged');
}
assert.throws(()=>restoreShinyFaceArtwork(new Uint8ClampedArray(13),width,height));
const face=await readFile(new URL('../pokemon/face-animation.js',import.meta.url),'utf8');
assert.match(face,/restoreShinyFaceArtwork\(frame\.data, canvas\.width, canvas\.height\)/);
assert.match(face,/id === 'cinderace' && shiny/);
assert.doesNotMatch(face,/isolateShinyEyeArtwork|removeStrayShinyWhites|locateShinyIrisCenters/);
assert.match(face,/shiny\.transparent = true/);
assert.match(face,/rare\.transparent = false/);
assert.match(face,/rare\.color\.set\('#b5aaa1'\)/);
const gltf=JSON.parse(await readFile(new URL('../pokemon/models/cinderace.gltf',import.meta.url),'utf8'));
assert.equal(gltf.images[7].name,'pm0815_00_Eye_Col_rare');
const showcase=await readFile(new URL('../pokemon/showcase.js',import.meta.url),'utf8');
const entry=await readFile(new URL('../pokemon/entry.js',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(showcase,/face-animation\.js\?v=17/);
assert.match(entry,/showcase\.js\?v=49/);
assert.match(index,/pokemon\/entry\.js\?v=49/);
console.log('PASS: Shiny skin, eyelids, eyeliner, iris, mouth and three expressions retained.');
