import {
    AnimationMixer, Box3, DirectionalLight, GLTFLoader, Group, HemisphereLight,
    LoopOnce, NoToneMapping, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from './vendor/three-gltf.js';
import { applyMaxMaterial, loadMaxPattern } from './max-material.js?v=7';
import { loadMaxClouds, positionMaxClouds } from './max-clouds.js?v=5';
import { iconControl, mountVolume } from './showcase-controls.js?v=3';
import { BattleEffects, loadAttackSprites } from './battle-effects.js?v=9';
import { mountPokedex } from './pokedex.js?v=7';

const FORMS = { normal: 'Normal', dynamax: 'Dinamax', gigamax: 'Gigamax' };
const SPECIES = [
    { id: 'scorbunny', name: 'Scorbunny', height: 0.67, angle: 0.07, cloudScale: 0.4 },
    { id: 'cinderace', name: 'Cinderace', height: 1.49, angle: -0.12, cloudScale: 0.8, gigamax: true },
    { id: 'raboot', name: 'Raboot', height: 0.95, angle: -0.08, cloudScale: 0.5 },
];
const FRAME_HEIGHT = 2.4;
const FLOOR = 0.84;
const DYNAMAX_SCALE = 1.25;
const GIGAMAX_SCALE = 1.04;
const CAROUSEL_DURATION = 440;
const MAX_FORM_SWAP = 235;
const MODEL_MARGIN = 0.045;

// Local bounds sampled from the exported idle loops. The Gigamax bounds include the fireball.
const IDLE_BOUNDS = {
    scorbunny: [[-0.185, -0.016, -0.066], [0.199, 0.631, 0.178]],
    raboot: [[-0.309, -0.011, -0.148], [0.31, 0.88, 0.176]],
    cinderace: [[-0.379, -0.011, -0.325], [0.398, 1.736, 0.367]],
    'cinderace-gigamax': [[-0.987, -0.016, -1.352], [1.041, 2.829, 1.017]],
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 767px)');

function smoothstep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}

function tacklePath(waist, clip) {
    const track = clip?.tracks.find(({ name }) => name === `${waist?.name}.position`);
    if (!track) return null;
    const { values, times } = track;
    const x = values[0], z = values[2];
    let range = 0, dx = 0, dz = 0, hit = 0;
    for (let index = 0; index < times.length; index++) {
        const offset = index * 3;
        const alongX = values[offset] - x;
        const alongZ = values[offset + 2] - z;
        const distance = Math.hypot(alongX, alongZ);
        if (distance <= range) continue;
        range = distance;
        dx = alongX;
        dz = alongZ;
        hit = times[index];
    }
    return range ? { waist, x, z, dx: dx / range, dz: dz / range, range, hit, angle: Math.atan2(dz, dx) } : null;
}
const MOVES = {
    physical: 'Ataque físico',
    special: 'Ataque especial',
    alternate: 'Ataque especial alternativo',
    roar: 'Rugido',
};

const asset = (id, ext) => new URL(`./models/${id}.${ext}`, import.meta.url).href;
const loader = new GLTFLoader();

class PokemonViewer {
    constructor(species, card, showcase, onSelect) {
        this.species = species;
        this.card = card;
        this.showcase = showcase;
        this.onSelect = onSelect;
        this.controls = card.querySelector('.pokemon-controls');
        this.name = card.querySelector('.pokemon-name');
        this.stage = card.querySelector('.pokemon-stage');
        this.target = card.querySelector('.pokemon-target');
        this.placeholder = card.querySelector('.pokemon-loading');
        this.status = this.placeholder.querySelector('[role=status]');
        this.preview = this.placeholder.querySelector('img');
        this.retry = this.placeholder.querySelector('button');
        this.moves = card.querySelector('.pokemon-moves');
        this.models = new Map();
        this.forms = new Map();
        this.colors = new Map();
        this.form = 'normal';
        this.color = 'color';
        this.focused = false;
        this.angle = species.angle;
        this.revision = 0;
        this.frameRequest = 0;
        this.attack = null;
        this.bounds = new Box3();
        this.shadowCenter = null;
        this.model = null;
        this.inView = false;
        this.restStart = 0;
        this.cry = new Audio(new URL(`./audio/${species.id}.wav`, import.meta.url).href);
        this.cry.preload = 'none';
        this.cry.volume = 0.55;

        this.name.textContent = species.name;
        this.name.setAttribute('aria-pressed', 'false');
        this.target.setAttribute('aria-pressed', 'false');
        this.target.setAttribute('aria-label', `Destacar ${species.name}. Use as setas para girar.`);
        this.name.addEventListener('click', this.onSelect);
        const forms = this.controls.querySelector('.pokemon-forms');
        for (const form of species.gigamax ? Object.keys(FORMS) : ['normal', 'dynamax']) {
            const button = iconControl(FORMS[form], form === 'normal' ? 'ball' : form, form, () => this.select(form));
            forms.append(button);
            this.forms.set(form, button);
        }
        const colors = this.controls.querySelector('.pokemon-colors');
        for (const [value, label, symbol] of [['color', 'Normal', 'ball'], ['shiny', 'Shiny', 'shiny']]) {
            const button = iconControl(label, symbol, value, () => {
                if (this.color === value) return;
                this.color = value;
                this.updateColor(value === 'shiny');
            });
            button.setAttribute('aria-pressed', String(value === this.color));
            this.colors.set(value, button);
            colors.append(button);
        }
        this.retry.addEventListener('click', () => this.select(this.form, true));
        this.bindPointer();
    }

    bindPointer() {
        let start = null;
        let dragged = false;
        const target = this.target;
        target.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0) return;
            dragged = false;
            start = { pointer: event.pointerId, x: event.clientX, angle: this.angle };
        });
        target.addEventListener('pointermove', event => {
            if (event.pointerId !== start?.pointer) return;
            const dx = event.clientX - start.x;
            if (!dragged && Math.abs(dx) < 5) return;
            if (!dragged) target.setPointerCapture(event.pointerId);
            dragged = true;
            target.dataset.dragging = '';
            this.rotate(start.angle + dx * 0.012);
        });
        const finish = event => {
            if (event.pointerId !== start?.pointer) return;
            start = null;
            delete target.dataset.dragging;
        };
        target.addEventListener('pointerup', finish);
        target.addEventListener('pointercancel', finish);
        target.addEventListener('lostpointercapture', finish);
        target.addEventListener('dragstart', event => event.preventDefault());
        target.addEventListener('click', event => {
            if (event.detail === 0 || !dragged) {
                this.onSelect();
                if (this.play(this.pokedexMove, 'pokedex')) {
                    this.cry.currentTime = 0;
                    this.cry.play().catch(() => {});
                }
            }
            dragged = false;
        });
        target.addEventListener('keydown', event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            this.rotate(this.angle + (event.key === 'ArrowLeft' ? -0.22 : 0.22));
        });
    }

    ensureRenderer() {
        if (this.renderer) return;
        const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = NoToneMapping;
        renderer.setClearColor(0, 0);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        this.stage.insertBefore(renderer.domElement, this.target);

        this.renderer = renderer;
        this.scene = new Scene();
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
        this.camera.position.set(0, FRAME_HEIGHT * (FLOOR - 0.5), 5);
        this.turntable = new Group();
        const fill = new HemisphereLight(0xffffff, 0xffe6d6, 1.85);
        const key = new DirectionalLight(0xfff8f1, 1.45);
        const rim = new DirectionalLight(0xffc9ad, 0.5);
        key.position.set(-3, 5, 5);
        rim.position.set(4, 2, -4);
        this.scene.add(this.turntable, fill, key, rim);
        this.observer = new ResizeObserver(() => this.invalidate());
        this.observer.observe(this.stage);
        this.visibilityObserver = new IntersectionObserver(([entry]) => {
            this.inView = entry.isIntersecting;
            if (this.inView) this.invalidate();
        });
        this.visibilityObserver.observe(this.stage);
    }

    async getModel(id) {
        if (this.models.has(id)) return this.models.get(id);
        const pending = loader.loadAsync(asset(id, 'gltf') + '?v=2').then(async gltf => {
            const root = gltf.scene;
            const meshes = [];
            const body = [];
            const props = [];
            let visibilityController;
            let waist;
            root.traverse(object => {
                if (object.name.startsWith('_jnt_Visibility_')) visibilityController = object;
                if (/^Waist_\d+$/.test(object.name)) waist = object;
                if (!object.isMesh) return;
                object.frustumCulled = false;
                meshes.push(object);
                const name = object.geometry.name || object.name;
                if (name.includes('CombinedOnExport')) body.push(object);
                else props.push(object);
            });
            const materialPairs = await Promise.all(meshes.map(async mesh => {
                const index = mesh.geometry.userData.shinyMaterial;
                return [mesh, mesh.material, index === undefined ? mesh.material : await gltf.parser.getDependency('material', index)];
            }));
            const mixer = new AnimationMixer(root);
            const clips = new Map(gltf.animations.map(clip => [clip.name, clip]));
            const idleBounds = new Box3(...IDLE_BOUNDS[id].map(point => new Vector3(...point)));
            const model = {
                id, root, mixer, clips, materialPairs, body, props, visibilityController, idleBounds,
                tackle: tacklePath(waist, clips.get(MOVES.physical)),
                idle: clips.get('Repouso da Pokédex') ?? clips.get('Repouso de batalha') ?? clips.get('Repouso'),
            };
            this.setRest(model);
            const bounds = new Box3();
            const restParts = id === 'cinderace-gigamax' ? [...body, ...props.filter(part => part.visible)] : body;
            for (const part of restParts) bounds.expandByObject(part, true);
            if (bounds.isEmpty()) throw new Error(`Malha 3D vazia: ${id}`);
            model.center = bounds.getCenter(new Vector3());
            model.size = bounds.getSize(new Vector3());
            model.baseY = bounds.min.y;
            return model;
        }).catch(error => {
            this.models.delete(id);
            throw error;
        });
        this.models.set(id, pending);
        return pending;
    }

    setRest(model, time = 0) {
        model.mixer.stopAllAction();
        const pose = model.mixer.clipAction(model.idle);
        pose.reset().setEffectiveWeight(1).play().paused = true;
        pose.time = time;
        model.restAction = pose;
        model.mixer.update(0);
        this.updateProps(model, false);
        model.root.updateMatrixWorld(true);
    }

    updateProps(model, inAttack) {
        for (const mesh of model.props) {
            const name = mesh.name;
            if (model.id === 'cinderace-gigamax') {
                mesh.visible = !name.includes('Firespark') || Number(model.visibilityController?.position.y) > 0.005;
            } else {
                mesh.visible = inAttack && (name.includes('StoneSkin')
                    ? Number(model.visibilityController?.position.y) > 0.005
                    : Math.abs(Number(model.visibilityController?.position.x)) > 0.005 ||
                        Number(model.visibilityController?.position.z) > 0.005);
            }
        }
    }

    async select(form, retry = false) {
        if (this.loading && form === this.form && !retry) return;
        if (this.model && form === this.form && !retry) return;
        const changingForms = this.model && !retry && this.stage.dataset.form !== form;
        const animateForm = changingForms && !reducedMotion.matches && this.stage.hasAttribute('data-ready');
        const flash = this.stage.querySelector('.pokemon-transition');
        flash.classList.remove('is-playing');
        const previousHeight = this.displayHeight;
        if ((this.form === 'gigamax') !== (form === 'gigamax')) this.angle = this.species.angle;
        this.form = form;
        if (!animateForm) this.stage.dataset.form = form;
        this.onFormChange(this);
        for (const [key, button] of this.forms) button.setAttribute('aria-pressed', key === form);
        const id = form === 'gigamax' ? 'cinderace-gigamax' : this.species.id;
        const revision = ++this.revision;
        this.stopAttack();
        this.loading = true;
        this.target.disabled = true;
        for (const button of this.moves.querySelectorAll('button')) button.disabled = true;
        if (!animateForm) {
            this.placeholder.hidden = false;
            this.retry.hidden = true;
            this.preview.hidden = false;
            this.preview.src = asset(id, 'webp');
            this.status.textContent = 'Carregando modelo 3D…';
            delete this.stage.dataset.ready;
        }
        try {
            this.ensureRenderer();
            if (!animateForm) this.renderer.domElement.hidden = true;
            const [model, pattern, clouds] = await Promise.all([
                this.getModel(id),
                form === 'normal' ? null : loadMaxPattern(),
                form === 'normal' || this.cloud ? null : loadMaxClouds(loader),
            ]);
            if (revision !== this.revision) return;
            if (animateForm) {
                flash.classList.add('is-playing');
                await new Promise(resolve => setTimeout(resolve, MAX_FORM_SWAP));
                if (revision !== this.revision) return;
            }
            this.stage.dataset.form = form;
            this.model = model;
            this.turntable.clear();
            this.placement = new Group();
            this.placement.add(model.root);
            this.turntable.add(this.placement);
            if (clouds) {
                this.cloud = clouds;
                this.scene.add(this.cloud);
            }
            this.setRest(model);
            this.restStart = performance.now();
            this.updatePlacement(true, changingForms ? previousHeight : undefined);
            this.configureMax(pattern);
            this.pokedexMove = form === 'gigamax' ? MOVES.roar : MOVES.special;
            this.renderControls();
            this.updateColor();
            this.loading = false;
            this.placeholder.hidden = true;
            this.preview.removeAttribute('src');
            this.stage.dataset.ready = '';
            this.renderer.domElement.hidden = false;
            this.target.disabled = false;
            this.invalidate();
        } catch (error) {
            if (revision !== this.revision) return;
            console.error(`Scorace · ${this.species.name}`, error);
            this.renderer?.domElement.setAttribute('hidden', '');
            this.placeholder.hidden = false;
            delete this.stage.dataset.ready;
            this.model = null;
            this.loading = false;
            this.preview.removeAttribute('src');
            this.preview.hidden = true;
            this.status.textContent = 'O modelo 3D não pôde ser carregado.';
            this.retry.hidden = false;
        }
    }

    normalHeight() {
        const { height } = this.species;
        if (!this.focused) return height;
        return mobile.matches ? 1.62 : Math.max(height * 1.07, 0.82);
    }

    updatePlacement(immediate = false, previousHeight) {
        if (!this.model || !this.placement) return;
        const scale = this.form === 'gigamax' ? GIGAMAX_SCALE : this.form === 'dynamax' ? DYNAMAX_SCALE : 1;
        const target = this.normalHeight() * scale;
        const from = previousHeight ?? this.displayHeight;
        if ((immediate && previousHeight === undefined) || reducedMotion.matches || from === undefined || from === target) {
            this.placementTransition = null;
            this.setDisplayHeight(target);
        } else {
            this.setDisplayHeight(from);
            this.placementTransition = { from, to: target, start: performance.now() };
        }
        this.invalidate();
    }

    setDisplayHeight(height) {
        this.displayHeight = height;
        const { center, size, baseY } = this.model;
        const scale = height / size.y;
        this.placement.scale.setScalar(scale);
        this.placement.position.set(-center.x * scale, -baseY * scale, -center.z * scale);
    }

    advancePlacement(now) {
        const transition = this.placementTransition;
        if (!transition) return;
        const progress = Math.min(1, Math.max(0, (now - transition.start) / CAROUSEL_DURATION));
        const eased = progress * progress * (3 - 2 * progress);
        this.setDisplayHeight(transition.from + (transition.to - transition.from) * eased);
        if (progress === 1) this.placementTransition = null;
    }

    setFocus(focused) {
        if (!focused) this.stopAttack();
        this.focused = focused;
        this.card.toggleAttribute('data-selected', focused);
        this.controls.hidden = !focused;
        this.name.setAttribute('aria-pressed', String(focused));
        this.target.setAttribute('aria-pressed', String(focused));
        this.target.setAttribute('aria-label', focused
            ? `Ver a reação de ${this.species.name}. Use as setas para girar.`
            : `Destacar ${this.species.name}. Use as setas para girar.`);
        this.updatePlacement();
    }

    configureMax(pattern) {
        const { model } = this;
        if (this.form !== 'normal' && !model.max) {
            model.max = {
                pattern: { value: pattern }, time: { value: 0 }, power: { value: 1 },
                aspect: { value: 1 },
            };
            const prepared = new Set();
            for (const [mesh, regular, rare] of model.materialPairs) {
                if (!model.body.includes(mesh)) continue;
                for (const material of [regular, rare]) {
                    if (prepared.has(material)) continue;
                    prepared.add(material);
                    applyMaxMaterial(material, model.max);
                }
            }
        }
        if (model.max) model.max.power.value = this.form === 'normal' ? 0 : 1;
    }

    renderControls() {
        const fire = 'fire';
        const entries = this.form === 'gigamax'
            ? [['Bola de Chamas G-Max', fire, MOVES.special]]
            : this.form === 'dynamax'
                ? [['Chama Max', fire, MOVES.special, 'max']]
                : this.species.gigamax
                    ? [['Chama Furacão', fire, MOVES.physical, 'spin'], ['Ataque de Chamas', fire, MOVES.special, 'charge'],
                        ['Bola Incendiária', fire, MOVES.alternate, 'ball']]
                    : [['Investida', 'normal', MOVES.physical, 'tackle'], ['Ataque de Chamas', fire, MOVES.special, 'charge']];
        const buttons = entries.filter(([, , clip]) => this.model.clips.has(clip))
            .map(([name, symbol, clip, effect]) => iconControl(name, symbol, symbol === fire ? 'fire' : 'move-normal',
                () => this.play(clip, 'battle', effect)));
        this.moves.replaceChildren(...buttons);
    }

    updateColor(showSparkles = false) {
        for (const [value, button] of this.colors) {
            button.setAttribute('aria-pressed', String(value === this.color));
        }
        if (!this.model) return;
        const shiny = this.color === 'shiny';
        for (const [mesh, regular, rare] of this.model.materialPairs) mesh.material = shiny ? rare : regular;
        if (shiny && showSparkles) {
            const sparkles = this.stage.querySelector('.pokemon-shiny-sparkles');
            for (const [index, star] of [...sparkles.children].entries()) {
                for (const animation of star.getAnimations()) animation.cancel();
                if (!reducedMotion.matches) {
                    star.animate([
                        { opacity: 0, transform: 'scale(0.25) rotate(-20deg)' },
                        { opacity: 1, transform: 'scale(1) rotate(0)' , offset: 0.34 },
                        { opacity: 0, transform: 'scale(0.42) rotate(24deg)' },
                    ], { duration: 620, delay: index * 40, fill: 'none' });
                }
            }
        }
        this.invalidate();
    }

    play(name, kind = 'battle', effect) {
        if (!this.model || this.loading || (this.attack && kind === 'pokedex')) return false;
        const { mixer, clips } = this.model;
        const clip = clips.get(name);
        if (!clip) return false;
        this.stopAttack();
        const action = mixer.clipAction(clip);
        action.reset().setLoop(LoopOnce, 1).setEffectiveWeight(0).play().paused = true;
        action.clampWhenFinished = true;
        const clipDuration = clip.duration;
        const duration = effect === 'charge' ? Math.max(clipDuration, 2.65) : clipDuration;
        this.attack = { action, effect, start: performance.now(), clipDuration, duration, time: 0 };
        if (effect && !this.battleEffects) this.battleEffects = new BattleEffects(this.stage, this.target);
        this.stage.dataset.attacking = kind;
        this.invalidate();
        return true;
    }

    stopAttack() {
        if (!this.attack) return;
        this.attack = null;
        this.battleEffects?.clear();
        delete this.stage.dataset.attacking;
        this.setBattleLane(false);
        this.turntable.position.set(0, 0, 0);
        this.setRest(this.model, this.restTime(performance.now()));
    }

    restTime(now) {
        return ((now - this.restStart) / 1000) % this.model.idle.duration;
    }

    rotate(angle) {
        if (this.loading || !this.model || this.attack) return;
        this.angle = angle % (2 * Math.PI);
        this.invalidate();
    }

    invalidate() {
        if (this.frameRequest || !this.model || this.loading || !this.inView ||
            this.showcase.classList.contains('hidden')) return;
        this.frameRequest = requestAnimationFrame(now => {
            this.frameRequest = 0;
            this.render(now);
        });
    }

    setBattleLane(active, width = 0, offset = 0) {
        if (active) {
            this.stage.style.setProperty('--pokemon-lane-width', `${width}px`);
            this.stage.style.setProperty('--pokemon-lane-left', `${-offset}px`);
        }
        this.stage.toggleAttribute('data-battle-lane', active);
        this.card.toggleAttribute('data-battle-lane', active);
    }

    render(now) {
        if (this.showcase.classList.contains('hidden') || !this.model || this.loading || !this.inView) return;
        const width = this.stage.clientWidth;
        const height = this.stage.clientHeight;
        if (!width || !height) return;
        this.advancePlacement(now);

        const ambient = !reducedMotion.matches;
        const rest = this.model.restAction;
        if (this.attack) {
            const { action, start, duration, clipDuration } = this.attack;
            const time = Math.max(0, (now - start) / 1000);
            if (time >= duration) this.stopAttack();
            else {
                const weight = smoothstep(time / 0.1) * (1 - smoothstep((time - clipDuration + 0.16) / 0.16));
                this.attack.time = time;
                action.time = Math.min(time, clipDuration);
                action.setEffectiveWeight(weight);
                if (ambient) rest.time = this.restTime(now);
                rest.setEffectiveWeight(1 - weight);
                this.model.mixer.update(0);
                this.updateProps(this.model, true);
            }
        } else if (ambient) {
            rest.time = this.restTime(now);
            this.model.mixer.update(0);
        }
        if (ambient || this.attack || this.placementTransition) this.invalidate();

        const { renderer, camera } = this;
        const frame = this.fitFrame(width / height);
        const { frameHeight, floor, centerX, halfWidth } = frame;
        const pixelToWorld = frameHeight / height;
        let surfaceWidth = width;
        let offset = 0;
        const battle = this.attack && this.stage.dataset.attacking === 'battle';
        if (battle) {
            const lane = this.card.parentElement.getBoundingClientRect();
            const stage = this.stage.getBoundingClientRect();
            const left = Math.min(lane.left, stage.left);
            surfaceWidth = Math.ceil(Math.max(lane.right, stage.right) - left);
            offset = stage.left - left;
            this.setBattleLane(true, surfaceWidth, offset);
        }
        if (surfaceWidth !== this.width || height !== this.height) {
            renderer.setSize(surfaceWidth, height, false);
            this.width = surfaceWidth;
            this.height = height;
        }
        const cameraLeft = -halfWidth - offset * pixelToWorld;
        const cameraRight = cameraLeft + surfaceWidth * pixelToWorld;
        const cameraTop = frameHeight / 2;
        if (cameraLeft !== camera.left || cameraRight !== camera.right || cameraTop !== camera.top) {
            camera.left = cameraLeft;
            camera.right = cameraRight;
            camera.top = cameraTop;
            camera.bottom = -cameraTop;
            camera.updateProjectionMatrix();
        }
        if (frameHeight !== this.frameHeight || floor !== this.effectsFloor || centerX !== this.effectsCenterX ||
            width !== this.effectsWidth || height !== this.effectsPixels || this.displayHeight !== this.effectsHeight) {
            this.frameHeight = frameHeight;
            this.effectsFloor = floor;
            this.effectsCenterX = centerX;
            this.effectsWidth = width;
            this.effectsPixels = height;
            this.effectsHeight = this.displayHeight;
            this.positionEffects(width, height, frameHeight, floor);
        }
        const origin = offset + width * centerX;
        const tall = this.displayHeight / pixelToWorld;
        const dash = this.attack?.effect === 'tackle' && this.model.tackle
            ? this.moveTackle(surfaceWidth, origin, tall, pixelToWorld) : null;
        const shadowCenter = 100 * (width * centerX + (dash?.pixels ?? 0)) / width;
        if (shadowCenter !== this.shadowCenter) {
            this.stage.style.setProperty('--pokemon-shadow-center', `${shadowCenter}%`);
            this.shadowCenter = shadowCenter;
        }

        if (this.model.max) {
            this.model.max.time.value = ambient ? now / 1000 : 0;
            this.model.max.aspect.value = surfaceWidth / height;
        }
        if (this.cloud) {
            this.cloud.visible = this.form !== 'normal';
            if (this.cloud.visible) {
                const mountScale = this.form === 'gigamax' ? 1.9 : this.species.cloudScale;
                positionMaxClouds(this.cloud, this.displayHeight, frameHeight, this.angle,
                    ambient ? now / 1000 : 0, floor, mountScale * this.placement.scale.x, halfWidth);
            }
        }
        renderer.render(this.scene, camera);
        if (this.attack?.effect) {
            this.battleEffects.draw(this.attack.effect, {
                time: this.attack.time, duration: this.attack.clipDuration,
                width: surfaceWidth, height, modelHeight: tall, floor: height * floor,
                angle: this.angle, x: origin + (dash?.pixels ?? 0),
                hit: dash?.hit, hitX: dash?.hitX,
            });
        }
    }

    moveTackle(width, origin, tall, pixelToWorld) {
        const { waist, x, z, dx, dz, range, hit, angle } = this.model.tackle;
        const { time, clipDuration } = this.attack;
        const turn = smoothstep(time / 0.25) * (1 - smoothstep((time / clipDuration - 0.83) / 0.17));
        const direction = this.attack.direction ??= origin <= width / 2 + 1 ? 1 : -1;
        const heading = angle + (direction < 0 ? Math.PI : 0);
        const delta = Math.atan2(Math.sin(heading - this.angle), Math.cos(heading - this.angle));
        const yaw = this.angle + turn * delta;
        const moveX = waist.position.x - x;
        const moveZ = waist.position.z - z;
        const progress = Math.max(0, Math.min(1, (moveX * dx + moveZ * dz) / range));
        const room = direction > 0 ? width - origin : origin;
        const length = Math.max(0, room - Math.min(tall * 0.27, width * 0.20) - 8);
        const pixels = direction * length * progress;
        const sin = Math.sin(yaw), cos = Math.cos(yaw);
        const scale = this.placement.scale.x;
        this.turntable.rotation.y = yaw;
        this.turntable.position.set(pixels * pixelToWorld - scale * (cos * moveX + sin * moveZ), 0,
            scale * (sin * moveX - cos * moveZ));
        return { pixels, hit, hitX: origin + direction * length };
    }

    fitFrame(aspect) {
        const { bounds, camera, model, turntable, placement } = this;
        turntable.position.set(0, 0, 0);
        turntable.rotation.y = this.angle;
        turntable.updateMatrixWorld(true);
        // Always frame the resting silhouette. The battle animation moves inside this fixed view.
        bounds.copy(model.idleBounds).applyMatrix4(placement.matrixWorld);

        const largest = this.normalHeight() * DYNAMAX_SCALE;
        const baseFrame = Math.max(FRAME_HEIGHT, (largest + 0.38) / FLOOR);
        const fitWidth = (bounds.max.x - bounds.min.x + MODEL_MARGIN * 2) / aspect;
        const fitHeight = bounds.max.y - bounds.min.y + MODEL_MARGIN * 2;
        const frameHeight = Math.max(baseFrame, fitWidth, fitHeight);
        const halfHeight = frameHeight / 2;
        const halfWidth = halfHeight * aspect;
        const x = Math.max(bounds.max.x - halfWidth + MODEL_MARGIN,
            Math.min(0, bounds.min.x + halfWidth - MODEL_MARGIN));
        const y = Math.max(bounds.max.y - halfHeight + MODEL_MARGIN,
            Math.min(frameHeight * (FLOOR - 0.5), bounds.min.y + halfHeight - MODEL_MARGIN));
        camera.position.x = x;
        camera.position.y = y;
        return { frameHeight, halfWidth, floor: 0.5 + y / frameHeight, centerX: 0.5 - x / (2 * halfWidth) };
    }

    positionEffects(width, height, frameHeight, floor) {
        const pixelsPerUnit = height / frameHeight;
        const tall = this.displayHeight * pixelsPerUnit;
        const baseline = height * floor;
        const limit = (value, min, fraction) => Math.min(Math.max(min, value), width * fraction);
        const effects = {
            'shadow-width': limit(tall * (this.form === 'gigamax' ? 0.72 : 0.52), 30, 0.76),
            'shadow-bottom': height - baseline - height * 0.03,
            'aura-width': limit(tall * 1.17, 70, 0.94),
            'aura-y': Math.max(0, baseline - tall - 14),
            'flash-y': baseline - tall * 0.52,
            'flash-width': limit(tall * 1.55, 85, 0.96),
        };
        for (const [name, size] of Object.entries(effects)) {
            this.stage.style.setProperty(`--pokemon-${name}`, `${size}px`);
        }
    }

    suspend() {
        cancelAnimationFrame(this.frameRequest);
        this.frameRequest = 0;
        this.stopAttack();
        this.cry.pause();
    }
}

export function mountShowcase(section) {
    const grid = section.querySelector('.pokemon-grid');
    const panel = section.querySelector('.pokemon-panel');
    const inspector = section.querySelector('.pokemon-inspector');
    const pagination = section.querySelector('.pokemon-pagination');
    const template = section.querySelector('template');
    const dex = section.querySelector('.pokemon-dex');
    const evolutionOrder = [0, 2, 1];
    const updatePokedex = mountPokedex(dex, evolutionOrder.map(index => SPECIES[index]),
        index => selectPokemon(evolutionOrder[index]));
    let selected = -1;
    const slotAnimations = new Map();
    let panelAnimation;
    const cards = SPECIES.map((species, index) => {
        const card = template.content.firstElementChild.cloneNode(true);
        const viewer = new PokemonViewer(species, card, section, () => selectPokemon(index));
        viewer.onFormChange = changed => { if (changed.focused) updatePokedex(changed); };
        grid.append(card);
        inspector.append(viewer.controls);
        return viewer;
    });

    function loadViewer(viewer) {
        if (!viewer.model && !viewer.loading) viewer.select(viewer.form);
    }

    function selectPokemon(index) {
        if (selected === index || (index === -1 && mobile.matches)) return;
        const previous = selected;
        const smooth = !mobile.matches && !reducedMotion.matches && typeof grid.animate === 'function';
        const oldCenters = smooth ? cards.map(({ card }) => {
            const bounds = card.getBoundingClientRect();
            return { x: bounds.left + bounds.width / 2, y: bounds.top };
        }) : [];
        for (const animation of slotAnimations.values()) animation.cancel();
        slotAnimations.clear();
        panelAnimation?.cancel();
        selected = index;
        grid.toggleAttribute('data-focus', index !== -1);
        panel.hidden = index === -1;
        pagination.hidden = index === -1;
        for (const [position, viewer] of cards.entries()) viewer.setFocus(position === index);
        updatePokedex(index === -1 ? null : cards[index]);
        if (mobile.matches) loadViewer(cards[index]);
        if (smooth) {
            for (const [position, { card }] of cards.entries()) {
                const before = oldCenters[position];
                const after = card.getBoundingClientRect();
                const x = before.x - after.left - after.width / 2;
                const y = before.y - after.top;
                if (Math.abs(x) + Math.abs(y) < 1) continue;
                slotAnimations.set(card, card.animate([
                    { transform: `translate(${x}px, ${y}px)` },
                    { transform: 'translate(0, 0)' },
                ], { duration: CAROUSEL_DURATION, easing: 'cubic-bezier(0.23, 0.72, 0.24, 1)' }));
            }
            if (index !== -1 && previous === -1) {
                panelAnimation = panel.animate([
                    { opacity: 0, transform: 'translateX(10px)' },
                    { opacity: 1, transform: 'translateX(0)' },
                ], { duration: 300, delay: 60, easing: 'ease-out', fill: 'backwards' });
            }
        }
    }

    for (const [selector, step] of [['[data-prev]', -1], ['[data-next]', 1]]) {
        section.querySelector(selector).addEventListener('click', () => {
            const order = mobile.matches ? evolutionOrder : [0, 1, 2];
            const position = order.indexOf(selected);
            selectPokemon(order[(position + step + order.length) % order.length]);
        });
    }

    function showTrio() {
        if (selected < 0 || mobile.matches) return;
        const previous = cards[selected];
        selectPokemon(-1);
        previous.name.focus({ preventScroll: true });
    }
    section.querySelector('[data-overview]').addEventListener('click', showTrio);
    section.addEventListener('keydown', event => {
        if (event.key === 'Escape') showTrio();
    });

    function refreshView() {
        if (mobile.matches && selected === -1) selectPokemon(0);
        if (!mobile.matches) cards.forEach(loadViewer);
        cards.forEach(card => card.updatePlacement());
    }

    mountVolume(section, cards);
    loadAttackSprites();
    mobile.addEventListener('change', refreshView);
    refreshView();

    return {
        show: () => {
            if (!mobile.matches) selectPokemon(-1);
            cards.forEach(card => card.invalidate());
        },
        hide: () => cards.forEach(card => card.suspend()),
    };
}
