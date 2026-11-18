import { TextureLoader } from './vendor/three-gltf.js';

const FRAME_COUNT = 3;
const loader = new TextureLoader();

// Preserve the shape, orientation and three poses of the original web eyes.
// The old eye atlas also contains opaque skin patches, stray dark shapes and
// a lilac/white backdrop. All of those must be transparent outside the eye
// artwork, not painted darker: painting them caused the reported cheek stains.
// Retain the full native Shiny face illustration (skin around the eyes,
// eyelids, eyeliner, red pupils, mouth and all three expressions).
// Only the flat lilac atlas background should become transparent.
// The original Shiny atlas has complete white sclera and tapered eyeliner.
// Mask only the lavender backdrop connected to the canvas edges. Removing
// pale colours globally erases actual sclera and delicate eyelid antialias.
// Never redraw an iris, eyelash or mouth, or change the model's UVs.
// Preserve original Shiny iris, white sclera, tapered eyelashes and lid lines.
// Both the lilac atlas background AND its opaque tan facial backing are merely
// compositing aids, not facial ink. The native 3D FaceBase supplies skin.
// Removing these two flat backing tones prevents grey polygons and leaves the
// full eye art, including whites far from the pupil, untouched.
export function restoreShinyFaceArtwork(pixels, width, height) {
    if (pixels.length !== width * height * 4)
        throw new Error('Invalid Shiny face frame');
    const output = new Uint8ClampedArray(pixels);
    const bg = (Math.floor(height * .92) * width + Math.floor(width * .5)) * 4;
    const skin = (Math.floor(height * .20) * width + Math.floor(width * .08)) * 4;
    const background = [pixels[bg], pixels[bg + 1], pixels[bg + 2]];
    const patch = [pixels[skin], pixels[skin + 1], pixels[skin + 2]];
    const matte = (r,g,b,color,inner,outer) => {
        const d = Math.hypot(r-color[0],g-color[1],b-color[2]);
        return Math.max(0, Math.min(1, (d-inner)/(outer-inner)));
    };
    for (let i=0;i<pixels.length;i+=4) {
        const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        // A small transition only around the removed flat backing tones.
        // All white sclera, black eyelid and red iris pixels remain exact RGB.
        const alpha = matte(r,g,b,background,7,18) *
            matte(r,g,b,patch,9,24);
        output[i+3] = Math.round(pixels[i+3] * alpha);
    }
    return output;
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
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, i * height, image.width, height,
            0, 0, image.width, height);
        if (id === 'cinderace' && shiny) {
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            frame.data.set(restoreShinyFaceArtwork(frame.data, canvas.width, canvas.height));
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
