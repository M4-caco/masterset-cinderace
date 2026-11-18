import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();

// Preserve the shape, orientation and three poses of the original web eyes.
// The old eye atlas also contains opaque skin patches, stray dark shapes and
// a lilac/white backdrop. All of those must be transparent outside the eye
// artwork, not painted darker: painting them caused the reported cheek stains.
export function locateShinyIrisCenters(pixels, width, height) {
    const groups = [[], []];
    for (let y = Math.floor(height * 0.055); y < height * 0.42; y++) {
        for (let x = 0; x < width; x++) {
            const side = x < width / 2 ? 0 : 1;
            if (side === 0 && (x < width * .13 || x > width * .44)) continue;
            if (side === 1 && (x < width * .56 || x > width * .87)) continue;
            const i = (y * width + x) * 4;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            if (r > 115 && g < 165 && r > g * 1.42 && r > b * 1.4)
                groups[side].push([x, y]);
        }
    }
    return groups.map((group, side) => group.length
        ? group.reduce((acc, [x,y]) => [acc[0]+x/group.length, acc[1]+y/group.length], [0,0])
        : [width * (side ? .73 : .27), height * .23]);
}

export function isolateShinyEyeArtwork(pixels, width, height, centers) {
    if (pixels.length !== width * height * 4) throw new Error('Invalid Shiny face frame');
    const out = new Uint8ClampedArray(width * height * 4);
    const seeded = new Uint8Array(width * height);
    const nearEye = (x, y) => centers.some(([cx, cy]) =>
        Math.abs(x - cx) <= width * .135 && Math.abs(y - cy) <= height * .16);
    const inside = (x,y) => y <= height * .435 && nearEye(x,y);
    const ink = (r,g,b) => {
        const red = r > 115 && g < 165 && r > g * 1.42 && r > b * 1.4;
        const dark = r < 116 && g < 116 && b < 125;
        return red || dark;
    };
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        if(!inside(x,y))continue;
        const i=(y*width+x)*4;
        if(ink(pixels[i],pixels[i+1],pixels[i+2]))seeded[y*width+x]=1;
    }
    const nearInk=(x,y,radius)=>{
        for(let yy=Math.max(0,y-radius);yy<=Math.min(height-1,y+radius);yy++)
            for(let xx=Math.max(0,x-radius);xx<=Math.min(width-1,x+radius);xx++)
                if(seeded[yy*width+xx])return true;
        return false;
    };
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        if(!inside(x,y))continue;
        const i=(y*width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        const white = r>198 && g>198 && b>198 &&
            r>=b-4 && g>=b-4 && Math.abs(r-g)<18;
        // Preserve thin sclera and antialias next to the original dark eye
        // outline. Everything elsewhere, including lower decals, disappears.
        const antialias = Math.abs(r-g)<16 && Math.abs(g-b)<16 &&
            r>=118 && r<=203;
        if(seeded[y*width+x] || (white && nearInk(x,y,4)) ||
           (antialias && nearInk(x,y,2))) {
            out[i]=r;out[i+1]=g;out[i+2]=b;out[i+3]=pixels[i+3];
        }
    }
    return out;
}

async function loadFrames(id, original, shiny) {
    const suffix = shiny ? '-shiny' : '';
    const atlas = await loader.loadAsync(new URL(`./visuals/${id}-face${suffix}.webp`, import.meta.url).href);
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    let shinyCenters = null;
    if (id === 'cinderace' && shiny) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, image.width, height, 0, 0, image.width, height);
        const source = ctx.getImageData(0, 0, image.width, height);
        shinyCenters = locateShinyIrisCenters(source.data, canvas.width, canvas.height);
    }
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, i * height, image.width, height,
            0, 0, image.width, height);
        if (shinyCenters) {
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            frame.data.set(isolateShinyEyeArtwork(frame.data, canvas.width, canvas.height, shinyCenters));
            context.putImageData(frame, 0, 0);
        }
        const texture = new original.constructor(canvas);
        texture.colorSpace = original.colorSpace;
        texture.wrapS = original.wrapS;
        texture.wrapT = original.wrapT;
        texture.magFilter = original.magFilter;
        texture.minFilter = original.minFilter;
        texture.flipY = original.flipY;
        texture.needsUpdate = true;
        frames.push(texture);
    }
    atlas.dispose();
    return frames;
}

export async function prepareFace(id, materials, controllers) {
    if (id === 'cinderace') {
        // The original Shiny eye geometry and atlas are already oriented
        // correctly. Its separate FaceBase rare map, however, is nearly
        // white and leaks through as stray white marks. Only tint that
        // underlying face base to match the original grey Shiny skin.
        // Keep the complete original eye atlas, UVs and animation intact.
        for (const [, normal, rare] of materials) {
            if (!/_FaceBase$/.test(normal.name)) continue;
            rare.color.set('#98918a');
            rare.needsUpdate = true;
        }
    }
    const pairs = materials.filter(([, normal]) => /_Face(?:Tex|Composite)$/.test(normal.name));
    const bindings = await Promise.all(pairs.map(async ([, normal, shiny]) => {
        const [regularFrames, shinyFrames] = await Promise.all([
            loadFrames(id, normal.map, false),
            loadFrames(id, shiny.map, true),
        ]);
        if (id === 'cinderace') {
            // The original facial backing supplies the skin colour. The
            // Shiny composite must blend ONLY the actual artwork above it.
            shiny.transparent = true;
            shiny.alphaTest = 0.05;
            shiny.depthWrite = false;
            shiny.polygonOffset = true;
            shiny.polygonOffsetFactor = -1;
            shiny.polygonOffsetUnits = -1;
            shiny.needsUpdate = true;
        }
        return [[normal, regularFrames], [shiny, shinyFrames]];
    }));
    const face = { bindings: bindings.flat(), controllers, pose: -1 };
    applyFace(face, 0);
    return face;
}

function applyFace(face, pose) {
    if (pose === face.pose) return;
    face.pose = pose;
    for (const [material, frames] of face.bindings) material.map = frames[pose];
}

export function updateFace(face, seconds, attack) {
    if (!face) return;
    if (attack) {
        // The game drives facial UV states using the eye controllers in the animated rig.
        const state = Math.max(0, ...face.controllers.map(eye => eye.position.y));
        applyFace(face, state > 0.28 ? 1 : state > 0.14 ? 2 : 0);
        return;
    }
    const phase = seconds % 4.1;
    applyFace(face, phase > 2.83 && phase < 2.96 ? 2 : 0);
}
