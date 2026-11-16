const TAU = 2 * Math.PI;
const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (a, b, amount) => a + (b - a) * amount;

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

export class BattleEffects {
    constructor(stage, target) {
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

    draw(kind, progress, width, height, modelHeight, floor, angle, calm) {
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

        const t = clamp(progress);
        const power = ramp(0.045, 0.28, t) * (1 - ramp(0.74, 1, t));
        if (!power) return;
        const cx = width / 2;
        const extent = Math.min(Math.max(26, modelHeight), width * 0.84);
        const direction = Math.sin(angle);
        const facing = Math.abs(direction) < 0.18 ? 0.37 : direction;
        const particleCount = calm ? 12 : 34;

        if (kind === 'spin' || kind === 'charge' || kind === 'max') {
            const spin = kind === 'spin';
            const max = kind === 'max';
            const rise = ramp(0.17, 0.68, t);
            const x = kind === 'charge' ? cx + facing * extent * (rise - 0.45) * 0.49 : cx;
            const y = floor - modelHeight * (max ? 0.14 : 0.2);
            const radius = extent * (max ? lerp(0.24, 0.61, rise) : spin ? 0.48 : 0.42);
            glow(ctx, x, y - (max ? extent * rise * 0.24 : 0), radius * (max ? 1.65 : 1.15),
                extent * (max ? 0.36 + rise * 0.5 : 0.41), power * 0.83);
            const rotation = calm ? 0.6 : t * TAU * (spin ? 2.8 : 1.1);
            ring(ctx, x, y, radius, extent * 0.155, power, rotation, max ? 0.99 : spin ? 0.78 : 0.48);
            const count = max ? 10 : 7;
            for (let i = 0; i < count; i++) {
                const theta = rotation + i * TAU / count;
                const size = extent * (max ? 0.11 + rise * 0.16 : 0.062 + i % 3 * 0.025);
                flame(ctx, x + Math.cos(theta) * radius, y + Math.sin(theta) * extent * 0.12,
                    size, Math.cos(theta) * 0.68, power * 0.88, i + t * 23);
            }
            sparks(ctx, x, y, extent * (max ? 0.85 : 0.64), t * 1.65, power, particleCount);
            return;
        }

        const giant = kind === 'gmax';
        const flight = ramp(0.37, 0.72, t);
        const burst = ramp(0.65, 0.8, t) * (1 - ramp(0.82, 1, t));
        const x = cx + facing * extent * lerp(0.1, 0.56, flight);
        const y = floor - modelHeight * lerp(giant ? 0.34 : 0.28, 0.18, flight) -
            Math.sin(flight * Math.PI) * extent * 0.17;
        const size = extent * (giant ? 0.29 : 0.19) * lerp(0.56, 1.13, ramp(0.14, 0.62, t));
        const main = power * (1 - ramp(0.7, 0.87, t));
        for (let i = 3; i >= 1; i--) {
            glow(ctx, x - facing * size * i * flight * 0.72, y - size * i * 0.12,
                size * (1.3 - i * 0.12), size * 0.74, main * (0.6 - i * 0.1));
        }
        glow(ctx, x, y, size * 1.7, size * 1.5, main * 0.9);
        glow(ctx, x, y, size, size * 0.94, main, true);
        for (let i = 0; i < 8; i++) {
            const theta = i * TAU / 8 + (calm ? 0 : t * TAU * 1.55);
            flame(ctx, x + Math.cos(theta) * size * 0.72, y + Math.sin(theta) * size * 0.7,
                size * 0.42, theta - 0.7, main * 0.84, i + t * 20);
        }
        glow(ctx, x, y, size * lerp(1.15, 2.05, burst), size * lerp(0.7, 1.35, burst), burst * 0.83, true);
        sparks(ctx, x, y, size * (giant ? 2.6 : 2.3), t * 1.5, Math.max(main * 0.8, burst), particleCount);
    }
}
