import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();

// The native Cinderace rare Eye_Col texture is correct. An older handmade
// three-frame atlas contained big opaque tan patches around the Shiny eyes.
// Preserve the native frame and reconstruct only the animated lids on top of
// the original texture instead of painting over the cheek and forehead.
export function shinyFaceInk(r, g, b) {
    const redIris = r > 110 && g < 150 && r - g > 44 && r - b > 50;
    const warmPatch = r > 109 && g > 99 && r - g > 6 && g - b > 3;
    if (warmPatch && !redIris) return false;
    const darkLine = r < 145 && g < 145 && b < 145;
    const sclera = r >= 205 && g >= 205 && b >= 205;
    return redIris || darkLine || sclera;
}

function nativeCinderaceShinyFrame(original, atlas, pose) {
    if (pose === 0) return original;
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    context.drawImage(original.image, 0, 0, canvas.width, height);
    const native = context.getImageData(0, 0, canvas.width, height);
    const background = [native.data[0], native.data[1], native.data[2]];
    const draft = document.createElement('canvas');
    draft.width = canvas.width;
    draft.height = height;
    const ctx = draft.getContext('2d', { alpha: false });
    ctx.drawImage(image, 0, pose * height, canvas.width, height, 0, 0, canvas.width, height);
    const input = ctx.getImageData(0, 0, canvas.width, height).data;
    const pixels = native.data;
    // The animated eyes occupy the upper half of the native 256px atlas.
    // The lower pupils are unchanged across the original three poses.
    for (let y = 0; y < Math.floor(height * 0.49); y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            pixels[index] = background[0];
            pixels[index + 1] = background[1];
            pixels[index + 2] = background[2];
            if (shinyFaceInk(input[index], input[index + 1], input[index + 2])) {
                pixels[index] = input[index];
                pixels[index + 1] = input[index + 1];
                pixels[index + 2] = input[index + 2];
            }
        }
    }
    context.putImageData(native, 0, 0);
    return canvas;
}

async function loadFrames(id, original, shiny) {
    const suffix = shiny ? '-shiny' : '';
    const atlas = await loader.loadAsync(new URL(`./visuals/${id}-face${suffix}.webp`, import.meta.url).href);
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        if (id === 'cinderace' && shiny && i === 0) {
            // Restore the exact native rare face texture during idle.
            frames.push(original);
            continue;
        }
        const canvas = id === 'cinderace' && shiny
            ? nativeCinderaceShinyFrame(original, atlas, i)
            : document.createElement('canvas');
        if (id !== 'cinderace' || !shiny) {
            canvas.width = image.width;
            canvas.height = height;
            canvas.getContext('2d', { alpha: false }).drawImage(image, 0, i * height, image.width, height,
                0, 0, image.width, height);
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
