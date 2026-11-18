import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();

// Separate the eye art from the old lavender backing and tan eye masks.
// The native FaceBase rare material remains visible behind the decal.
export function shinyFaceInk(r, g, b) {
    const red = r > 110 && g < 175 && r > g * 1.32 && r > b * 1.3;
    const dark = r < 125 && g < 125 && b < 140;
    const white = r > 210 && g > 210 && b > 210 &&
        r >= b - 3 && g >= b - 3;
    return red || dark || white;
}

export function composeShinyEyePixels(native, pose, width, height) {
    const output = new Uint8ClampedArray(width * height * 4);
    const marked = new Uint8Array(width * height);
    const redMarked = new Uint8Array(width * height);
    const eye = (x, y) => y >= height * 0.055 && y < height * 0.44 &&
        ((x >= width * .15 && x <= width * .44) ||
         (x >= width * .56 && x <= width * .85));
    const red = (r, g, b) => r > 110 && g < 175 && r > g * 1.32 && r > b * 1.3;
    const dark = (r, g, b) => r < 125 && g < 125 && b < 140;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (!eye(x, y)) continue;
        const i = (y * width + x) * 4;
        if (red(pose[i], pose[i + 1], pose[i + 2])) redMarked[y * width + x] = 1;
        if (redMarked[y * width + x] ||
            dark(pose[i], pose[i + 1], pose[i + 2])) marked[y * width + x] = 1;
    }
    const near = (x, y, radius, marks = marked) => {
        for (let yy = Math.max(0, y - radius); yy <= Math.min(height - 1, y + radius); yy++)
            for (let xx = Math.max(0, x - radius); xx <= Math.min(width - 1, x + radius); xx++)
                if (marks[yy * width + xx]) return true;
        return false;
    };
    const back = [native[0], native[1], native[2]];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = pose[i], g = pose[i + 1], b = pose[i + 2];
        if (eye(x, y)) {
            const white = r > 210 && g > 210 && b > 210 &&
                r >= b - 3 && g >= b - 3 && near(x, y, 1, redMarked);
            const edge = r < 195 && Math.abs(r - g) < 14 &&
                Math.abs(g - b) < 14 && near(x, y, 2);
            if (marked[y * width + x] || white || edge) {
                output.set([r, g, b, 255], i);
            }
        } else if (y > height * .44) {
            const rr = native[i], gg = native[i + 1], bb = native[i + 2];
            const diff = Math.abs(rr - back[0]) + Math.abs(gg - back[1]) +
                Math.abs(bb - back[2]);
            if (diff > 64 && (red(rr, gg, bb) || dark(rr, gg, bb) ||
                (rr > 210 && gg > 210 && bb > 210 && rr >= bb - 3))) {
                output.set([rr, gg, bb, 255], i);
            }
        }
    }
    return output;
}

function transparentCinderaceShinyFrame(original, atlas, frame) {
    const { image } = atlas;
    const width = image.width, height = image.height / FRAME_COUNT;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const source = document.createElement('canvas');
    source.width = width;
    source.height = height;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(original.image, 0, 0, width, height);
    const native = ctx.getImageData(0, 0, width, height).data;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, frame * height, width, height, 0, 0, width, height);
    const pose = ctx.getImageData(0, 0, width, height).data;
    const data = context.createImageData(width, height);
    data.data.set(composeShinyEyePixels(native, pose, width, height));
    context.putImageData(data, 0, 0);
    return canvas;
}

async function loadFrames(id, original, shiny) {
    const suffix = shiny ? '-shiny' : '';
    const atlas = await loader.loadAsync(new URL(`./visuals/${id}-face${suffix}.webp`, import.meta.url).href);
    const { image } = atlas;
    const height = image.height / FRAME_COUNT;
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
        const cinderaceShiny = id === 'cinderace' && shiny;
        const canvas = cinderaceShiny
            ? transparentCinderaceShinyFrame(original, atlas, i)
            : document.createElement('canvas');
        if (!cinderaceShiny) {
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
    if (id === 'cinderace') {
        // The rare FaceBase from glTF is a solid lavender 4x4 texture.
        // It creates the broad white mask visible in the reported screenshot.
        // Tint the base to the warm grey of the rare body so it occludes any
        // light face islands from BodyAll_SHINY behind the transparent eyes.
        for (const [, normal, shiny] of materials) {
            if (!/_FaceBase$/.test(normal.name)) continue;
            shiny.transparent = false;
            shiny.opacity = 1;
            shiny.color.set('#98918a');
            shiny.depthWrite = true;
            shiny.needsUpdate = true;
        }
    }
    const pairs = materials.filter(([, normal]) => /_Face(?:Tex|Composite)$/.test(normal.name));
    const bindings = await Promise.all(pairs.map(async ([, normal, shiny]) => {
        const [regularFrames, shinyFrames] = await Promise.all([
            loadFrames(id, normal.map, false),
            loadFrames(id, shiny.map, true),
        ]);
        if (id === 'cinderace') {
            // Make only the 3D eye artwork visible: the authentic rare
            // FaceBase underneath supplies all the original face colouring.
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
