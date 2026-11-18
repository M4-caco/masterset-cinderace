import {
    BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial,
    SRGBColorSpace, TextureLoader, Vector3,
} from './vendor/three-gltf.js';

const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const random = (index, salt) => {
    const n = Math.sin((index + 11) * 78.233 + salt * 26.921) * 43758.5453;
    return n - Math.floor(n);
};

// Use the extracted attackfx sprites already bundled with the viewer.
// Unlike the old 2D ring, each jet has a 3D floor position, a timed
// emission from the animated foot, and its own rising/fading trajectory.
const FLAME_FRAMES = [5, 6, 7, 8];
const EMIT_DELAY = 0.12;
const EMIT_SPACING = 0.063;
const FLAME_LIFE = 0.49;

function flameQuad(frame) {
    const u0 = (frame % 8) / 8, u1 = u0 + 1 / 8;
    const v1 = 1 - Math.floor(frame / 8) / 4, v0 = v1 - 1 / 4;
    const geometry = new BufferGeometry();
    // Pivot at the foot-contact position rather than the sprite centre.
    geometry.setAttribute('position', new Float32BufferAttribute([
        -0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0,
        -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0,
    ], 3));
    geometry.setAttribute('uv', new Float32BufferAttribute([
        u0, v0, u1, v0, u1, v1,
        u0, v0, u1, v1, u0, v1,
    ], 2));
    geometry.computeVertexNormals();
    return geometry;
}

function feetFor(model) {
    if (model.groundFireFeet) return model.groundFireFeet;
    const feet = [];
    model.root.traverse(node => {
        if (/^(?:LFoot|RFoot)_\d+$/.test(node.name)) feet.push(node);
    });
    model.groundFireFeet = feet;
    return feet;
}

export function groundFlameMotion(index, time, height, origin, angle) {
    const start = EMIT_DELAY + index * EMIT_SPACING;
    const age = time - start;
    if (age < 0 || age >= FLAME_LIFE) return null;
    const progress = clamp(age / FLAME_LIFE);
    const spread = height * (0.035 + random(index, 1) * 0.11);
    const offset = angle + (random(index, 2) - 0.5) * Math.PI * 1.4;
    // Flames spread along the kick, not in a symmetrical orbit.
    const path = height * (0.026 + random(index, 3) * 0.065) * progress;
    const rise = Math.sin(Math.PI * Math.pow(progress, 0.78));
    return {
        x: origin.x + Math.sin(offset) * spread + Math.sin(angle) * path,
        z: origin.z + Math.cos(offset) * spread + Math.cos(angle) * path,
        y: origin.y + height * (0.012 + 0.045 * progress),
        width: height * (0.10 + random(index, 4) * 0.045) * (0.8 + rise * 0.3),
        height: height * (0.18 + random(index, 5) * 0.12) * rise,
        opacity: Math.pow(1 - progress, 0.84) * Math.min(1, age / 0.048),
        rotation: (random(index, 6) - 0.5) * 0.45 + progress * (random(index, 7) - 0.5) * 0.35,
        frame: Math.floor((progress * 4 + random(index, 8) * 2)) % 4,
    };
}

export class GroundFireTrail {
    constructor(scene, compact = false) {
        this.scene = scene;
        this.group = new Group();
        this.group.name = 'Fire from animated foot contacts';
        this.group.visible = false;
        scene.add(this.group);
        this.geometries = FLAME_FRAMES.map(flameQuad);
        this.texture = new TextureLoader().load(
            new URL('./visuals/attack-fx.webp', import.meta.url).href,
        );
        this.texture.colorSpace = SRGBColorSpace;
        this.particles = [];
        this.active = false;
        const count = compact ? 8 : 14;
        for (let i = 0; i < count; i++) {
            const material = new MeshBasicMaterial({
                map: this.texture,
                transparent: true,
                alphaTest: 0.01,
                opacity: 0,
                depthWrite: false,
                side: 2,
                toneMapped: false,
            });
            const mesh = new Mesh(this.geometries[0], material);
            mesh.name = 'Fire tongue';
            mesh.visible = false;
            mesh.frustumCulled = false;
            mesh.renderOrder = 1;
            this.particles.push({ mesh, origin: null });
            this.group.add(mesh);
        }
    }

    begin() {
        this.clear();
        this.active = true;
        this.group.visible = true;
    }

    update(time, model, turntable, angle, height) {
        if (!this.active) return false;
        if (!(height > 0) || !Number.isFinite(time)) {
            this.clear();
            return false;
        }
        if (time >= EMIT_DELAY + this.particles.length * EMIT_SPACING + FLAME_LIFE) {
            this.clear();
            return false;
        }
        model.root.updateWorldMatrix(true, true);
        const feet = feetFor(model);
        const ground = turntable.localToWorld(new Vector3(0, 0, 0));
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const start = EMIT_DELAY + i * EMIT_SPACING;
            if (!p.origin && time >= start) {
                const foot = feet.length ? feet[i % feet.length] : model.root;
                const world = foot.getWorldPosition(new Vector3());
                p.origin = { x: world.x, y: ground.y + height * 0.009, z: world.z };
            }
            const flame = p.origin && groundFlameMotion(i, time, height, p.origin, angle);
            p.mesh.visible = Boolean(flame);
            if (!flame) continue;
            p.mesh.geometry = this.geometries[flame.frame];
            p.mesh.position.set(flame.x, flame.y, flame.z);
            p.mesh.scale.set(flame.width, flame.height, 1);
            p.mesh.rotation.set(0, 0, flame.rotation);
            p.mesh.material.opacity = flame.opacity;
        }
        return true;
    }

    clear() {
        this.active = false;
        this.group.visible = false;
        for (const particle of this.particles) {
            particle.origin = null;
            particle.mesh.visible = false;
            particle.mesh.material.opacity = 0;
        }
    }

    dispose() {
        this.clear();
        this.scene.remove(this.group);
        this.group.clear();
        this.particles.forEach(({ mesh }) => mesh.material.dispose());
        this.geometries.forEach(geometry => geometry.dispose());
        this.texture.dispose();
    }
}
