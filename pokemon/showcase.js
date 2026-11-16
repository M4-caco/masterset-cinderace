import {
    AnimationMixer, Box3, DirectionalLight, GLTFLoader, Group, HemisphereLight,
    LoopOnce, NoToneMapping, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from './vendor/three-gltf.js';
import { applyMaxMaterial, loadMaxPattern } from './max-material.js?v=2';
import { loadMaxClouds, positionMaxClouds } from './max-clouds.js?v=3';
import { iconControl, mountVolume } from './showcase-controls.js?v=3';

const FORMS = { normal: 'Normal', dynamax: 'Dynamax', gigamax: 'Gigamax' };
const SPECIES = [
    { id: 'scorbunny', name: 'Scorbunny', height: 0.52, angle: 0.07 },
    { id: 'raboot', name: 'Raboot', height: 0.77, angle: 0 },
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
        this.webp = card.querySelector('.pokemon-webp');
        this.retry = this.placeholder.querySelector('button');
        this.moves = card.querySelector('.pokemon-moves');
        this.models = new Map();
        this.forms = new Map();
        this.form = 'normal';
        this.color = 'color';
        this.focused = false;
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
        this.shiny = iconControl('Shiny', 'shiny', 'shiny', () => {
            this.color = this.color === 'shiny' ? 'color' : 'shiny';
            this.shiny.setAttribute('aria-pressed', String(this.color === 'shiny'));
            this.updateColor(true);
        });
        this.shiny.setAttribute('aria-pressed', 'false');
        forms.append(this.shiny);
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
            const [model, pattern, clouds] = await Promise.all([
                this.getModel(id),
                form === 'normal' ? null : loadMaxPattern(),
                form === 'normal' || this.cloud ? null : loadMaxClouds(loader),
            ]);
            if (revision !== this.revision) return;
            this.model = model;
            this.turntable.clear();
            this.placement = new Group();
            this.placement.add(model.root);
            this.turntable.add(this.placement);
            if (clouds) {
                this.cloud = clouds.clone(true);
                this.scene.add(this.cloud);
            }
            this.stage.toggleAttribute('data-max-cloud', Boolean(this.cloud && form !== 'normal'));
            this.setRest(model);
            this.restStart = performance.now();
            this.updatePlacement();
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

    updatePlacement() {
        if (!this.model || !this.placement) return;
        const side = this.card.parentElement.hasAttribute('data-focus') && !this.focused;
        const height = this.focused ? Math.max(this.species.height, 1.36) : this.species.height;
        const base = this.form === 'gigamax' ? GIGAMAX_DISPLAY_HEIGHT :
            height * (this.form === 'dynamax' ? DYNAMAX_SCALE : 1);
        this.displayHeight = base * (side ? 0.68 : 1);
        const { center, size, baseY } = this.model;
        const scale = this.displayHeight / size.y;
        this.placement.scale.setScalar(scale);
        this.placement.position.set(-center.x * scale, -baseY * scale, -center.z * scale);
        this.frameHeight = 0;
        this.invalidate();
    }

    setFocus(focused, order) {
        this.focused = focused;
        this.card.style.order = order;
        this.card.toggleAttribute('data-selected', focused);
        this.controls.hidden = !focused;
        this.name.setAttribute('aria-pressed', String(focused));
        this.target.setAttribute('aria-pressed', String(focused));
        this.target.setAttribute('aria-label', focused
            ? `Ver a reação de ${this.species.name}. Use as setas para girar.`
            : `Destacar ${this.species.name}. Use as setas para girar.`);
        this.updatePlacement();
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
        const fire = 'fire';
        const entries = this.form === 'gigamax'
            ? [['Bola de Chamas G-Max', fire, MOVES.special]]
            : this.form === 'dynamax'
                ? [['Chama Max', fire, MOVES.special]]
                : this.species.gigamax
                    ? [['Chama Furacão', fire, MOVES.physical], ['Ataque de Chamas', fire, MOVES.special],
                        ['Bola Incendiária', fire, MOVES.alternate]]
                    : [['Investida', 'normal', MOVES.physical], ['Ataque de Chamas', fire, MOVES.special]];
        const buttons = entries.filter(([, , clip]) => this.model.clips.has(clip))
            .map(([name, symbol, clip]) => iconControl(name, symbol, symbol === fire ? 'fire' : 'move-normal',
                () => this.play(clip)));
        this.moves.replaceChildren(...buttons);
    }

    updateColor(showSparkles = false) {
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
        this.syncPreview();
        this.invalidate();
    }

    syncPreview() {
        const show = this.showcase.dataset.webp === 'true' && this.model;
        if (show) {
            const color = this.color;
            const src = new URL(`./previews/${this.species.id}-${this.form}-${color}.webp`, import.meta.url).href;
            if (this.webp.src !== src) this.webp.src = src;
        }
        const active = show && !this.attack && !this.loading && !this.rotated &&
            this.previewReady && this.previewReady === this.webp.src;
        this.stage.toggleAttribute('data-webp', Boolean(active));
        this.webp.hidden = !active;
    }

    play(name, kind = 'battle') {
        if (!this.model || this.loading || (this.attack && kind === 'pokedex')) return false;
        if (this.attack) this.stopAttack();
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

        const clouds = this.cloud && this.form !== 'normal';
        const ambient = !reducedMotion.matches && (!this.stage.hasAttribute('data-webp') || clouds);
        if (this.attack) {
            const { action, start, duration } = this.attack;
            action.time = Math.max(0, (now - start) / 1000);
            if (action.time >= duration) this.stopAttack();
            else {
                this.model.mixer.update(0);
                this.updateProps(this.model, true);
            }
        } else if (ambient && this.webp.hidden) {
            const action = this.model.restAction;
            action.time = ((now - this.restStart) / 1000) % this.model.idle.duration;
            this.model.mixer.update(0);
        }
        if (this.model.max) this.model.max.time.value = reducedMotion.matches ? 0 : now / 1000;
        if (ambient || this.attack) this.invalidate();

        const { renderer, camera } = this;
        const baseFrame = this.form === 'gigamax' ? GIGAMAX_CAMERA_FRAME : FRAME_HEIGHT;
        const frameHeight = this.form === 'gigamax' && width / height < 0.7
            ? Math.max(baseFrame, this.displayHeight * 0.96 * height / width) : baseFrame;
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
        this.turntable.visible = this.webp.hidden;
        if (this.cloud) {
            this.cloud.visible = Boolean(clouds);
            if (clouds) positionMaxClouds(this.cloud, this.displayHeight, frameHeight, reducedMotion.matches ? 0 : now / 1000);
        }
        if (this.webp.hidden || clouds) renderer.render(this.scene, camera);
    }

    positionEffects(width, height, frameHeight) {
        const pixelsPerUnit = height / frameHeight;
        const tall = this.displayHeight * pixelsPerUnit;
        const baseline = height * FLOOR;
        const limit = (value, min, fraction) => Math.min(Math.max(min, value), width * fraction);
        const effects = {
            'shadow-width': limit(tall * (this.form === 'gigamax' ? 0.72 : 0.52), 30, 0.76),
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
    const inspector = section.querySelector('.pokemon-inspector');
    const template = section.querySelector('template');
    const enlarge = section.querySelector('[data-enlarge]');
    const webp = section.querySelector('[data-webp]');
    let selected = -1;
    const cards = SPECIES.map((species, index) => {
        const card = template.content.firstElementChild.cloneNode(true);
        const viewer = new PokemonViewer(species, card, section, () => selectPokemon(index));
        grid.append(card);
        inspector.append(viewer.controls);
        return viewer;
    });

    function selectPokemon(index) {
        if (selected === index) return;
        const previous = selected;
        selected = index;
        inspector.hidden = index === -1;
        grid.toggleAttribute('data-focus', index !== -1);
        for (const [position, card] of cards.entries()) {
            const offset = (position - index + cards.length) % cards.length;
            const order = index === -1 ? position : offset === cards.length - 1 ? -1 : offset;
            card.setFocus(position === index, order);
        }
        if (index === -1 && previous >= 0) cards[previous].name.focus({ preventScroll: true });
    }

    for (const [selector, step] of [['[data-prev]', -1], ['[data-next]', 1]]) {
        section.querySelector(selector).addEventListener('click', () =>
            selectPokemon((selected + step + cards.length) % cards.length));
    }
    section.querySelector('[data-overview]').addEventListener('click', () => selectPokemon(-1));
    section.addEventListener('keydown', event => {
        if (event.key === 'Escape' && selected >= 0) selectPokemon(-1);
    });

    function resizeLineup(large) {
        grid.dataset.display = large ? 'large' : 'normal';
        enlarge.setAttribute('aria-pressed', String(large));
        enlarge.textContent = large ? 'Reduzir trio' : 'Ampliar trio';
    }
    enlarge.addEventListener('click', () => resizeLineup(grid.dataset.display !== 'large'));
    webp.addEventListener('click', () => {
        const enabled = section.dataset.webp !== 'true';
        section.dataset.webp = String(enabled);
        webp.setAttribute('aria-pressed', String(enabled));
        if (enabled) resizeLineup(true);
        for (const card of cards) {
            card.rotated = false;
            if (enabled) card.angle = card.species.angle;
            card.syncPreview();
            card.invalidate();
        }
    });
    mountVolume(section, cards);
    for (const card of cards) card.select('normal');

    return {
        show: () => cards.forEach(card => card.invalidate()),
        hide: () => cards.forEach(card => card.suspend()),
    };
}
