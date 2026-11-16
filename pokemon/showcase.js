import {
    AnimationMixer, Box3, DirectionalLight, GLTFLoader, Group, HemisphereLight,
    LoopOnce, NoToneMapping, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from './vendor/three-gltf.js';
import { applyMaxMaterial, loadMaxPattern } from './max-material.js?v=2';

const FORMS = { normal: 'Normal', dynamax: 'Dynamax', gigamax: 'Gigamax' };
const SPECIES = [
    { id: 'scorbunny', name: 'Scorbunny', height: 0.3, angle: 0.07 },
    { id: 'raboot', name: 'Raboot', height: 0.6, angle: 0 },
    { id: 'cinderace', name: 'Cinderace', height: 1.4, angle: -0.24, gigamax: true },
];
const FRAME_HEIGHT = 2.3;
const FLOOR = 0.84;
const DYNAMAX_SCALE = 1.25;
const GIGAMAX_DISPLAY_HEIGHT = 1.85;
const GIGAMAX_CAMERA_FRAME = 2.6;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const MOVES = {
    physical: 'Ataque físico',
    special: 'Ataque especial',
    alternate: 'Ataque especial alternativo',
    roar: 'Rugido',
};

const asset = (id, ext) => new URL(`./models/${id}.${ext}`, import.meta.url).href;
const loader = new GLTFLoader();

function control(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
}

class PokemonViewer {
    constructor(species, card, showcase) {
        this.species = species;
        this.card = card;
        this.showcase = showcase;
        this.stage = card.querySelector('.pokemon-stage');
        this.target = card.querySelector('.pokemon-target');
        this.placeholder = card.querySelector('.pokemon-loading');
        this.status = this.placeholder.querySelector('[role=status]');
        this.preview = this.placeholder.querySelector('img');
        this.webp = card.querySelector('.pokemon-webp');
        this.retry = this.placeholder.querySelector('button');
        this.moves = card.querySelector('.pokemon-moves');
        this.models = new Map();
        this.forms = new Map();
        this.form = 'normal';
        this.angle = species.angle;
        this.revision = 0;
        this.frameRequest = 0;
        this.attack = null;
        this.model = null;
        this.inView = false;
        this.previewReady = '';
        this.rotated = false;
        this.restStart = 0;
        this.cry = new Audio(new URL(`./audio/${species.id}.wav`, import.meta.url).href);
        this.cry.preload = 'none';
        this.cry.volume = 0.55;

        card.querySelector('h3').textContent = species.name;
        this.target.setAttribute('aria-label', `Ver a reação de ${species.name}. Use as setas para girar.`);
        for (const form of species.gigamax ? Object.keys(FORMS) : ['normal', 'dynamax']) {
            const button = control(FORMS[form], () => this.select(form));
            card.querySelector('.pokemon-forms').append(button);
            this.forms.set(form, button);
        }
        this.retry.addEventListener('click', () => this.select(this.form, true));
        this.webp.addEventListener('load', () => {
            this.previewReady = this.webp.currentSrc;
            this.syncPreview();
            this.invalidate();
        });
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
            root.traverse(object => {
                if (object.name.startsWith('_jnt_Visibility_')) visibilityController = object;
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
            const model = {
                id, root, mixer, clips, materialPairs, body, props, visibilityController,
                idle: clips.get('Repouso da Pokédex') ?? clips.get('Repouso de batalha') ?? clips.get('Repouso'),
            };
            this.setRest(model);
            const bounds = new Box3();
            const parts = id === 'cinderace-gigamax' ? [...body, ...props.filter(part => part.visible)] : body;
            for (const part of parts) bounds.expandByObject(part, true);
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

    setRest(model) {
        model.mixer.stopAllAction();
        const pose = model.mixer.clipAction(model.idle);
        pose.reset().play().paused = true;
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
        const changingForms = this.model && !retry;
        if ((this.form === 'gigamax') !== (form === 'gigamax')) this.angle = this.species.angle;
        this.form = form;
        this.stage.dataset.form = form;
        for (const [key, button] of this.forms) button.setAttribute('aria-pressed', key === form);
        const id = form === 'gigamax' ? 'cinderace-gigamax' : this.species.id;
        const revision = ++this.revision;
        this.stopAttack();
        this.loading = true;
        this.syncPreview();
        this.target.disabled = true;
        this.moves.replaceChildren();
        this.placeholder.hidden = false;
        this.retry.hidden = true;
        this.preview.hidden = false;
        this.preview.src = asset(id, 'webp');
        this.status.textContent = 'Carregando modelo 3D…';
        delete this.stage.dataset.ready;
        try {
            this.ensureRenderer();
            this.renderer.domElement.hidden = true;
            const [model, pattern] = await Promise.all([
                this.getModel(id),
                form === 'normal' ? null : loadMaxPattern(),
            ]);
            if (revision !== this.revision) return;
            this.model = model;
            this.turntable.clear();
            const placement = new Group();
            placement.add(model.root);
            const displayHeight = form === 'gigamax' ? GIGAMAX_DISPLAY_HEIGHT :
                this.species.height * (form === 'dynamax' ? DYNAMAX_SCALE : 1);
            const scale = displayHeight / model.size.y;
            placement.scale.setScalar(scale);
            placement.position.set(-model.center.x * scale, -model.baseY * scale, -model.center.z * scale);
            this.turntable.add(placement);
            this.setRest(model);
            this.restStart = performance.now();
            this.displayHeight = displayHeight;
            this.frameHeight = 0;
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
            this.syncPreview();
            if (changingForms) this.flashTransformation();
            this.invalidate();
        } catch (error) {
            if (revision !== this.revision) return;
            console.error(`Scorace · ${this.species.name}`, error);
            this.model = null;
            this.loading = false;
            this.preview.removeAttribute('src');
            this.preview.hidden = true;
            this.status.textContent = 'O modelo 3D não pôde ser carregado.';
            this.retry.hidden = false;
        }
    }

    flashTransformation() {
        if (reducedMotion.matches) return;
        const flash = this.stage.querySelector('.pokemon-transition');
        for (const animation of flash.getAnimations()) animation.cancel();
        flash.animate([
            { opacity: 0, transform: 'scale(0.45)' },
            { opacity: 0.95, transform: 'scale(0.95)', offset: 0.23 },
            { opacity: 0, transform: 'scale(1.28)' },
        ], { duration: 520, easing: 'ease-out' });
    }

    configureMax(pattern) {
        const { model } = this;
        if (this.form !== 'normal' && !model.max) {
            model.max = {
                pattern: { value: pattern }, time: { value: 0 }, power: { value: 1 },
                center: { value: model.center }, height: { value: model.size.y },
            };
            const prepared = new Set();
            for (const [mesh, regular, rare] of model.materialPairs) {
                const fireball = model.id === 'cinderace-gigamax' && !model.body.includes(mesh);
                for (const material of [regular, rare]) {
                    if (prepared.has(material)) continue;
                    prepared.add(material);
                    applyMaxMaterial(material, model.max, fireball);
                }
            }
        }
        if (model.max) model.max.power.value = this.form === 'normal' ? 0 : 1;
    }

    renderControls() {
        const { clips } = this.model;
        const moves = [];
        if (this.form === 'normal' && clips.has(MOVES.physical)) {
            moves.push(control('Ataque físico', () => this.play(MOVES.physical)));
        }
        if (clips.has(MOVES.special)) {
            const label = this.form === 'gigamax' ? 'Ataque Gigamax' : 'Ataque especial';
            moves.push(control(label, () => this.play(MOVES.special)));
        }
        if (this.form === 'normal' && clips.has(MOVES.alternate)) {
            moves.push(control('Alternativo', () => this.play(MOVES.alternate)));
        }
        if (clips.has(MOVES.roar)) moves.push(control('Rugido', () => this.play(MOVES.roar)));
        this.moves.replaceChildren(...moves);
    }

    updateColor(showSparkles = false) {
        if (!this.model) return;
        const shiny = this.showcase.dataset.color === 'shiny';
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
        this.syncPreview();
        this.invalidate();
    }

    syncPreview() {
        const show = this.showcase.dataset.webp === 'true' && this.model;
        if (show) {
            const color = this.showcase.dataset.color;
            const src = new URL(`./previews/${this.species.id}-${this.form}-${color}.webp`, import.meta.url).href;
            if (this.webp.src !== src) this.webp.src = src;
        }
        const active = show && !this.attack && !this.loading && !this.rotated &&
            this.previewReady && this.previewReady === this.webp.src;
        this.stage.toggleAttribute('data-webp', Boolean(active));
        this.webp.hidden = !active;
    }

    play(name, kind = 'battle') {
        if (!this.model || this.loading || this.attack) return false;
        const { mixer, clips } = this.model;
        const clip = clips.get(name);
        if (!clip) return false;
        mixer.stopAllAction();
        const action = mixer.clipAction(clip);
        action.reset().setLoop(LoopOnce, 1).play();
        action.clampWhenFinished = true;
        this.attack = { action, start: performance.now(), duration: clip.duration };
        this.stage.dataset.attacking = kind;
        this.syncPreview();
        this.invalidate();
        return true;
    }

    stopAttack() {
        if (!this.attack) return;
        this.attack = null;
        delete this.stage.dataset.attacking;
        this.setRest(this.model);
        this.restStart = performance.now();
        this.syncPreview();
    }

    rotate(angle) {
        if (this.loading || !this.model) return;
        this.angle = angle % (2 * Math.PI);
        this.rotated = true;
        this.syncPreview();
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

    render(now) {
        if (this.showcase.classList.contains('hidden') || !this.model || this.loading || !this.inView) return;
        const width = this.stage.clientWidth;
        const height = this.stage.clientHeight;
        if (!width || !height) return;

        const ambient = !reducedMotion.matches && !this.stage.hasAttribute('data-webp');
        if (this.attack) {
            const { action, start, duration } = this.attack;
            action.time = Math.max(0, (now - start) / 1000);
            if (action.time >= duration) this.stopAttack();
            else {
                this.model.mixer.update(0);
                this.updateProps(this.model, true);
            }
        } else if (ambient) {
            const action = this.model.restAction;
            action.time = ((now - this.restStart) / 1000) % this.model.idle.duration;
            this.model.mixer.update(0);
        }
        if (this.model.max) this.model.max.time.value = reducedMotion.matches ? 0 : now / 1000;
        if (ambient || this.attack) this.invalidate();

        const { renderer, camera } = this;
        const frameHeight = this.form === 'gigamax' ? GIGAMAX_CAMERA_FRAME : FRAME_HEIGHT;
        if (width !== this.width || height !== this.height || frameHeight !== this.frameHeight) {
            this.width = width;
            this.height = height;
            this.frameHeight = frameHeight;
            renderer.setSize(width, height, false);
            const halfHeight = frameHeight / 2;
            camera.left = -halfHeight * width / height;
            camera.right = -camera.left;
            camera.top = halfHeight;
            camera.bottom = -halfHeight;
            camera.position.y = frameHeight * (FLOOR - 0.5);
            camera.updateProjectionMatrix();
            this.positionEffects(width, height, frameHeight);
        }
        this.turntable.rotation.y = this.angle;
        if (this.webp.hidden) renderer.render(this.scene, camera);
    }

    positionEffects(width, height, frameHeight) {
        const pixelsPerUnit = height / frameHeight;
        const tall = this.displayHeight * pixelsPerUnit;
        const baseline = height * FLOOR;
        const limit = (value, min, fraction) => Math.min(Math.max(min, value), width * fraction);
        const effects = {
            'shadow-width': limit(tall * (this.form === 'gigamax' ? 0.72 : 0.52), 30, 0.76),
            'cloud-width': limit(tall * (this.form === 'gigamax' ? 0.65 : 0.7), 42, 0.62),
            'cloud-y': Math.max(24, baseline - tall - 0.09 * pixelsPerUnit),
            'aura-width': limit(tall * 1.17, 70, 0.94),
            'aura-y': Math.max(0, baseline - tall - 14),
            'flash-y': baseline - tall * 0.52,
            'flash-width': limit(tall * 1.55, 85, 0.96),
            'webp-size': tall * 1.27,
            'webp-bottom': height - baseline - tall * 0.055,
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
    const template = section.querySelector('template');
    section.dataset.color = 'color';
    const cards = SPECIES.map(species => {
        const card = template.content.firstElementChild.cloneNode(true);
        const viewer = new PokemonViewer(species, card, section);
        grid.append(card);
        return viewer;
    });
    const selectors = Array.from(section.querySelectorAll('button[data-color]'));
    const enlarge = section.querySelector('[data-enlarge]');
    const webp = section.querySelector('[data-webp]');
    function resizeLineup(large) {
        grid.dataset.display = large ? 'large' : 'normal';
        enlarge.setAttribute('aria-pressed', large);
        enlarge.textContent = large ? 'Reduzir trio' : 'Ampliar trio';
    }
    enlarge.addEventListener('click', () => resizeLineup(grid.dataset.display !== 'large'));
    webp.addEventListener('click', () => {
        const enabled = section.dataset.webp !== 'true';
        section.dataset.webp = String(enabled);
        webp.setAttribute('aria-pressed', enabled);
        if (enabled) resizeLineup(true);
        for (const card of cards) {
            card.rotated = false;
            if (enabled) card.angle = card.species.angle;
            card.syncPreview();
            card.invalidate();
        }
    });
    for (const button of selectors) {
        button.addEventListener('click', () => {
            section.dataset.color = button.dataset.color;
            for (const item of selectors) item.setAttribute('aria-pressed', item === button);
            for (const card of cards) card.updateColor(true);
        });
    }
    for (const viewer of cards) viewer.select('normal');

    return {
        show: () => cards.forEach(card => card.invalidate()),
        hide: () => cards.forEach(card => card.suspend()),
    };
}
