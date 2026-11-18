import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();

// A few near-white brush marks in the original browser-made Shiny
// composite extend beyond the iris/sclera. Keep the original eyes and all
// their UVs; repaint ONLY those stray white pixels with the adjacent rare
// face colour. Never rotate, mirror, resize or replace the pupils.
export function removeStrayShinyWhites(pixels, width, height) {
    if (pixels.length !== width * height * 4) throw new Error('Invalid Shiny face frame');
    const result = new Uint8ClampedArray(pixels);
    const eyeRegion = (x, y) => y < height * 0.47 &&
        ((x > width * 0.045 && x < width * 0.455) ||
         (x > width * 0.545 && x < width * 0.955));
    const irises = [];
    for (let y = 0; y < height * 0.47; y++) for (let x = 0; x < width; x++) {
        if (!eyeRegion(x, y)) continue;
        const index = (y * width + x) * 4;
        const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
        if (r > 120 && r > g * 1.42 && r > b * 1.4 && g < 150)
            irises.push([x, y]);
    }
    for (let y = 0; y < height * 0.47; y++) for (let x = 0; x < width; x++) {
        if (!eyeRegion(x, y)) continue;
        const index = (y * width + x) * 4;
        const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
        // Reject the lavender atlas background, tan skin and red pupils.
        const white = r > 210 && g > 208 && b > 207 &&
            r >= b - 3 && g >= b - 3 && Math.abs(r - g) < 20;
        if (!white) continue;
        const nearbyIris = irises.some(([cx, cy]) =>
            (cx - x) ** 2 + (cy - y) ** 2 <= 8 ** 2);
        if (nearbyIris) continue; // keep the real thin sclera and highlights
        // The untouched atlas has a warm taupe skin colour around the eyes.
        // Use that same colour instead of inventing transparency/UV offsets.
        result[index] = 184;
        result[index + 1] = 171;
        result[index + 2] = 159;
    }
    return result;
}

async function loadFrames(id, original, shiny) {
    const suffix = shiny ? '-shiny' : '';
    const atlas = await loader.loadAsync(new URL(`./visuals/${id}-face${suffix}.webp`, import.meta.url).href);
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: false });
        context.drawImage(image, 0, i * height, image.width, height,
            0, 0, image.width, height);
        if (id === 'cinderace' && shiny) {
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            frame.data.set(removeStrayShinyWhites(frame.data, canvas.width, canvas.height));
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
