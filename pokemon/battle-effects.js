const TAU = 2 * Math.PI;
const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (a, b, amount) => a + (b - a) * amount;
const FX_CELL = 96;
let atlas;

export function loadAttackSprites() {
    if (atlas) return;
    atlas = new Image();
    atlas.src = new URL('./visuals/attack-fx.webp', import.meta.url).href;
}

function sprite(ctx, frame, x, y, width, height, opacity, turn = 0) {
    if (!atlas?.naturalWidth || opacity <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.globalAlpha = clamp(opacity);
    ctx.drawImage(atlas, frame % 8 * FX_CELL, Math.floor(frame / 8) * FX_CELL,
        FX_CELL, FX_CELL, -width / 2, -height / 2, width, height);
    ctx.restore();
}

function ramp(start, end, value) {
    const fraction = clamp((value - start) / (end - start));
    return fraction * fraction * (3 - 2 * fraction);
}

function drawTackle(ctx, time, { x, hit, hitX = x, floor, modelHeight, extent }) {
    const age = (time - (hit ?? 0.87) + 0.04) / 0.16;
    if (age < 0 || age >= 1) return;
    const size = extent * lerp(0.22, 0.63, age);
    sprite(ctx, 0, hitX, floor - modelHeight * 0.41, size, size, 1 - age, 0.18);
}

function attackPoint(frame, y, distance) {
    const { x, extent, width, depth, forward } = frame;
    const margin = Math.min(extent * 0.19, width * 0.2);
    const along = forward * distance;
    const room = along >= 0 ? width - margin - x : x - margin;
    return {
        x: x + Math.sign(along) * Math.min(Math.abs(along), Math.max(0, room)),
        y: y + depth * distance * 0.28,
        scale: 1 + depth * distance / extent * 0.32,
    };
}

function drawFireSpin(ctx, time, frame) {
    const { floor, modelHeight, extent, direction } = frame;
    const age = time - 0.23;
    if (age < 0 || age > 0.62) return;
    const y = floor - modelHeight * 0.43;
    for (let i = 0; i < 3; i++) {
        const travel = (age - i * 0.086) / 0.28;
        if (travel < 0 || travel >= 1) continue;
        const point = attackPoint(frame, y + extent * (i - 1) * 0.085, extent * travel * 0.67);
        const size = extent * point.scale;
        sprite(ctx, 1, point.x, point.y, size * 0.49, size * 0.37, 0.88 * (1 - travel), direction);
    }
    const impact = (age - 0.2) / 0.32;
    if (impact < 0 || impact >= 1) return;
    const point = attackPoint(frame, y, extent * 0.67);
    const size = extent * point.scale;
    sprite(ctx, 2, point.x, point.y, size * lerp(0.23, 0.48, impact), size * 0.38, 1 - impact);
}

function drawFlameCharge(ctx, time, frame) {
    const { x, floor, modelHeight, extent, direction } = frame;
    const y = floor - modelHeight * 0.35;
    const buildup = ramp(0.10, 0.36, time) * (1 - ramp(1.32, 1.85, time));
    for (let i = 0; i < 3; i++) {
        const angle = i * TAU / 3 + time * 7;
        const size = extent * 0.34;
        sprite(ctx, 5 + Math.floor(time * 14 + i) % 4, x + Math.cos(angle) * extent * 0.22,
            y + Math.sin(angle) * extent * 0.13, size, size, buildup * 0.82, angle * 0.4);
    }
    const release = (time - 1.85) / 0.39;
    if (release >= 0 && release < 1) {
        const point = attackPoint(frame, y, extent * release * 0.72);
        const size = extent * point.scale * lerp(0.34, 0.62, release);
        sprite(ctx, 5 + Math.floor(release * 4), point.x, point.y, size, size, 1 - release * 0.36, direction);
    }
    const impact = (time - 2.24) / 0.41;
    if (impact >= 0 && impact < 1) {
        const point = attackPoint(frame, y - impact * extent * 0.11, extent * 0.72);
        const size = extent * point.scale * 0.61;
        sprite(ctx, 5 + Math.floor(impact * 4), point.x, point.y, size, size, 1 - impact);
    }
}

function drawPyroBall(ctx, time, frame) {
    const { floor, modelHeight, extent, direction, forward, depth } = frame;
    const age = time - 0.37;
    if (age < 0 || age >= 1.47) return;
    const flight = ramp(0.715, 1, age);
    const y = floor - modelHeight * 0.22 - Math.sin(Math.PI * flight) * extent * 0.21;
    const point = attackPoint(frame, y, extent * lerp(0.18, 0.93, flight));
    const intensity = ramp(0.02, 0.24, age) * (1 - ramp(1, 1.24, age));
    const size = extent * point.scale * lerp(0.15, 0.40, ramp(0.1, 0.715, age));
    if (flight > 0) {
        sprite(ctx, 1, point.x - forward * size * 0.35, point.y - depth * size * 0.12, size * 1.5, size * 0.65,
            intensity * 0.58, direction);
    }
    sprite(ctx, 4, point.x, point.y, size, size, intensity, age * 3.8);
    const impact = (age - 1) / 0.42;
    if (impact < 0 || impact >= 1) return;
    for (let i = 0; i < 8; i++) {
        const angle = i * TAU / 8;
        const spread = extent * (0.07 + impact * 0.32) * point.scale;
        sprite(ctx, 3, point.x + Math.cos(angle) * spread, point.y + Math.sin(angle) * spread * 0.68,
            extent * 0.15, extent * 0.15, (1 - impact) * 0.84, angle);
    }
}

function drawMaxFlare(ctx, time, frame) {
    const { floor, modelHeight, extent, duration, species } = frame;
    const phase = clamp(time / Math.max(duration, 0.01));
    // Max Flare must originate high above a Dynamax Pokémon, rather than
    // reusing the ordinary chest-height Flame Charge path.
    const originY = floor - modelHeight * (species === 'cinderace' ? 0.70 : 0.61);
    const charge = ramp(0.06, 0.28, phase) * (1 - ramp(0.45, 0.59, phase));
    for (let i = 0; i < 3; i++) {
        const angle = phase * 8 + i * TAU / 3;
        sprite(ctx, 5 + (i % 4), frame.x + Math.cos(angle) * extent * 0.21,
            originY + Math.sin(angle) * extent * 0.11, extent * 0.43, extent * 0.46,
            charge * 0.8, angle * 0.24);
    }
    // The enlarged flames rise in an arc and strike farther away than the
    // normal move; the source animation and its duration are not changed.
    for (let i = 0; i < 6; i++) {
        const age = (phase - 0.34 - i * 0.028) / 0.45;
        if (age < 0 || age >= 1) continue;
        const progress = ramp(0, 0.75, age);
        const arc = Math.sin(Math.PI * progress) * extent * 0.26;
        const y = originY - i * extent * 0.023 - arc;
        const point = attackPoint(frame, y, extent * progress * 0.98);
        const size = extent * point.scale * lerp(0.52, 0.99, progress);
        sprite(ctx, 5 + Math.min(3, Math.floor(age * 4)), point.x, point.y,
            size, size * 1.07, (1 - age) * 0.9, (i - 2.5) * 0.17);
    }
    const hit = (phase - 0.69) / 0.25;
    if (hit >= 0 && hit < 1) {
        const point = attackPoint(frame, originY - extent * 0.11, extent * 0.98);
        const radius = extent * lerp(0.33, 1.08, hit) * point.scale;
        sprite(ctx, 2, point.x, point.y, radius, radius * 0.82, (1 - hit) * 0.95);
        for (let i = 0; i < 6; i++) {
            const angle = i * TAU / 6;
            sprite(ctx, 3, point.x + Math.cos(angle) * radius * 0.47,
                point.y + Math.sin(angle) * radius * 0.4,
                extent * 0.19, extent * 0.19, (1 - hit) * 0.8, angle);
        }
    }
}

const drawMoves = { tackle: drawTackle, spin: drawFireSpin, charge: drawFlameCharge, ball: drawPyroBall, max: drawMaxFlare };

export class BattleEffects {
    constructor(stage, target) {
        loadAttackSprites();
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'pokemon-battle-effects';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.canvas.hidden = true;
        this.ctx = this.canvas.getContext('2d');
        stage.insertBefore(this.canvas, target);
    }

    clear() {
        this.canvas.hidden = true;
    }

    draw(kind, frame) {
        const ctx = this.ctx;
        const drawMove = drawMoves[kind];
        if (!ctx || !drawMove) return;
        const { time, width, height, modelHeight, angle } = frame;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const pixelWidth = Math.round(width * dpr);
        const pixelHeight = Math.round(height * dpr);
        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.canvas.width = pixelWidth;
            this.canvas.height = pixelHeight;
        }
        this.canvas.hidden = false;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const extent = Math.min(Math.max(26, modelHeight), width * 0.58);
        const forward = Math.sin(angle);
        const depth = Math.cos(angle);
        const direction = Math.atan2(depth * 0.28, forward);
        drawMove(ctx, time, { ...frame, extent, forward, depth, direction });
    }
}
