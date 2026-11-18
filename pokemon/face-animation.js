import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

// This Pokémon GO glTF already has the correctly mapped Eye_Col_rare image.
// Do not replace the actual eye shapes with the manually painted web atlas.
export function nativeRareFacePixels(pixels, width, height) {
    if (pixels.length !== width * height * 4) throw new Error('Invalid rare eye image');
    const result = new Uint8ClampedArray(pixels.length);
    const background = [pixels[0], pixels[1], pixels[2]];
    for (let i = 0; i < pixels.length; i += 4) {
        const diff = Math.max(
            Math.abs(pixels[i] - background[0]),
            Math.abs(pixels[i + 1] - background[1]),
            Math.abs(pixels[i + 2] - background[2]),
        );
        const alpha = clamp((diff - 5) / 12, 0, 1);
        result[i] = pixels[i];
        result[i + 1] = pixels[i + 1];
        result[i + 2] = pixels[i + 2];
        result[i + 3] = Math.round(pixels[i + 3] * alpha);
    }
    return result;
}

function nativeCinderaceRareEyes(original) {
    const width = original.image.width, height = original.image.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(original.image, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height);
    data.data.set(nativeRareFacePixels(data.data, width, height));
    ctx.putImageData(data, 0, 0);
    const texture = new original.constructor(canvas);
    texture.colorSpace = original.colorSpace;
    texture.wrapS = original.wrapS;
    texture.wrapT = original.wrapT;
    texture.magFilter = original.magFilter;
    texture.minFilter = original.minFilter;
    texture.flipY = original.flipY;
    texture.needsUpdate = true;
    return texture;
}

async function loadFrames(id, original, shiny) {
    if (id === 'cinderace' && shiny) {
        // Do not synthesize expressions by stretching/flipping the eye atlas.
        // Hold the genuine rare eye design in all poses until the game's own
        // eye-state offsets have been reconstructed against the actual mesh.
        const native = nativeCinderaceRareEyes(original);
        return [native, native, native];
    }
    const suffix = shiny ? '-shiny' : '';
    const atlas = await loader.loadAsync(new URL(
        './visuals/' + id + '-face' + suffix + '.webp', import.meta.url).href);
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = height;
        canvas.getContext('2d', { alpha: false }).drawImage(
            image, 0, i * height, image.width, height,
            0, 0, image.width, height,
        );
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
        // The original rare FaceBase is nearly white; its native surface
        // needs a skin-coloured tint rather than an opaque white mask.
        for (const [, normal, rare] of materials) {
            if (!/_FaceBase$/.test(normal.name)) continue;
            rare.color.set('#98918a');
            rare.transparent = false;
            rare.depthWrite = true;
            rare.needsUpdate = true;
        }
    }
    const pairs = materials.filter(([, normal]) =>
        /_Face(?:Tex|Composite)$/.test(normal.name));
    const bindings = await Promise.all(pairs.map(async ([, normal, rare]) => {
        const [normalFrames, rareFrames] = await Promise.all([
            loadFrames(id, normal.map, false),
            loadFrames(id, rare.map, true),
        ]);
        if (id === 'cinderace') {
            rare.transparent = true;
            rare.alphaTest = 0.03;
            rare.depthWrite = false;
            rare.polygonOffset = true;
            rare.polygonOffsetFactor = -1;
            rare.polygonOffsetUnits = -1;
            rare.needsUpdate = true;
        }
        return [[normal, normalFrames], [rare, rareFrames]];
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
        const state = Math.max(0, ...face.controllers.map(eye => eye.position.y));
        applyFace(face, state > 0.28 ? 1 : state > 0.14 ? 2 : 0);
        return;
    }
    const phase = seconds % 4.1;
    applyFace(face, phase > 2.83 && phase < 2.96 ? 2 : 0);
}
