import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();

// Cinderace's normal atlas already has a complete, correct eye outline,
// sclera, lashes, mouth and all three native facial poses. Previous Shiny
// atlases contained beige islands and required destructive alpha masking.
// Recolor the *normal* atlas instead: keep its geometry and alpha untouched.
// This also keeps the original normal form 100% unchanged.
export function recolorNormalFaceForShiny(pixels, width, height) {
    if (pixels.length !== width * height * 4)
        throw new Error('Invalid normal face frame');
    const out = new Uint8ClampedArray(pixels);
    const count = width * height;

    // The normal atlas has one almost-neutral grey backdrop. Recolor ONLY
    // its edge-connected area to the native Shiny face tone. An enclosed
    // white sclera is not connected to this backdrop, and is not recolored.
    const base = [pixels[0], pixels[1], pixels[2]];
    const skin = [181, 170, 161]; // Shiny FaceBase tone, #b5aaa1
    const connected = new Uint8Array(count);
    const queue = new Int32Array(count);
    let head = 0, tail = 0;
    const isBackdrop = position => {
        const p = position * 4;
        const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
        const neutral = Math.max(r,g,b) - Math.min(r,g,b);
        // A tight match deliberately excludes the slightly brighter white
        // sclera, even when an eye contour is open on a particular pose.
        return neutral <= 7 && Math.hypot(r-base[0],g-base[1],b-base[2]) < 12;
    };
    const visit = p => {
        if (connected[p] || !isBackdrop(p)) return;
        connected[p] = 1;
        queue[tail++] = p;
    };
    for (let x=0;x<width;x++) {
        visit(x);
        visit((height-1)*width+x);
    }
    for (let y=0;y<height;y++) {
        visit(y*width);
        visit(y*width+width-1);
    }
    while (head < tail) {
        const p = queue[head++];
        const x = p % width, y = Math.floor(p / width);
        if (x > 0) visit(p - 1);
        if (x + 1 < width) visit(p + 1);
        if (y > 0) visit(p - width);
        if (y + 1 < height) visit(p + width);
    }
    for (let p=0;p<count;p++) {
        const i=p*4;
        const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        if (connected[p]) {
            // Retain gentle original shading while matching Shiny skin.
            const difference=(r+g+b-base[0]-base[1]-base[2])/3;
            for(let channel=0;channel<3;channel++)
                out[i+channel] = Math.round(skin[channel]+difference*.52);
        } else {
            // On the normal atlas the outer lashes are navy. Shiny's native
            // palette has pale ivory lashes; recolor their BLUE pixels only.
            // Dark neutral eyeliner, the red iris, white sclera, and thin
            // antialiased detail retain the exact normal eye shape/position.
            const blueBias = b - Math.max(r,g);
            if (blueBias > 7 && b > r*1.12 && r < 175) {
                const amount = Math.max(0,Math.min(1,(blueBias-7)/17));
                const ivory = [242,239,236];
                for(let channel=0;channel<3;channel++)
                    out[i+channel] = Math.round(pixels[i+channel] * (1-amount) +
                        ivory[channel] * amount);
            }
        }
        // IMPORTANT: alpha is copied byte-for-byte from the normal atlas.
        // Do not apply transparent cutouts or per-colour alpha thresholds.
    }
    return out;
}

async function loadFrames(id, original, shiny) {
    // Shiny Cinderace is rebuilt from the complete, perfect normal atlas.
    // Other species keep their original dedicated Shiny facial atlases.
    const fromNormal = id === 'cinderace' && shiny;
    const suffix = shiny && !fromNormal ? '-shiny' : '';
    const atlas = await loader.loadAsync(new URL(`./visuals/${id}-face${suffix}.webp`, import.meta.url).href);
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, i * height, image.width, height,
            0, 0, image.width, height);
        if (fromNormal) {
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            frame.data.set(recolorNormalFaceForShiny(
                frame.data, canvas.width, canvas.height));
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
        // FaceBase is needed to cover the dark eye-hole surface in the model.
        // Its previous tint (#98918a) was darker than the surrounding skin,
        // leaving visible brown islands on nose and cheeks. Keep this surface
        // opaque, but move it toward the body skin colour instead.
        for (const [, normal, rare] of materials) {
            if (!/_FaceBase$/.test(normal.name)) continue;
            rare.transparent = false;
            rare.opacity = 1;
            rare.color.set('#b5aaa1');
            rare.depthWrite = true;
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
            // Shiny now uses the same complete opaque face atlas and material
            // behavior as the normal form: no clipped eye or skin surfaces.
            // FaceBase remains the original opaque Shiny material underneath.
            shiny.transparent = normal.transparent;
            shiny.alphaTest = normal.alphaTest;
            shiny.opacity = normal.opacity;
            shiny.depthWrite = normal.depthWrite;
            shiny.polygonOffset = normal.polygonOffset;
            shiny.polygonOffsetFactor = normal.polygonOffsetFactor;
            shiny.polygonOffsetUnits = normal.polygonOffsetUnits;
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
