globalThis.ProgressEvent = class { constructor(type, data) { this.type = type; Object.assign(this, data); } };
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const root = new URL('../', import.meta.url).pathname;
const { GLTFLoader, Group, OrthographicCamera, AnimationMixer, Vector3 } = await import(pathToFileURL(root + 'pokemon/vendor/three-gltf.js'));
const { effectSpace } = await import(pathToFileURL(root + 'pokemon/effect-space.js'));
const camera = new OrthographicCamera(-2, 2, 2, -2, .1, 100);
camera.position.set(0, 0, 5);
camera.updateMatrixWorld(true);
let count = 0;
for (const id of ['scorbunny', 'raboot', 'cinderace', 'cinderace-gigamax']) {
    const json = JSON.parse(await readFile(root + `pokemon/models/${id}.gltf`, 'utf8'));
    for (const buffer of json.buffers) buffer.uri = 'data:application/octet-stream;base64,' + (await readFile(root + 'pokemon/models/' + buffer.uri)).toString('base64');
    delete json.images; delete json.textures; delete json.materials;
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
    const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), '');
    const model = { id, root: gltf.scene };
    let feeding;
    model.root.traverse(node => {
        if (/^Head_\d+$/.test(node.name)) model.head = node;
        if (/^Feeding_Socket_\d+$/.test(node.name)) feeding = node;
    });
    model.root.updateMatrixWorld(true);
    if (id === 'raboot') model.mouthLocal = model.head.worldToLocal(feeding.getWorldPosition(new Vector3()));
    const turntable = new Group(); turntable.add(model.root);
    const mixer = new AnimationMixer(model.root);
    const clip = gltf.animations.find(c => /especial/i.test(c.name)) ?? gltf.animations[0];
    mixer.clipAction(clip).play();
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        turntable.rotation.y = angle;
        for (const time of [0, .4, .8, 1.2]) {
            mixer.setTime(time);
            const effect = id.includes('gigamax') ? 'gmax' : 'flamethrower';
            const attack = { effect, time, clipDuration: clip.duration };
            const frame = effectSpace(model, turntable, camera, 800, 800, attack);
            const start = frame.projectAttack(0);
            assert.equal(start.x, frame.source.x);
            assert.equal(start.y, frame.source.y);
            const ahead = frame.projectAttack(100);
            assert.ok([ahead.x, ahead.y, frame.source.x, frame.source.y].every(Number.isFinite));
            assert.equal(ahead.scale, 1);
            if (id !== 'cinderace-gigamax') {
                assert.equal(frame.anchorType, 'mouth');
                let expected;
                if (id === 'raboot') {
                    expected = model.head.localToWorld(model.mouthLocal.clone());
                } else {
                    let upper, lower;
                    model.root.traverse(node => {
                        if (/^EndUpperJaw_\d+$/.test(node.name)) upper = node;
                        if (/^EndLowerJaw_\d+$/.test(node.name)) lower = node;
                    });
                    expected = upper.getWorldPosition(new Vector3())
                        .add(lower.getWorldPosition(new Vector3())).multiplyScalar(0.5);
                }
                const projectedMouth = expected.clone().project(camera);
                assert.ok(Math.abs(frame.source.x - (projectedMouth.x + 1) * 400) < 1e-4,
                    'flame source must stay on animated mouth');
                assert.ok(Math.abs(frame.source.y - (1 - projectedMouth.y) * 400) < 1e-4,
                    'flame source height must follow animated mouth');
                const facing = expected.clone().sub(model.head.getWorldPosition(new Vector3())).normalize();
                const projectedAhead = expected.clone().addScaledVector(facing, 0.5).project(camera);
                assert.ok(Math.abs(ahead.x - (projectedAhead.x + 1) * 400) < 1e-4);
                assert.ok(Math.abs(ahead.y - (1 - projectedAhead.y) * 400) < 1e-4);
            } else {
                assert.equal(frame.anchorType, 'gmax-ball');
            }
            assert.equal(frame.groundPoint(0, 100).behind, false);
            assert.equal(frame.groundPoint(Math.PI, 100).behind, true);
            assert.ok(Math.abs(frame.groundPoint(0, 100).y - frame.groundPoint(Math.PI, 100).y) < 1e-5);
            count++;
        }
    }
    // Verify the toes, rather than the hip/waist, drive every kicked shot.
    if (id !== 'cinderace-gigamax') {
        let toe;
        model.root.traverse(node => {
            if (/^EndRToe2_\d+$/.test(node.name)) toe = node;
        });
        assert.ok(toe, 'original animated right toe must exist');
        for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
            turntable.rotation.y = angle;
            mixer.setTime(0.25);
            const kicked = effectSpace(model, turntable, camera, 800, 800,
                { effect: 'ball', time: 0.25, clipDuration: clip.duration });
            assert.equal(kicked.anchorType, 'foot');
            const tip = toe.getWorldPosition(new Vector3()).project(camera);
            assert.ok(Math.abs(kicked.source.x - (tip.x + 1) * 400) < 1e-4);
            assert.ok(Math.abs(kicked.source.y - (1 - tip.y) * 400) < 1e-4);
            const max = effectSpace(model, turntable, camera, 800, 800,
                { effect: 'max', time: 0.25, clipDuration: clip.duration });
            assert.equal(max.anchorType, id === 'cinderace' ? 'foot' : 'mouth');
        }
    }
    const attack = { effect: 'ball', time: 1.1, clipDuration: clip.duration };
    const frame1 = effectSpace(model, turntable, camera, 800, 800, attack);
    mixer.setTime(1.4); turntable.position.x += 1;
    const frame2 = effectSpace(model, turntable, camera, 800, 800, attack);
    assert.deepEqual(frame1.source, frame2.source, 'projectile moved with recovery pose');
}
console.log(`PASS: ${count} actual model/animation/rotation samples; stationary launch after recovery; ground plane and orthographic projection.`);

// Test the public interaction guards without creating a WebGL renderer.
// The single-tap delay and rapid-tap timing are tested in pokemon-tap-gestures.mjs.
const showcase = await readFile(root + 'pokemon/showcase.js', 'utf8');
function method(name, next) {
    const body = showcase.split('    ' + name + '() {')[1].split('    ' + next + '() {')[0];
    return new Function('MOVES', 'return function() {' + body.slice(0, body.lastIndexOf('}')) + '}')({
        physical: 'Ataque físico',
    });
}
const tap = method('tapAttack', 'tapGigamaxReaction');
const quick = method('playQuickAttack', 'playAttackCry');
let played = 0;
const fake = {
    model: { clips: new Set(['Ataque físico']) },
    loading: false, form: 'gigamax', lastAttackTap: 0,
    tapGigamaxReaction: () => {}, // its delayed roar is tested separately
    play: () => played++,
};
for (let i = 0; i < 100; i++) {
    tap.call(fake);
    quick.call(fake);
}
assert.equal(played, 0, 'Gigamax rapid taps must not attack');
assert.equal(fake.lastAttackTap, -Infinity);
fake.form = 'normal';
quick.call(fake);
assert.equal(played, 1, 'Normal quick attacks remain available');
console.log('PASS: Gigamax tap guards; normal physical attack.');
