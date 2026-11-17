import { Box3, Vector3 } from './vendor/three-gltf.js';

const references = new WeakMap();
function anchors(model) {
    if (references.has(model)) return references.get(model);
    const result = {};
    model.root.traverse(node => {
        if (/^RFoot_\d+$/.test(node.name)) result.foot = node;
        if (/^RootJaw_\d+$/.test(node.name)) result.mouth = node;
        if (/FireBallInSkin/.test(node.name) && node.isMesh) result.ball = node;
    });
    result.mouth ??= model.head;
    references.set(model, result);
    return result;
}

// All coordinates use the same camera and world matrices as the character.
// Pixel distances are converted back to world units before projection. The
// orthographic camera has no perspective enlargement or artificial depth tilt.
export function effectSpace(model, turntable, camera, width, height, attack) {
    model.root.updateWorldMatrix(true, true);
    camera.updateMatrixWorld(true);
    const refs = anchors(model);
    const source = new Vector3();
    const ballBounds = new Box3();
    const useBall = attack.effect === 'gmax' && refs.ball;
    if (useBall) {
        const geometry = refs.ball.isSkinnedMesh ? refs.ball : refs.ball.geometry;
        geometry.computeBoundingBox();
        ballBounds.copy(geometry.boundingBox).applyMatrix4(refs.ball.matrixWorld);
        ballBounds.getCenter(source);
    } else {
        const node = ['flamethrower', 'max'].includes(attack.effect)
            ? refs.mouth : refs.foot;
        (node ?? model.head ?? model.root).getWorldPosition(source);
    }
    const forward = new Vector3(0, 0, 1).transformDirection(model.root.matrixWorld);
    const pixelToWorld = (camera.top - camera.bottom) / height;
    const project = position => {
        const p = position.clone().project(camera);
        return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2, scale: 1 };
    };
    const release = { spin: 0.23, ball: 1.085, charge: 1.85, gmax: 0.76,
        max: attack.clipDuration * 0.34 }[attack.effect];
    // Freeze the launch transform. A projectile must not follow the recovery
    // pose, nor inherit later changes to the automatic character framing.
    if (release !== undefined && attack.time >= release) {
        attack.emission ??= { source: source.clone(), forward: forward.clone() };
        source.copy(attack.emission.source);
        forward.copy(attack.emission.forward);
    }
    const origin = project(source);
    const ahead = project(source.clone().add(forward));
    const ground = turntable.localToWorld(new Vector3());
    return {
        source: origin,
        direction: Math.atan2(ahead.y - origin.y, ahead.x - origin.x),
        projectAttack(distance, verticalOffset = 0) {
            return project(source.clone().addScaledVector(forward, distance * pixelToWorld)
                .add(new Vector3(0, -verticalOffset * pixelToWorld, 0)));
        },
        groundPoint(angle, radius) {
            const point = ground.clone().add(new Vector3(
                Math.sin(angle) * radius * pixelToWorld, 0,
                Math.cos(angle) * radius * pixelToWorld));
            return { ...project(point), behind: point.z < ground.z };
        },
    };
}
