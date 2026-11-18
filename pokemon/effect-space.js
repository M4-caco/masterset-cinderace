import { Vector3 } from './vendor/three-gltf.js';

const references = new WeakMap();
function anchors(model) {
    if (references.has(model)) return references.get(model);
    const result = {};
    model.root.traverse(node => {
        if (/^EndRToe2_\d+$/.test(node.name)) result.toe = node;
        if (/^RFoot_\d+$/.test(node.name)) result.foot = node;
        if (/^EndUpperJaw_\d+$/.test(node.name)) result.upperJaw = node;
        if (/^EndLowerJaw_\d+$/.test(node.name)) result.lowerJaw = node;
        if (/^Head_\d+$/.test(node.name)) result.head = node;
        if (/^Feeding_Socket_\d+$/.test(node.name)) result.feedingSocket = node;
        if (/FireBallInSkin/.test(node.name) && node.isMesh) result.ball = node;
    });
    result.foot = result.toe ?? result.foot;
    result.head ??= model.head;
    // Raboot has no jaw joints; the original Feeding_Socket is in rig space,
    // not attached to the moving head. Calibrate a local head-space attachment
    // once in the idle pose, so its mouth still follows every head animation.
    if (!result.upperJaw && result.head && result.feedingSocket) {
        model.root.updateWorldMatrix(true, true);
        result.headMouth = result.head.worldToLocal(
            result.feedingSocket.getWorldPosition(new Vector3()));
    }
    references.set(model, result);
    return result;
}

function mouthPosition(model, refs, target) {
    if (refs.upperJaw && refs.lowerJaw) {
        const upper = refs.upperJaw.getWorldPosition(new Vector3());
        const lower = refs.lowerJaw.getWorldPosition(new Vector3());
        return target.copy(upper).add(lower).multiplyScalar(0.5);
    }
    if (refs.head && refs.headMouth) return refs.head.localToWorld(target.copy(refs.headMouth));
    return (refs.head ?? model.root).getWorldPosition(target);
}

function ballPosition(mesh, target) {
    // A skinned mesh needs its deformed bounds, not the static geometry box.
    mesh.computeBoundingBox();
    return mesh.localToWorld(mesh.boundingBox.getCenter(target));
}

// All coordinates use the same camera and world matrices as the character.
// Pixel distances are converted back to world units before projection. The
// orthographic camera has no perspective enlargement or artificial depth tilt.
export function effectSpace(model, turntable, camera, width, height, attack) {
    model.root.updateWorldMatrix(true, true);
    camera.updateMatrixWorld(true);
    const refs = anchors(model);
    const source = new Vector3();
    const useBall = attack.effect === 'gmax' && refs.ball;
    const mouthAttack = attack.effect === 'flamethrower' ||
        (attack.effect === 'max' && model.id !== 'cinderace');
    let anchorType = 'foot';
    if (useBall) {
        ballPosition(refs.ball, source);
        anchorType = 'gmax-ball';
    } else if (mouthAttack) {
        mouthPosition(model, refs, source);
        anchorType = 'mouth';
    } else {
        (refs.foot ?? model.root).getWorldPosition(source);
    }
    const forward = new Vector3(0, 0, 1).transformDirection(model.root.matrixWorld);
    if (mouthAttack && refs.head) {
        // Aim from the physical head toward the opening of the jaws. Unlike
        // the root-only direction, this respects head pitches and 360° yaw.
        const headPosition = refs.head.getWorldPosition(new Vector3());
        const mouthVector = source.clone().sub(headPosition);
        if (mouthVector.lengthSq() > 1e-5) forward.copy(mouthVector.normalize());
    }
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
        anchorType,
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
