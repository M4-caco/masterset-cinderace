import {
    AnimationMixer, Box3, DirectionalLight, GLTFLoader, Group, HemisphereLight,
    LoopOnce, NoToneMapping, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from './vendor/three-gltf.js';
import { applyMaxMaterial, loadMaxPattern } from './max-material.js?v=8';
import { loadMaxClouds, positionMaxClouds } from './max-clouds.js?v=10';
import { MaxLandingImpact } from './max-landing.js?v=1';
import { GroundFireTrail } from './ground-fire.js?v=1';
import { iconControl, mountVolume } from './showcase-controls.js?v=14';
import { BattleEffects, loadAttackSprites } from './battle-effects.js?v=16';
import { effectSpace } from './effect-space.js?v=2';
import { mountPokedex } from './pokedex.js?v=12';
import { prepareFace, updateFace } from './face-animation.js?v=14';
import { createJornadasGreeting } from './jornadas-voices.js?v=4';
import { isRapidTap, singleTapEffect, SINGLE_TAP_WINDOW_MS, RAPID_TAP_GRACE_MS } from './tap-gestures.mjs?v=1';

const FORMS = { normal: 'Normal', dynamax: 'Dinamax', gigamax: 'Gigamax' };
const SPECIES = [
    { id: 'scorbunny', name: 'Scorbunny', height: 0.84, focusHeight: 1.59, normalScale: 0.92, angle: 0, cloudScale: 0.4 },
    { id: 'cinderace', name: 'Cinderace', height: 1.76, focusHeight: 2.34,
        maxFocusHeight: 2.92, angle: 0, cloudScale: 0.8, gigamax: true },
    { id: 'raboot', name: 'Raboot', height: 0.99, focusHeight: 1.73, normalScale: 0.92, angle: 0, cloudScale: 0.5 },
];
const FRAME_HEIGHT = 2.52;
// A consistent low ground line keeps models from growing downward when focused.
const STAGE_FLOOR = 0.93;
const DYNAMAX_SCALE = 1.25;
// Default fallback scale. Cinderace has an explicit shared Max height so
// Dynamax and Gigamax appear at the same size in every carousel position.
const GIGAMAX_SCALE = 1.48;
const CAROUSEL_DURATION = 440;
// Replace the Pokémon around the 155ms peak of the 420ms Max flash;
// finish growth while the bright overlay still hides the change.
const MAX_FORM_SWAP = 145;
const NORMAL_FORM_SWAP = 235;
const MAX_GROW_DURATION = 155;
const MODEL_MARGIN = 0.045;

// Local bounds sampled from the exported idle loops. The Gigamax bounds include the fireball.
const IDLE_BOUNDS = {
    scorbunny: [[-0.185, -0.016, -0.066], [0.199, 0.631, 0.178]],
    raboot: [[-0.309, -0.011, -0.148], [0.31, 0.88, 0.176]],
    cinderace: [[-0.379, -0.011, -0.325], [0.398, 1.736, 0.367]],
    'cinderace-gigamax': [[-0.987, -0.016, -1.352], [1.041, 2.829, 1.017]],
};
// The physical stage and floor line are shared by the whole carousel.
// Each species gets one fixed camera zoom, calculated from its largest
// focused form and the cloud ring, so the smaller species are not miniatures
// inside Cinderace's much larger Gigamax camera framing.
// On the opening trio, apparent sizes are deliberate rather than locked
// to the large Max-form safety camera. Cinderace is twice Scorbunny's
// onscreen height; Raboot is only a little taller than Scorbunny.
const WELCOME_HEIGHT_FRACTIONS = {
    scorbunny: 0.41,
    raboot: 0.45,
    cinderace: 0.82,
};
const STAGE_HEIGHT_BY_SPECIES = Object.fromEntries(SPECIES.map(species => {
    let requiredSky = FRAME_HEIGHT * STAGE_FLOOR;
    const [min, max] = IDLE_BOUNDS[species.id];
    const baseHeight = max[1] - min[1];
    const maxHeight = species.maxFocusHeight ?? (species.focusHeight * DYNAMAX_SCALE);
    const cloudScale = species.cloudScale * maxHeight / baseHeight;
    requiredSky = Math.max(requiredSky,
        maxHeight + cloudScale * (0.18 + 0.31 + 0.12) + MODEL_MARGIN * 2);
    if (species.gigamax) {
        const [gigaMin, gigaMax] = IDLE_BOUNDS['cinderace-gigamax'];
        const gigaHeight = species.maxFocusHeight ?? (species.focusHeight * GIGAMAX_SCALE);
        const gigaCloudScale = 1.9 * gigaHeight / (gigaMax[1] - gigaMin[1]);
        requiredSky = Math.max(requiredSky,
            gigaHeight + gigaCloudScale * (0.13 + 0.28 + 0.12) + MODEL_MARGIN * 2);
    }
    return [species.id, Math.ceil((requiredSky / STAGE_FLOOR) * 100) / 100];
}));
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
    return range ? { waist, x, z, dx: dx / range, dz: dz / range, range, hit } : null;
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
        this.stage = card.querySelector('.pokemon-stage');
        this.stageSpecies = this.stage.querySelector('.pokemon-stage-species');
        this.stageSpecies.textContent = species.name.toLocaleUpperCase('pt-BR');
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
        this.lastAttackTap = -Infinity;
        this.lastTapAt = -Infinity;
        this.rapidTapUntil = -Infinity;
        this.pendingSingleTap = null;
        this.lastGreeting = -Infinity;
        this.hovering = false;
        this.introPending = true;
        this.maxBurstStart = null;
        this.bounds = new Box3();
        this.attackBounds = new Box3();
        this.cloudAnchor = new Vector3();
        this.shadowCenter = null;
        this.model = null;
        this.inView = false;
        this.restStart = 0;
        // Two independent soundtracks: anime voices for welcome hover,
        // original Pokémon GO cries for attacking or pressing a move button.
        this.greetingAudio = createJornadasGreeting(species.id);
        this.attackCry = new Audio(new URL(`./audio/${species.id}.wav`, import.meta.url).href);
        this.attackCry.preload = 'auto';
        this.attackCry.volume = 0.55;

        this.target.setAttribute('aria-pressed', 'false');
        this.target.setAttribute('aria-label', `Destacar ${species.name}. Use as setas para girar.`);
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
                this.tapAttack();
            }
            dragged = false;
        });
        target.addEventListener('keydown', event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            this.rotate(this.angle + (event.key === 'ArrowLeft' ? -0.22 : 0.22));
        });
        // The transparent stage button covers the entire slot. Only greet when
        // the pointer actually enters the rendered Pokémon's projected bounds.
        target.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
            if (start || this.showcase.hasAttribute('data-pokemon-selected')) {
                this.hovering = false;
                return;
            }
            const hovering = this.overPokemon(event);
            if (hovering && !this.hovering) this.greet();
            this.hovering = hovering;
        });
        target.addEventListener('pointerleave', () => { this.hovering = false; });
    }

    overPokemon(event) {
        if (!this.model || this.loading || !this.frameHeight ||
            this.form !== 'normal' || this.bounds.isEmpty()) return false;
        const stage = this.stage.getBoundingClientRect();
        const scale = stage.height / this.frameHeight;
        const box = this.bounds;
        const left = stage.width * 0.5 + box.min.x * scale;
        const right = stage.width * 0.5 + box.max.x * scale;
        const top = stage.height * STAGE_FLOOR - box.max.y * scale;
        const bottom = stage.height * STAGE_FLOOR - box.min.y * scale;
        const extraX = Math.max(8, (right - left) * 0.13);
        const extraY = Math.max(8, (bottom - top) * 0.06);
        const x = event.clientX - stage.left, y = event.clientY - stage.top;
        return x >= left - extraX && x <= right + extraX &&
            y >= top - extraY && y <= bottom + extraY;
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
        this.camera.position.set(0, STAGE_HEIGHT_BY_SPECIES[this.species.id] * (STAGE_FLOOR - 0.5), 5);
        this.turntable = new Group();
        const fill = new HemisphereLight(0xffffff, 0xffe6d6, 1.85);
        const key = new DirectionalLight(0xfff8f1, 1.45);
        const rim = new DirectionalLight(0xffc9ad, 0.5);
        key.position.set(-3, 5, 5);
        rim.position.set(4, 2, -4);
        this.scene.add(this.turntable, fill, key, rim);
        this.maxLanding = new MaxLandingImpact(this.scene, mobile.matches);
        this.groundFlames = new GroundFireTrail(this.scene, mobile.matches);
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
        const pending = loader.loadAsync(asset(id, 'gltf') + '?v=3').then(async gltf => {
            const root = gltf.scene;
            const meshes = [];
            const body = [];
            const props = [];
            const eyes = [];
            let visibilityController;
            let waist;
            let head;
            let feeding;
            root.traverse(object => {
                if (object.name.startsWith('_jnt_Visibility_')) visibilityController = object;
                if (/^_jnt_(?:L|R)?Eye_\d+$/i.test(object.name)) eyes.push(object);
                if (/^Waist_\d+$/.test(object.name)) waist = object;
                if (/^Head_\d+$/.test(object.name)) head = object;
                if (/^Feeding_Socket_\d+$/.test(object.name)) feeding = object;
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
            const face = await prepareFace(id, materialPairs, eyes).catch(error => {
                console.warn(`Scorace · Expressões de ${id}`, error);
                return null;
            });
            const boundsMeshes = meshes.filter((mesh, index) => !meshes.slice(0, index).some(other =>
                other.parent === mesh.parent && other.skeleton === mesh.skeleton &&
                other.geometry.attributes.position === mesh.geometry.attributes.position));
            const model = {
                id, root, mixer, clips, materialPairs, body, props, head, visibilityController, idleBounds, boundsMeshes, face,
                tackle: tacklePath(waist, clips.get(MOVES.physical)),
                idle: clips.get('Repouso da Pokédex') ?? clips.get('Repouso de batalha') ?? clips.get('Repouso'),
            };
            this.setRest(model);
            // Capture the game's static feeding socket relative to Raboot's
            // head in the original idle pose, before any attack can shift it.
            if (id === 'raboot' && head && feeding) {
                root.updateMatrixWorld(true);
                model.mouthLocal = head.worldToLocal(feeding.getWorldPosition(new Vector3()));
            }
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
        const maxTransformation = animateForm && form !== 'normal';
        const flash = this.stage.querySelector('.pokemon-transition');
        flash.classList.remove('is-playing');
        // Allow the glow to replay even when switching forms repeatedly while
        // their 3D assets are cached and load in the very same browser frame.
        void flash.offsetWidth;
        flash.classList.toggle('is-max', maxTransformation);
        this.maxLanding?.clear();
        this.groundFlames?.clear();
        this.maxBurstStart = null;
        const previousHeight = this.displayHeight;
        if ((this.form === 'gigamax') !== (form === 'gigamax')) this.angle = this.species.angle;
        this.form = form;
        this.lastAttackTap = -Infinity;
        if (!animateForm) {
            this.stage.dataset.form = form;
            this.stage.toggleAttribute('data-max-active', form !== 'normal');
        }
        this.onFormChange(this);
        for (const [key, button] of this.forms) button.setAttribute('aria-pressed', key === form);
        const id = form === 'gigamax' ? 'cinderace-gigamax' : this.species.id;
        const revision = ++this.revision;
        this.resetTapSequence();
        this.stopAttack();
        this.attackCry?.pause();
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
                await new Promise(resolve => setTimeout(resolve,
                    maxTransformation ? MAX_FORM_SWAP : NORMAL_FORM_SWAP));
                if (revision !== this.revision) return;
            }
            this.stage.dataset.form = form;
            this.stage.toggleAttribute('data-max-active', form !== 'normal');
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
            this.updatePlacement(true, changingForms ? previousHeight : undefined,
                maxTransformation ? MAX_GROW_DURATION : CAROUSEL_DURATION);
            this.configureMax(pattern);
            // Debris belongs to the shared ground, not the rotating Pokémon.
            // Start at the model-swap flash peak, for Dynamax and Gigamax only.
            if (maxTransformation) this.maxLanding.start(this.targetDisplayHeight(), performance.now());
            // Begin the body glow only after the new 3D form is visible;
            // otherwise it would be spent on the outgoing model.
            this.maxBurstStart = maxTransformation ? performance.now() : null;
            this.pokedexMove = form === 'gigamax' ? MOVES.roar : MOVES.special;
            this.renderControls();
            this.updateColor();
            this.loading = false;
            this.placeholder.hidden = true;
            this.preview.removeAttribute('src');
            this.stage.dataset.ready = '';
            this.renderer.domElement.hidden = false;
            this.target.disabled = false;
            this.setFocus(this.focused);
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

    baseDisplayHeight() {
        const { height, focusHeight } = this.species;
        // Mobile shows only one Pokémon at a time. Give it the same full-size
        // focus treatment as desktop instead of the tiny side-card height.
        if (mobile.matches) return focusHeight;
        if (this.focused) return focusHeight;
        return this.card.parentElement.hasAttribute('data-focus') ? height * 0.84 : focusHeight * 1.12;
    }

    targetDisplayHeight() {
        const base = this.baseDisplayHeight();
        if (this.form === 'normal') return base * (this.species.normalScale ?? 1);
        if (this.species.maxFocusHeight) {
            // Apply the same multiplier to both Max forms, even on the side
            // slots. Keep Scorbunny and Raboot on their existing scales.
            return base * this.species.maxFocusHeight / this.species.focusHeight;
        }
        const scale = this.form === 'gigamax' ? GIGAMAX_SCALE : DYNAMAX_SCALE;
        return base * scale;
    }

    updatePlacement(immediate = false, previousHeight, duration = CAROUSEL_DURATION) {
        if (!this.model || !this.placement) return;
        const target = this.targetDisplayHeight();
        const from = previousHeight ?? this.displayHeight;
        if ((immediate && previousHeight === undefined) || reducedMotion.matches || from === undefined || from === target) {
            this.placementTransition = null;
            this.setDisplayHeight(target);
        } else {
            this.setDisplayHeight(from);
            this.placementTransition = { from, to: target, start: performance.now(), duration };
        }
        this.invalidate();
    }

    maxFocusProgress() {
        if (this.form === 'normal') return 0;
        if (mobile.matches) return 1;
        if (!this.focused && !this.placementTransition) return 0;
        const factor = this.species.maxFocusHeight
            ? this.species.maxFocusHeight / this.species.focusHeight
            : this.form === 'gigamax' ? GIGAMAX_SCALE : DYNAMAX_SCALE;
        const sideHeight = this.species.height * 0.84 * factor;
        const fullHeight = this.species.focusHeight * factor;
        return smoothstep((this.displayHeight - sideHeight) /
            Math.max(0.001, fullHeight - sideHeight));
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
        const progress = Math.min(1, Math.max(0,
            (now - transition.start) / (transition.duration ?? CAROUSEL_DURATION)));
        const eased = progress * progress * (3 - 2 * progress);
        this.setDisplayHeight(transition.from + (transition.to - transition.from) * eased);
        if (progress === 1) this.placementTransition = null;
    }

    setFocus(focused) {
        this.focused = focused;
        if (!focused) {
            this.resetTapSequence();
            this.stopAttack();
        }
        this.card.toggleAttribute('data-selected', focused);
        this.controls.hidden = !focused;
        this.target.setAttribute('aria-pressed', String(focused));
        this.target.setAttribute('aria-label', this.form === 'gigamax'
            ? `${this.species.name} Gigamax. Arraste para girar. Use o botão para o especial.`
            : focused
            ? `Atacar com ${this.species.name}. Arraste ou use as setas para girar.`
            : `Selecionar ${this.species.name} e atacar.`);
        // A centered Max Pokémon must always have its full display size.
        // Otherwise a click during the 440ms carousel transition could lock
        // the Gigamax at its smaller side-card scale indefinitely.
        this.updatePlacement(focused && this.form === 'gigamax');
    }

    greet() {
        if (!this.model || this.loading || this.showcase.classList.contains('hidden')) return;
        const now = performance.now();
        if (now - this.lastGreeting < 1800) return;
        // A greeting must not interrupt battle attacks, especially G-Max.
        if (this.attack && this.attack.kind !== 'intro' && this.attack.kind !== 'greeting') return;
        this.lastGreeting = now;
        if (!this.attack && !reducedMotion.matches) this.play('Felicidade', 'greeting');
        // Only play a verified PT-BR Journeys voice once its separate
        // file is provided. No Pokémon GO cry is used here.
        if (this.greetingAudio) {
            this.greetingAudio.pause();
            this.greetingAudio.currentTime = 0;
            void this.greetingAudio.play().catch(() => {});
        }
    }

    clearPendingSingleTap() {
        if (this.pendingSingleTap !== null) clearTimeout(this.pendingSingleTap);
        this.pendingSingleTap = null;
    }

    resetTapSequence() {
        this.clearPendingSingleTap();
        this.lastTapAt = -Infinity;
        this.rapidTapUntil = -Infinity;
        this.lastAttackTap = -Infinity;
    }

    tapAttack() {
        this.greetingAudio?.pause();
        if (!this.model || this.loading) return;
        if (this.form === 'gigamax') return this.tapGigamaxReaction();
        // Battle buttons take precedence; normal taps may replace a greeting,
        // a quick attack or a previous single-tap fire animation.
        if (this.attack && !['intro', 'greeting', 'combat-fast', 'combat-single'].includes(this.attack.kind)) return;
        this.introPending = false;
        const now = performance.now();
        const rapid = isRapidTap(now, this.lastTapAt, this.rapidTapUntil);
        this.lastTapAt = now;
        this.clearPendingSingleTap();

        if (rapid) {
            // The second quick click cancels the pending fire move and plays
            // the existing physical attack. More clicks extend that sequence.
            this.rapidTapUntil = now + RAPID_TAP_GRACE_MS;
            this.lastAttackTap = now;
            if (this.attack?.kind === 'combat-fast') return;
            this.playQuickAttack();
            return;
        }

        // A standalone click needs a short interval before it can be
        // distinguished from the opening click of a rapid sequence.
        this.rapidTapUntil = -Infinity;
        this.lastAttackTap = -Infinity;
        // Play the Pokémon GO cry in the user's click gesture, not inside the
        // delayed callback (which mobile browsers may block for autoplay).
        this.playAttackCry();
        this.pendingSingleTap = setTimeout(() => {
            this.pendingSingleTap = null;
            if (this.lastTapAt !== now || this.loading || !this.model || this.form === 'gigamax' ||
                this.showcase.classList.contains('hidden')) return;
            if (this.attack && !['intro', 'greeting', 'combat-fast', 'combat-single'].includes(this.attack.kind)) return;
            const effect = singleTapEffect(this.species.id, this.form);
            if (effect && this.model.clips.has(MOVES.special)) {
                this.play(MOVES.special, 'combat-single', effect);
            }
        }, SINGLE_TAP_WINDOW_MS);
    }

    tapGigamaxReaction() {
        // A normal tap can make Gigamax Cinderace react using its actual
        // 'Rugido' animation. Quick successive taps never launch G-Max or
        // manufacture a nonexistent rapid-attack combo.
        if (this.attack && !['intro', 'greeting', 'gigamax-reaction'].includes(this.attack.kind)) return;
        if (this.attack?.kind === 'gigamax-reaction') return;
        const now = performance.now();
        const rapid = isRapidTap(now, this.lastTapAt, this.rapidTapUntil);
        this.lastTapAt = now;
        this.clearPendingSingleTap();
        if (rapid) {
            this.rapidTapUntil = now + RAPID_TAP_GRACE_MS;
            return;
        }
        this.rapidTapUntil = -Infinity;
        this.introPending = false;
        // Keep the sound inside the user gesture so Android WebView can play it.
        this.playAttackCry();
        this.pendingSingleTap = setTimeout(() => {
            this.pendingSingleTap = null;
            if (this.form !== 'gigamax' || !this.model || this.loading ||
                this.showcase.classList.contains('hidden') ||
                this.lastTapAt !== now || this.attack?.kind === 'battle') return;
            this.play(MOVES.roar, 'gigamax-reaction');
        }, SINGLE_TAP_WINDOW_MS);
    }

    playQuickAttack() {
        this.lastAttackTap = -Infinity;
        if (this.form === 'gigamax' || !this.model?.clips.has(MOVES.physical)) return;
        const clip = MOVES.physical;
        this.play(clip, 'combat-fast', 'spin');
    }

    playAttackCry() {
        // Deliberately never use this sound for mouseover happiness animations.
        const cry = this.attackCry;
        if (!cry || this.showcase.classList.contains('hidden')) return;
        try {
            cry.pause();
            cry.currentTime = 0;
            void cry.play().catch(() => {});
        } catch (error) {
            console.debug('Pokémon GO: vocalização de ataque indisponível', error);
        }
    }

    configureMax(pattern) {
        const { model } = this;
        if (this.form !== 'normal' && !model.max) {
            model.max = {
                pattern: { value: pattern }, time: { value: 0 }, power: { value: 1 },
                burst: { value: 0 }, aspect: { value: 1 },
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

    battleMoves() {
        const fire = 'fire';
        return this.form === 'gigamax'
            ? [['Bola de Chamas G-Max', fire, MOVES.special, 'gmax']]
            : this.form === 'dynamax'
                ? [['Chama Max', fire, MOVES.special, 'max']]
                : this.species.gigamax
                    ? [['Chama Furacão', fire, MOVES.physical, 'spin'], ['Ataque de Chamas', fire, MOVES.special, 'charge'],
                        ['Bola Incendiária', fire, MOVES.alternate, 'ball']]
                    : [['Investida', 'normal', MOVES.physical, 'tackle'], ['Lança-chamas', fire, MOVES.special, 'flamethrower']];
    }

    renderControls() {
        const buttons = this.battleMoves().filter(([, , clip]) => this.model.clips.has(clip))
            .map(([name, symbol, clip, effect]) => iconControl(name, symbol, symbol === 'fire' ? 'fire' : 'move-normal',
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

    // Capture the normal view before a Gigamax move. A click may animate the
    // Pokémon, but never zoom the camera out or shrink the model to fit it.
    captureGigamaxFrame() {
        const stage = this.stage.getBoundingClientRect();
        const lane = this.card.parentElement.parentElement.getBoundingClientRect();
        const left = Math.min(lane.left, stage.left);
        const right = Math.max(lane.right, stage.right);
        const center = stage.left + stage.width / 2;
        const { frameHeight } = this.fitFrame(stage.height, center - left, right - center);
        return { frameHeight, cameraY: this.camera.position.y };
    }

    play(name, kind = 'battle', effect) {
        if (!this.model || this.loading || (this.attack && kind === 'pokedex')) return false;
        const { mixer, clips } = this.model;
        const clip = clips.get(name);
        if (!clip) return false;
        if (kind !== 'intro' && kind !== 'greeting') {
            this.clearPendingSingleTap();
            if (kind === 'battle') {
                this.lastTapAt = -Infinity;
                this.rapidTapUntil = -Infinity;
                this.lastAttackTap = -Infinity;
            }
        }
        this.stopAttack();
        const action = mixer.clipAction(clip);
        action.reset().setLoop(LoopOnce, 1).setEffectiveWeight(0).play().paused = true;
        action.clampWhenFinished = true;
        const clipDuration = clip.duration;
        const duration = effect === 'charge' ? Math.max(clipDuration, 2.65) : clipDuration;
        const gigamaxMove = this.form === 'gigamax' &&
            (name === MOVES.special || name === MOVES.roar);
        // Never freeze a partially completed carousel transition at its
        // reduced side-card size. A selected Gigamax keeps its full size.
        if (gigamaxMove && this.placementTransition) {
            this.placementTransition = null;
            this.setDisplayHeight(Math.max(this.displayHeight,
                this.targetDisplayHeight()));
        }
        const cameraLock = gigamaxMove ? this.captureGigamaxFrame() : null;
        // The original movement keeps its timeline; only the camera is fixed.
        const start = performance.now();
        this.attack = { action, effect, kind, start, clipDuration, duration, time: 0,
            cameraLock, lockFraming: gigamaxMove };
        if (effect) this.battleEffects ??= new BattleEffects(this.stage, this.target);
        if (kind === 'combat-fast') this.groundFlames?.begin();
        else this.groundFlames?.clear();
        this.stage.dataset.attacking = kind;
        this.stage.toggleAttribute('data-attack-away', Boolean(effect) && Math.cos(this.angle) < -0.25);
        if (kind === 'combat-fast' || kind === 'battle') {
            this.greetingAudio?.pause();
            this.playAttackCry();
        }
        this.invalidate();
        return true;
    }

    stopAttack() {
        this.groundFlames?.clear();
        if (!this.attack) return;
        this.attack = null;
        this.battleEffects?.clear();
        delete this.stage.dataset.attacking;
        this.stage.removeAttribute('data-attack-away');
        this.stage.style.removeProperty('--pokemon-shadow-depth');
        this.turntable.position.set(0, 0, 0);
        this.turntable.scale.setScalar(1);
        this.setRest(this.model, this.restTime(performance.now()));
    }

    restTime(now) {
        return ((now - this.restStart) / 1000) % this.model.idle.duration;
    }

    rotate(angle) {
        if (this.loading || !this.model || (this.attack && this.attack.kind !== 'combat-fast')) return;
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

    setSurface(width, offset) {
        if (width !== this.surfaceWidth || offset !== this.surfaceOffset) {
            this.stage.style.setProperty('--pokemon-lane-width', `${width}px`);
            this.stage.style.setProperty('--pokemon-lane-left', `${-offset}px`);
            this.surfaceWidth = width;
            this.surfaceOffset = offset;
        }
    }

    render(now) {
        if (this.showcase.classList.contains('hidden') || !this.model || this.loading || !this.inView) return;
        const width = this.stage.clientWidth;
        const height = this.stage.clientHeight;
        if (!width || !height) return;
        this.advancePlacement(now);

        const ambient = !reducedMotion.matches;
        if (this.introPending) {
            this.introPending = false;
            if (!reducedMotion.matches) this.play('Felicidade', 'intro');
        }
        const rest = this.model.restAction;
        if (this.attack) {
            const { action, start, duration, clipDuration } = this.attack;
            const time = Math.max(0, (now - start) / 1000);
            if (time >= duration) {
                this.stopAttack();
                if (this.focused && now - this.lastAttackTap < 450) this.playQuickAttack();
            }
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
        updateFace(this.model.face, (now - this.restStart) / 1000, this.attack);
        if (ambient || this.attack || this.placementTransition || this.maxLanding?.active) this.invalidate();

        const { renderer, camera } = this;
        const stage = this.stage.getBoundingClientRect();
        const lane = this.card.parentElement.parentElement.getBoundingClientRect();
        const fullLeft = Math.min(lane.left, stage.left);
        const fullRight = Math.max(lane.right, stage.right);
        const center = stage.left + stage.width / 2;
        const { frameHeight, floor } = this.fitFrame(height, center - fullLeft, fullRight - center);
        const pixelToWorld = frameHeight / height;
        const extra = this.form === 'normal' ? 0 : this.displayHeight * 0.18;
        const left = this.attack ? fullLeft : Math.max(fullLeft, Math.min(stage.left,
            center + (this.bounds.min.x - extra) / pixelToWorld - 8));
        const right = this.attack ? fullRight : Math.min(fullRight, Math.max(stage.right,
            center + (this.bounds.max.x + extra) / pixelToWorld + 8));
        const surfaceWidth = Math.ceil(right - left);
        const offset = stage.left - left;
        this.setSurface(surfaceWidth, offset);
        this.card.toggleAttribute('data-battle-lane', Boolean(this.attack));
        if (surfaceWidth !== this.width || height !== this.height) {
            renderer.setSize(surfaceWidth, height, false);
            this.width = surfaceWidth;
            this.height = height;
        }
        const origin = center - left;
        const cameraLeft = -origin * pixelToWorld;
        const cameraRight = cameraLeft + surfaceWidth * pixelToWorld;
        const cameraTop = frameHeight / 2;
        if (cameraLeft !== camera.left || cameraRight !== camera.right || cameraTop !== camera.top) {
            camera.left = cameraLeft;
            camera.right = cameraRight;
            camera.top = cameraTop;
            camera.bottom = -cameraTop;
            camera.updateProjectionMatrix();
        }
        if (frameHeight !== this.frameHeight || floor !== this.effectsFloor ||
            width !== this.effectsWidth || height !== this.effectsPixels || this.displayHeight !== this.effectsHeight) {
            this.frameHeight = frameHeight;
            this.effectsFloor = floor;
            this.effectsWidth = width;
            this.effectsPixels = height;
            this.effectsHeight = this.displayHeight;
            this.positionEffects(width, height, frameHeight, floor);
        }
        const tall = this.displayHeight / pixelToWorld;
        const dash = this.attack?.effect === 'tackle' && this.model.tackle
            ? this.moveTackle(surfaceWidth, origin, tall, pixelToWorld, height * floor, height) : null;
        // The Gigamax clips have their whole body movement measured ahead of
        // time. Never include the changing fireball/spark props in a per-frame
        // camera correction, including when the Pokémon is tapped to roar.
        const adjustment = this.attack?.lockFraming ? null
            : this.attack ? this.keepAttackInView(pixelToWorld) : null;
        const dx = (dash?.pixels ?? 0) + (adjustment?.x ?? 0);
        const dy = (dash?.floorOffset ?? 0) + (adjustment?.y ?? 0);
        if (this.attack) this.stage.style.setProperty('--pokemon-shadow-depth', `${dy}px`);
        const shadowCenter = 50 + 100 * dx / width;
        if (shadowCenter !== this.shadowCenter) {
            this.stage.style.setProperty('--pokemon-shadow-center', `${shadowCenter}%`);
            this.shadowCenter = shadowCenter;
        }

        if (this.model.max) {
            this.model.max.time.value = ambient ? now / 1000 : 0;
            this.model.max.aspect.value = surfaceWidth / height;
            // A strong, brief white/pink shimmer runs on the actual mesh
            // when a Pokémon enters Dynamax or Gigamax. No model scaling.
            const burstAge = this.maxBurstStart === null ? Infinity
                : Math.max(0, (now - this.maxBurstStart) / 1000);
            this.model.max.burst.value = ambient && burstAge < 0.42
                ? 1 - smoothstep((burstAge - 0.04) / 0.30) : 0;
            if (burstAge >= 0.42) this.maxBurstStart = null;
        }
        if (this.cloud) {
            this.cloud.visible = this.form !== 'normal';
            if (this.cloud.visible) {
                const mountScale = this.form === 'gigamax' ? 1.9 : this.species.cloudScale;
                // Keep Scorbunny/Raboot's original cloud placement. Only the
                // Gigamax Cinderace uses a head reference and sky edge safety.
                const gigamax = this.form === 'gigamax';
                if (gigamax && this.model.head) this.model.head.getWorldPosition(this.cloudAnchor);
                positionMaxClouds(this.cloud, this.displayHeight, frameHeight, this.angle,
                    ambient ? now / 1000 : 0, floor, mountScale * this.placement.scale.x,
                    Math.min(-cameraLeft, cameraRight), gigamax,
                    gigamax && this.model.head ? this.cloudAnchor : null, this.maxFocusProgress());
            }
        }
        this.maxLanding?.update(now);
        if (this.attack?.kind === 'combat-fast') {
            this.groundFlames?.update(this.attack.time, this.model, this.turntable,
                this.angle, this.displayHeight);
        } else this.groundFlames?.clear();
        renderer.render(this.scene, camera);
        if (this.attack?.effect) {
            this.battleEffects.draw(this.attack.effect, {
                ...effectSpace(this.model, this.turntable, camera, surfaceWidth, height, this.attack),
                time: this.attack.time, duration: this.attack.clipDuration,
                width: surfaceWidth, height, form: this.form, species: this.species.id,
                modelHeight: tall * this.turntable.scale.x,
                floor: height * floor + dy,
                angle: this.angle, x: origin + dx,
                hit: dash?.hit, hitX: dash?.hitX,
            });
        }
    }

    moveTackle(width, origin, tall, pixelToWorld, floor, height) {
        const { waist, x, z, dx, dz, range, hit } = this.model.tackle;
        const forward = Math.sin(this.angle);
        const depth = Math.cos(this.angle);
        const moveX = waist.position.x - x;
        const moveZ = waist.position.z - z;
        const progress = Math.max(0, Math.min(1, (moveX * dx + moveZ * dz) / range));
        const room = forward >= 0 ? width - origin : origin;
        const stride = forward * Math.max(0, room - Math.min(tall * 0.29, width * 0.20) - 8);
        const pixels = stride * progress;
        const depthProgress = depth * progress;
        // The orthographic view uses scale and ground contact to show movement into depth.
        const scale = 1 + depthProgress * 0.19;
        const floorOffset = depthProgress * Math.min(height * 0.085, Math.max(0, height - floor) * 0.62);
        const placementScale = this.placement.scale.x * scale;
        this.turntable.scale.setScalar(scale);
        this.turntable.position.set(
            pixels * pixelToWorld - placementScale * (depth * moveX + forward * moveZ),
            -floorOffset * pixelToWorld,
            depthProgress * 1.1 + placementScale * (forward * moveX - depth * moveZ),
        );
        return { pixels, scale, floorOffset, hit, hitX: origin + stride };
    }

    fitFrame(height, leftPixels, rightPixels) {
        const { bounds, camera, model, turntable, placement } = this;
        const locked = this.attack?.cameraLock;
        if (locked) {
            // Maintain exactly the pre-click orthographic zoom, regardless of
            // the body pose, oversized fireball or the G-Max roar animation.
            camera.position.y = locked.cameraY;
            return { frameHeight: locked.frameHeight,
                floor: 0.5 + locked.cameraY / locked.frameHeight };
        }
        turntable.position.set(0, 0, 0);
        turntable.scale.setScalar(1);
        turntable.rotation.y = this.angle;
        turntable.updateMatrixWorld(true);
        // Use the whole viewing area for the silhouette, including the space beyond the card slot.
        bounds.copy(model.idleBounds).applyMatrix4(placement.matrixWorld);

        // All cards share the same CSS stage and 93% ground line. Keep zoom
        // fixed per species across its forms to preserve the intended increase
        // in apparent size when Dynamax or Gigamax is selected.
        const fitWidth = height * Math.max(
            (MODEL_MARGIN - bounds.min.x) / Math.max(1, leftPixels),
            (bounds.max.x + MODEL_MARGIN) / Math.max(1, rightPixels),
        );
        const welcome = !this.showcase.hasAttribute('data-pokemon-selected') &&
            this.form === 'normal' && !mobile.matches;
        const frameGoal = welcome
            ? this.displayHeight / WELCOME_HEIGHT_FRACTIONS[this.species.id]
            : STAGE_HEIGHT_BY_SPECIES[this.species.id];
        const frameHeight = Math.max(frameGoal, fitWidth,
            (bounds.max.y + MODEL_MARGIN) / STAGE_FLOOR,
            (MODEL_MARGIN - bounds.min.y) / (1 - STAGE_FLOOR));
        camera.position.y = frameHeight * (STAGE_FLOOR - 0.5);
        return { frameHeight, floor: STAGE_FLOOR };
    }

    keepAttackInView(pixelToWorld) {
        const { attackBounds: bounds, camera, model, turntable } = this;
        turntable.updateMatrixWorld(true);
        bounds.makeEmpty();
        for (const mesh of model.boundsMeshes) {
            if (mesh.visible) bounds.expandByObject(mesh, true);
        }
        if (bounds.isEmpty()) return { x: 0, y: 0 };

        // Leave the camera still. Only move the model if the animated silhouette reaches an edge.
        const margin = Math.max(MODEL_MARGIN, pixelToWorld * 7);
        const minX = camera.left + margin;
        const maxX = camera.right - margin;
        const minY = camera.bottom + camera.position.y + margin;
        const maxY = camera.top + camera.position.y - margin;
        const scale = Math.min(1, (maxX - minX) / (bounds.max.x - bounds.min.x),
            (maxY - minY) / (bounds.max.y - bounds.min.y));
        const { position } = turntable;
        const dx = Math.max(minX - (position.x + (bounds.min.x - position.x) * scale),
            Math.min(0, maxX - (position.x + (bounds.max.x - position.x) * scale)));
        const dy = Math.max(minY - (position.y + (bounds.min.y - position.y) * scale),
            Math.min(0, maxY - (position.y + (bounds.max.y - position.y) * scale)));
        turntable.scale.multiplyScalar(scale);
        position.x += dx;
        position.y += dy;
        return { x: dx / pixelToWorld, y: -dy / pixelToWorld };
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
        this.resetTapSequence();
        this.stopAttack();
        this.greetingAudio?.pause();
        this.attackCry?.pause();
    }
}

export function mountShowcase(section) {
    const layout = section.querySelector('.pokemon-layout');
    const grid = section.querySelector('.pokemon-grid');
    const panel = section.querySelector('.pokemon-panel');
    const inspector = section.querySelector('.pokemon-inspector');
    const pagination = section.querySelector('.pokemon-pagination');
    const template = section.querySelector('template');
    const title = section.querySelector('#pokemon-title');
    const header = section.querySelector('.pokemon-header');
    const dialog = section.querySelector('.pokemon-dex-dialog');
    const openDetailsButton = section.querySelector('[data-open-dex]');
    const mobileOrder = [0, 2, 1];
    const updatePokedex = mountPokedex(panel);
    let selected = -1;
    const slotAnimations = new Map();
    let panelAnimation;
    const cards = SPECIES.map((species, index) => {
        const card = template.content.firstElementChild.cloneNode(true);
        const viewer = new PokemonViewer(species, card, section, () => selectPokemon(index));
        viewer.onFormChange = changed => { if (changed.focused) updateProfile(changed); };
        grid.append(card);
        inspector.append(viewer.controls);
        return viewer;
    });

    function updateProfile(viewer) {
        const label = viewer
            ? viewer.species.name + (viewer.form === 'normal' ? '' : ` ${FORMS[viewer.form]}`)
            : 'Pokémon';
        if (title.textContent !== label) title.textContent = label;
        updatePokedex(viewer);
    }

    function refreshDetails() {
        // Restore the original direct selection: the Pokédex is always visible
        // for the selected Pokémon. On wide screens CSS places it at the side;
        // on mobile it follows the 3D viewer without blocking tap attacks.
        if (dialog.open) dialog.close();
        if (panel.parentElement !== layout) layout.append(panel);
        panel.hidden = selected === -1;
        openDetailsButton.hidden = true;
    }

    section.querySelector('[data-close-dex]').addEventListener('click', () => {
        if (dialog.open) dialog.close();
    });
    dialog.addEventListener('close', refreshDetails);

    function fitViewport() {
        if (section.classList.contains('hidden')) return;
        const top = layout.getBoundingClientRect().top + window.scrollY;
        const padding = parseFloat(getComputedStyle(section.parentElement).paddingBottom) || 0;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const available = Math.max(0, Math.floor(viewportHeight - top - padding - 2));
        const controls = inspector.offsetHeight + (mobile.matches ? 0 : pagination.offsetHeight) + 12;
        // Reserve the control row on desktop so revealing it doesn't counteract the selection zoom.
        const reserved = mobile.matches ? controls : Math.max(106, controls);
        section.style.setProperty('--pokemon-layout-space', `${available}px`);
        section.style.setProperty('--pokemon-stage-space', `${Math.max(76, available - reserved)}px`);
    }

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
        if (index !== -1) cards.forEach(viewer => viewer.greetingAudio?.pause());
        section.toggleAttribute('data-pokemon-selected', index !== -1);
        grid.toggleAttribute('data-focus', index !== -1);
        inspector.hidden = index === -1;
        pagination.hidden = index === -1;
        refreshDetails();
        const count = cards.length;
        for (const [position, viewer] of cards.entries()) {
            // In the carousel, the cards reached by the previous and next arrows flank the selection.
            const slot = index === -1 ? position : (position - index + 1 + count) % count;
            viewer.card.style.order = slot;
            viewer.setFocus(position === index);
        }
        updateProfile(index === -1 ? null : cards[index]);
        if (mobile.matches) loadViewer(cards[index]);
        fitViewport();
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
            if (index !== -1 && previous === -1 && !panel.hidden) {
                panelAnimation = panel.animate([
                    { opacity: 0, transform: 'translateX(10px)' },
                    { opacity: 1, transform: 'translateX(0)' },
                ], { duration: 300, delay: 60, easing: 'ease-out', fill: 'backwards' });
            }
        }
    }

    for (const [selector, step] of [['[data-prev]', -1], ['[data-next]', 1]]) {
        section.querySelector(selector).addEventListener('click', () => {
            const order = mobile.matches ? mobileOrder : [0, 1, 2];
            const position = order.indexOf(selected);
            selectPokemon(order[(position + step + order.length) % order.length]);
        });
    }

    function showTrio() {
        if (selected < 0 || mobile.matches) return;
        const previous = cards[selected];
        selectPokemon(-1);
        (previous.target.disabled ? title : previous.target).focus({ preventScroll: true });
    }
    section.querySelector('[data-overview]').addEventListener('click', showTrio);
    section.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !dialog.open && !closeVolume()) showTrio();
    });

    function refreshView() {
        if (mobile.matches && selected === -1) selectPokemon(0);
        if (!mobile.matches) cards.forEach(loadViewer);
        cards.forEach(card => card.updatePlacement());
        refreshDetails();
        fitViewport();
    }

    const layoutObserver = new ResizeObserver(fitViewport);
    for (const element of [document.querySelector('body > header'), header, inspector, pagination]) {
        if (element) layoutObserver.observe(element);
    }
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);

    const closeVolume = mountVolume(section, cards);
    loadAttackSprites();
    mobile.addEventListener('change', refreshView);
    refreshView();

    return {
        show: () => {
            if (!mobile.matches) selectPokemon(-1);
            fitViewport();
            cards.forEach(card => {
                card.angle = card.species.angle;
                card.hovering = false;
                card.lastGreeting = -Infinity;
                card.introPending = true;
                card.invalidate();
            });
        },
        hide: () => {
            if (dialog.open) dialog.close();
            closeVolume();
            cards.forEach(card => card.suspend());
        },
    };
}
