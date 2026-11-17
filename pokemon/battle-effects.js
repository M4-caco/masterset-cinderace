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

function glow(ctx, x, y, radiusX, radiusY, opacity, hot = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radiusX, radiusY);
    ctx.globalAlpha = opacity;
    const paint = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    paint.addColorStop(0, hot ? '#fff6c0' : '#ffbb5fb8');
    paint.addColorStop(0.45, hot ? '#ffbf46' : '#ff631c62');
    paint.addColorStop(0.72, '#ff551244');
    paint.addColorStop(1, '#ff421000');
    ctx.fillStyle = paint;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
}

function flame(ctx, x, y, size, angle, opacity, phase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size, size);
    ctx.globalAlpha = opacity;
    const bend = Math.sin(phase) * 0.38;
    const paint = ctx.createLinearGradient(0, 0.4, 0, -2);
    paint.addColorStop(0, '#fff2a2');
    paint.addColorStop(0.34, '#ffc343');
    paint.addColorStop(0.72, '#ff681a');
    paint.addColorStop(1, '#eb381000');
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.moveTo(0, 0.42);
    ctx.bezierCurveTo(0.82, 0.26, 0.59, -0.56, 0.17 + bend, -1.18);
    ctx.bezierCurveTo(0.3 + bend, -0.75, -0.46 + bend, -1.22, bend, -2.15);
    ctx.bezierCurveTo(-0.93, -1.28, -0.69, -0.66, -0.62, -0.32);
    ctx.bezierCurveTo(-0.61, 0.11, -0.38, 0.38, 0, 0.42);
    ctx.fill();
    ctx.restore();
}

function sparks(ctx, x, y, radius, time, opacity, count) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
        const phase = (i * 0.717 + 0.13) % 1;
        const t = (time * (0.82 + phase * 0.46) + phase) % 1;
        const angle = i * 2.39996 + phase * 0.22;
        const distance = radius * (0.14 + t * (0.5 + phase * 0.65));
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const sx = x + dx * distance;
        const sy = y + dy * distance * 0.69 - radius * t * 0.34;
        const trail = Math.max(2, radius * (0.06 + phase * 0.07)) * (1 - t * 0.6);
        ctx.globalAlpha = opacity * Math.sin(Math.PI * t) * (0.58 + phase * 0.38);
        ctx.strokeStyle = phase > 0.6 ? '#ffe197' : '#ff872b';
        ctx.lineWidth = Math.max(1.1, radius * 0.035 * (1 - t * 0.58));
        ctx.beginPath();
        ctx.moveTo(sx - dx * trail, sy - dy * trail * 0.7 + trail * 0.28);
        ctx.lineTo(sx, sy);
        ctx.stroke();
    }
    ctx.restore();
}

function ring(ctx, x, y, radius, height, alpha, angle, fill) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ff6421';
    ctx.shadowColor = '#fb3b10';
    ctx.shadowBlur = Math.min(radius * 0.23, 20);
    ctx.lineWidth = Math.max(2, radius * 0.105);
    ctx.beginPath();
    ctx.ellipse(x, y, radius, height, 0, angle, angle + TAU * fill);
    ctx.stroke();
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth *= 0.36;
    ctx.stroke();
    ctx.restore();
}

function drawTackle(ctx, time, x, y, extent) {
    const hit = (time - 0.87) / 0.15;
    if (hit < 0 || hit >= 1) return;
    const size = extent * lerp(0.25, 0.88, hit);
    sprite(ctx, 0, x, y, size, size, 1 - hit, 0.2);
}

function drawFireSpin(ctx, time, x, y, extent, facing) {
    const age = time - 0.23;
    if (age < 0 || age >= 0.68) return;
    for (let i = 0; i < 4; i++) {
        const streak = (age - i * 0.1) / 0.25;
        if (streak < 0 || streak >= 1) continue;
        const travel = x + facing * extent * lerp(0.03, 0.46, streak);
        sprite(ctx, 1, travel, y, extent * 0.52, extent * 0.6, 0.85 * (1 - streak), facing < 0 ? Math.PI : 0);
    }
    for (let i = 0; i < 10; i++) {
        const angle = i * 2.39996 + age * 9;
        const radius = extent * (0.11 + age * 0.46);
        const size = extent * (0.22 + i % 3 * 0.025);
        sprite(ctx, 2, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.65,
            size, size, 1 - age / 0.68, angle);
    }
}

function drawFlameCharge(ctx, time, x, y, extent, facing) {
    const orbit = ramp(0.03, 0.2, time) * (1 - ramp(0.85, 1.15, time));
    for (let i = 0; i < 3; i++) {
        const angle = i * TAU / 3 + time * 9;
        const size = extent * 0.23;
        sprite(ctx, 5 + Math.floor(time * 18 + i) % 4, x + Math.cos(angle) * extent * 0.34,
            y - Math.sin(angle) * extent * 0.24, size, size, orbit, angle);
    }
    const charge = ramp(1.15, 1.41, time) * (1 - ramp(1.55, 1.9, time));
    sprite(ctx, 25, x, y, extent * 0.67, extent * 0.67, charge, time * 2.5);
    const release = (time - 1.9) / 0.35;
    if (release >= 0 && release < 1) {
        const shotX = x + facing * extent * lerp(0.08, 0.5, release);
        const size = extent * lerp(0.34, 0.68, release);
        sprite(ctx, 5 + Math.floor(release * 4), shotX, y, size, size, 1 - release * 0.5, facing < 0 ? Math.PI : 0);
    }
    const impact = (time - 2.25) / 0.72;
    if (impact >= 0 && impact < 1) {
        const hitX = x + facing * extent * 0.45;
        for (let i = 0; i < 12; i++) {
            const angle = i * TAU / 12;
            const radius = extent * (0.12 + impact * 0.29);
            const size = extent * (0.14 + i % 3 * 0.04);
            sprite(ctx, 5 + Math.floor(impact * 4 + i) % 4, hitX + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius * 0.68, size, size, 1 - impact, angle);
        }
    }
}

function drawPyroBall(ctx, time, x, y, extent, facing) {
    const age = time - 0.37;
    if (age < 0 || age >= 1.45) return;
    const flight = ramp(0.715, 1, age);
    const fireX = x + facing * extent * lerp(0.14, 0.47, flight);
    const fireY = y - Math.sin(Math.PI * flight) * extent * 0.22;
    const intensity = ramp(0.04, 0.36, age) * (1 - ramp(1.06, 1.45, age));
    const size = extent * lerp(0.21, 0.62, ramp(0.1, 0.72, age));
    glow(ctx, fireX, fireY, size * 0.73, size * 0.73, intensity, true);
    sprite(ctx, 4, fireX, fireY, size, size, intensity, age * 5);
    for (let i = 0; i < 6; i++) {
        const angle = i * TAU / 6 + age * 4.2;
        sprite(ctx, 9 + Math.floor(age * 23 + i) % 16,
            fireX + Math.cos(angle) * size * 0.32, fireY + Math.sin(angle) * size * 0.32,
            size * 0.5, size * 0.5, intensity, angle);
    }
    const impact = (age - 1) / 0.45;
    if (impact >= 0 && impact < 1) {
        for (let i = 0; i < 20; i++) {
            const angle = i * 2.39996;
            const r = extent * (0.08 + impact * (0.26 + i % 3 * 0.085));
            sprite(ctx, 3, fireX + Math.cos(angle) * r, y - Math.sin(angle) * r,
                extent * 0.13, extent * 0.13, 1 - impact, angle);
        }
    }
}

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

    draw(kind, time, clipDuration, width, height, modelHeight, floor, angle, calm, cx) {
        const ctx = this.ctx;
        if (!ctx) return;
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

        const extent = Math.min(Math.max(26, modelHeight), width * 0.68);
        const direction = Math.sin(angle);
        const facing = Math.abs(direction) < 0.18 ? 0.65 : direction;
        const waist = floor - modelHeight * 0.5;
        if (kind === 'tackle') return drawTackle(ctx, time, cx, waist, extent);
        if (kind === 'spin') return drawFireSpin(ctx, time, cx, waist, extent, facing);
        if (kind === 'charge') return drawFlameCharge(ctx, time, cx, waist, extent, facing);
        if (kind === 'ball') return drawPyroBall(ctx, time, cx, waist, extent, facing);

        const t = clamp(time / clipDuration);
        const power = ramp(0.045, 0.28, t) * (1 - ramp(0.74, 1, t));
        if (!power) return;
        const rise = ramp(0.17, 0.68, t);
        const y = floor - modelHeight * 0.14;
        const radius = extent * lerp(0.24, 0.61, rise);
        glow(ctx, cx, y - extent * rise * 0.24, radius * 1.65, extent * (0.36 + rise * 0.5), power * 0.83);
        const rotation = calm ? 0.6 : t * TAU * 1.1;
        ring(ctx, cx, y, radius, extent * 0.155, power, rotation, 0.99);
        for (let i = 0; i < 10; i++) {
            const theta = rotation + i * TAU / 10;
            flame(ctx, cx + Math.cos(theta) * radius, y + Math.sin(theta) * extent * 0.12,
                extent * (0.11 + rise * 0.16), Math.cos(theta) * 0.68, power * 0.88, i + t * 23);
        }
        sparks(ctx, cx, y, extent * 0.85, t * 1.65, power, calm ? 12 : 34);
    }
}
