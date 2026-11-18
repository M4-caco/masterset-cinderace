import {
    Group, IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial,
    SphereGeometry,
} from './vendor/three-gltf.js';

const TAU = Math.PI * 2;
const DURATION = 1.55;
const GRAVITY = 9.8;
const hash = (index, salt) => {
    const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
    return value - Math.floor(value);
};
const clamp = value => Math.max(0, Math.min(1, value));

// Analytical motion makes the result independent of frame rate and prevents
// particles from tunnelling through the floor when mobile frames are skipped.
export function rockFlight(seed, elapsed) {
    const time = Math.max(0, elapsed);
    const ground = seed.ground;
    const firstLanding = (seed.up + Math.sqrt(
        seed.up * seed.up + 2 * GRAVITY * (seed.startY - ground))) / GRAVITY;
    const reboundUp = seed.up * 0.31;
    const bounceTime = 2 * reboundUp / GRAVITY;
    let y;
    if (time < firstLanding) {
        y = seed.startY + seed.up * time - GRAVITY * time * time / 2;
    } else if (time < firstLanding + bounceTime) {
        const bouncing = time - firstLanding;
        y = ground + reboundUp * bouncing - GRAVITY * bouncing * bouncing / 2;
    } else {
        y = ground;
    }
    const outward = seed.startRadius + seed.outward * (
        Math.min(time, firstLanding) + Math.max(0, time - firstLanding) * 0.24);
    return {
        x: Math.cos(seed.angle) * outward,
        y: Math.max(ground, y),
        z: Math.sin(seed.angle) * outward,
        fade: clamp((DURATION - time) / 0.34),
        rotation: time * seed.spin,
    };
}

function buildRockSeeds(height, count) {
    return Array.from({ length: count }, (_, i) => ({
        angle: TAU * (i + hash(i, 1) * 0.6) / count,
        startRadius: height * (0.075 + hash(i, 2) * 0.058),
        startY: height * 0.024,
        ground: height * 0.016,
        outward: height * (0.44 + hash(i, 3) * 0.40),
        up: 2.0 + height * (0.36 + hash(i, 4) * 0.23),
        spin: (hash(i, 5) - 0.5) * 17,
        radius: height * (0.018 + hash(i, 6) * 0.023),
        stretch: 0.65 + hash(i, 7) * 0.85,
    }));
}

export class MaxLandingImpact {
    constructor(scene, compact = false) {
        this.scene = scene;
        this.group = new Group();
        this.group.name = 'Max landing debris (pooled)';
        this.group.visible = false;
        this.scene.add(this.group);
        this.rocks = [];
        this.dust = [];
        this.active = false;
        this.geometry = new IcosahedronGeometry(1, 0);
        this.dustGeometry = new SphereGeometry(1, 8, 5);
        this.rockMaterials = [0x655c58, 0x867973, 0xaca098].map(color =>
            new MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
        const rockCount = compact ? 8 : 17;
        const dustCount = compact ? 7 : 14;
        for (let i = 0; i < rockCount; i++) {
            const mesh = new Mesh(this.geometry, this.rockMaterials[i % this.rockMaterials.length]);
            mesh.name = 'Max debris rock';
            mesh.visible = false;
            mesh.castShadow = false;
            this.rocks.push(mesh);
            this.group.add(mesh);
        }
        for (let i = 0; i < dustCount; i++) {
            const material = new MeshBasicMaterial({
                color: i % 3 ? 0xc8b9a9 : 0x9f8f82,
                transparent: true, opacity: 0, depthWrite: false,
            });
            const mesh = new Mesh(this.dustGeometry, material);
            mesh.name = 'Max landing dust';
            mesh.visible = false;
            this.dust.push(mesh);
            this.group.add(mesh);
        }
    }

    start(height, now) {
        this.clear();
        if (!(height > 0) || !Number.isFinite(now)) return;
        this.height = height;
        this.startAt = now;
        this.seeds = buildRockSeeds(height, this.rocks.length);
        this.active = true;
        this.group.visible = true;
        this.update(now);
    }

    update(now) {
        if (!this.active) return false;
        const age = Math.max(0, (now - this.startAt) / 1000);
        if (age >= DURATION) {
            this.clear();
            return false;
        }
        this.rocks.forEach((mesh, index) => {
            const seed = this.seeds[index];
            const state = rockFlight(seed, age);
            mesh.visible = state.fade > 0;
            mesh.position.set(state.x, state.y, state.z);
            const radius = seed.radius * state.fade;
            mesh.scale.set(radius * seed.stretch, radius * (1.0 / seed.stretch), radius * 0.9);
            mesh.rotation.set(state.rotation * 0.73, state.rotation, state.rotation * 0.4);
        });
        this.dust.forEach((mesh, index) => {
            const offset = index / this.dust.length;
            const delay = offset * 0.12;
            const progress = clamp((age - delay) / 0.86);
            const angle = TAU * (offset + hash(index, 8) * 0.08);
            const spread = this.height * (0.19 + progress * (0.25 + hash(index, 9) * 0.14));
            mesh.visible = age >= delay && progress < 1;
            mesh.position.set(
                Math.cos(angle) * spread,
                this.height * (0.045 + progress * 0.12),
                Math.sin(angle) * spread,
            );
            const diameter = this.height * (0.072 + progress * 0.13);
            mesh.scale.set(diameter, diameter * 0.53, diameter);
            mesh.material.opacity = (1 - progress) ** 2 * (0.19 + hash(index, 10) * 0.13);
        });
        return true;
    }

    clear() {
        this.active = false;
        this.startAt = null;
        this.seeds = null;
        this.group.visible = false;
        for (const mesh of this.rocks) mesh.visible = false;
        for (const mesh of this.dust) {
            mesh.visible = false;
            mesh.material.opacity = 0;
        }
    }

    dispose() {
        this.clear();
        this.scene.remove(this.group);
        this.geometry.dispose();
        this.dustGeometry.dispose();
        this.rockMaterials.forEach(material => material.dispose());
        this.dust.forEach(mesh => mesh.material.dispose());
        this.group.clear();
    }
}
