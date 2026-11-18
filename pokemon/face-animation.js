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
// Do not redraw eyes: preserve the real Shiny sclera, eyelid strokes,
// eyelashes, red irises and mouth in all 3 original expression frames.
// Remove two *backing* colours, not any nearby pale eye artwork:
// (1) only the lavender backdrop reachable from an image edge;
// (2) the flat tan eye patch that causes sharp-edged grey face islands.
// The original opaque 3D FaceBase supplies the facial skin underneath.
export function restoreShinyFaceArtwork(pixels, width, height) {
    if (pixels.length !== width * height * 4)
        throw new Error('Invalid Shiny face frame');
    const output = new Uint8ClampedArray(pixels);
    const sample = (Math.floor(height * .92) * width + Math.floor(width / 2)) * 4;
    const background = [pixels[sample], pixels[sample + 1], pixels[sample + 2]];
    const count = width * height;
    const visited = new Uint8Array(count);
    const queue = new Int32Array(count);
    let first = 0, last = 0;
    const distance = position => {
        const i = position * 4;
        return Math.hypot(
            pixels[i] - background[0],
            pixels[i + 1] - background[1],
            pixels[i + 2] - background[2]
        );
    };
    // Flood-fill only the backdrop: preserve pale whites surrounded by the
    // red iris, dark lash or warm Shiny skin, even if close to lilac in RGB.
    const visit = position => {
        if (visited[position] || distance(position) > 16) return;
        visited[position] = 1;
        queue[last++] = position;
    };
    for (let x = 0; x < width; x++) {
        visit(x);
        visit((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
        visit(y * width);
        visit(y * width + width - 1);
    }
    while (first < last) {
        const position = queue[first++];
        const x = position % width;
        const y = Math.floor(position / width);
        if (x > 0) visit(position - 1);
        if (x + 1 < width) visit(position + 1);
        if (y > 0) visit(position - width);
        if (y + 1 < height) visit(position + width);
    }
    for (let position = 0; position < count; position++) {
        if (!visited[position]) continue;
        // Transparent lavender outside the original illustration; a subtle
        // only-at-the-border fade retains texture antialias without a halo.
        const d = distance(position);
        output[position * 4 + 3] = Math.round(
            pixels[position * 4 + 3] * Math.max(0, Math.min(1, (d - 5) / 11))
        );
    }
    // Recover the flat tan mask and its antialiased rim as a clean,
    // skin-matched decal. Earlier corrections recoloured only near-identical
    // tan pixels, leaving a thin grey/lilac contour on the outer eye corners.
    //
    // Tan and lavender are opposite endpoints of an antialiased boundary.
    // Project a pixel onto that colour segment and reject anything outside
    // a small tolerance: the white sclera, eyelid and dark lashes are NOT
    // on that segment, so their original artwork remains untouched.
    const skinSample=(Math.floor(height*.20)*width+Math.floor(width*.08))*4;
    const skinTone=[
        pixels[skinSample],pixels[skinSample+1],pixels[skinSample+2]
    ];
    const skinColor=[181,170,161];
    const direction=background.map((value,i)=>value-skinTone[i]);
    const directionLength=direction.reduce((sum,d)=>sum+d*d,0);
    for(let p=0;p<count;p++){
        const i=p*4;
        const c=[pixels[i],pixels[i+1],pixels[i+2]];
        const t=Math.max(0,Math.min(1,
            c.reduce((sum,value,k)=>sum+(value-skinTone[k])*direction[k],0)
              / directionLength
        ));
        const residual=Math.hypot(...c.map((value,k)=>
            value-(skinTone[k]+t*direction[k])
        ));
        if(residual>8 || t>.98)continue;
        // This only changes matte pixels. The alpha ramp occupies the
        // outermost <5% of the original tan/lavender antialiased edge, rather
        // than exposing the dark underlying face near the eyelashes.
        for(let k=0;k<3;k++)output[i+k]=skinColor[k];
        output[i+3]=Math.round(pixels[i+3]*
            Math.max(0,Math.min(1,(.98-t)/.05)));
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
