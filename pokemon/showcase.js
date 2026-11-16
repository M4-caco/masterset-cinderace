import {
    AnimationMixer, Box3, DirectionalLight, GLTFLoader, Group, HemisphereLight,
    LoopOnce, NoToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from './vendor/three-gltf.js';

const FORMS = { normal: 'Normal', dynamax: 'Dynamax', gigamax: 'Gigamax' };
const SPECIES = [
    { id: 'scorbunny', name: 'Scorbunny', size: 0.65, angle: 0.07 },
    { id: 'raboot', name: 'Raboot', size: 0.71, angle: 0 },
    { id: 'cinderace', name: 'Cinderace', size: 0.70, angle: -0.1, gigamax: true },
];
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

        card.querySelector('h3').textContent = species.name;
        this.target.setAttribute('aria-label', `Atacar com ${species.name}. Use as setas para girar.`);
        for (const form of species.gigamax ? Object.keys(FORMS) : ['normal', 'dynamax']) {
            const button = control(FORMS[form], () => this.select(form));
            card.querySelector('.pokemon-forms').append(button);
            this.forms.set(form, button);
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
            if (event.detail === 0 || !dragged) this.play(this.primaryMove);
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
        this.camera = new PerspectiveCamera(32, 1, 0.01, 100);
        this.turntable = new Group();
        const fill = new HemisphereLight(0xffffff, 0xffe6d6, 1.85);
        const key = new DirectionalLight(0xfff8f1, 1.45);
        const rim = new DirectionalLight(0xffc9ad, 0.5);
        key.position.set(-3, 5, 5);
        rim.position.set(4, 2, -4);
        this.scene.add(this.turntable, fill, key, rim);
        this.observer = new ResizeObserver(() => this.invalidate());
        this.observer.observe(this.stage);
    }

    async getModel(id) {
        if (this.models.has(id)) return this.models.get(id);
        const pending = loader.loadAsync(asset(id, 'gltf')).then(async gltf => {
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
                idle: clips.get('Repouso') ?? clips.get('Repouso de batalha'),
            };
            this.setRest(model);
            const bounds = new Box3();
            const parts = id === 'cinderace-gigamax' ? [...body, ...props.filter(part => part.visible)] : body;
            for (const part of parts) bounds.expandByObject(part, true);
            if (bounds.isEmpty()) throw new Error(`Malha 3D vazia: ${id}`);
            model.center = bounds.getCenter(new Vector3());
            model.size = bounds.getSize(new Vector3());
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
        this.form = form;
        this.stage.dataset.form = form;
        for (const [key, button] of this.forms) button.setAttribute('aria-pressed', key === form);
        const id = form === 'gigamax' ? 'cinderace-gigamax' : this.species.id;
        const revision = ++this.revision;
        this.stopAttack();
        this.loading = true;
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
            const model = await this.getModel(id);
            if (revision !== this.revision) return;
            this.model = model;
            this.turntable.clear();
            const placement = new Group();
            placement.add(model.root);
            placement.position.copy(model.center).negate();
            this.turntable.add(placement);
            this.setRest(model);
            this.bounds = model.size;
            this.primaryMove = form === 'normal' && model.clips.has(MOVES.physical) ? MOVES.physical : MOVES.special;
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
            this.model = null;
            this.loading = false;
            this.preview.removeAttribute('src');
            this.preview.hidden = true;
            this.status.textContent = 'O modelo 3D não pôde ser carregado.';
            this.retry.hidden = false;
        }
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

    updateColor() {
        if (!this.model) return;
        const shiny = this.showcase.dataset.color === 'shiny';
        for (const [mesh, regular, rare] of this.model.materialPairs) mesh.material = shiny ? rare : regular;
        this.invalidate();
    }

    play(name) {
        if (!this.model || this.loading || this.attack) return;
        const { mixer, clips } = this.model;
        const clip = clips.get(name);
        if (!clip) return;
        mixer.stopAllAction();
        const action = mixer.clipAction(clip);
        action.reset().setLoop(LoopOnce, 1).play();
        action.clampWhenFinished = true;
        this.attack = { action, start: performance.now(), duration: clip.duration };
        this.stage.dataset.attacking = '';
        this.invalidate();
    }

    stopAttack() {
        if (!this.attack) return;
        this.attack = null;
        delete this.stage.dataset.attacking;
        this.setRest(this.model);
    }

    rotate(angle) {
        if (this.loading || !this.model) return;
        this.angle = angle % (2 * Math.PI);
        this.invalidate();
    }

    invalidate() {
        if (this.frameRequest || !this.model || this.loading || this.showcase.classList.contains('hidden')) return;
        this.frameRequest = requestAnimationFrame(now => {
            this.frameRequest = 0;
            this.render(now);
        });
    }

    render(now) {
        if (this.showcase.classList.contains('hidden') || !this.model || this.loading) return;
        const width = this.stage.clientWidth;
        const height = this.stage.clientHeight;
        if (!width || !height) return;

        if (this.attack) {
            const { action, start, duration } = this.attack;
            action.time = Math.max(0, (now - start) / 1000);
            if (action.time >= duration) this.stopAttack();
            else {
                this.model.mixer.update(0);
                this.updateProps(this.model, true);
                this.invalidate();
            }
        }

        const { renderer, camera, bounds } = this;
        if (width !== this.width || height !== this.height) {
            this.width = width;
            this.height = height;
            renderer.setSize(width, height, false);
        }
        camera.aspect = width / height;
        const tangent = Math.tan(camera.fov * Math.PI / 360);
        const fill = this.form === 'normal' ? this.species.size : 0.84;
        const objectWidth = Math.max(bounds.x, bounds.z);
        const distance = Math.max(bounds.y, objectWidth / camera.aspect) / (2 * tangent * fill) + bounds.z * 0.16;
        camera.near = distance / 80;
        camera.far = distance * 12;
        camera.position.set(0, bounds.y * 0.12, distance);
        camera.lookAt(0, bounds.y * (this.form === 'gigamax' ? 0.015 : 0.07), 0);
        camera.updateProjectionMatrix();
        this.turntable.rotation.y = this.angle;
        renderer.render(this.scene, camera);
    }

    suspend() {
        cancelAnimationFrame(this.frameRequest);
        this.frameRequest = 0;
        this.stopAttack();
    }
}

export function mountShowcase(section) {
    const grid = section.querySelector('.pokemon-grid');
    const template = section.querySelector('template');
    section.dataset.color = 'gray';
    const cards = SPECIES.map(species => {
        const card = template.content.firstElementChild.cloneNode(true);
        const viewer = new PokemonViewer(species, card, section);
        grid.append(card);
        return viewer;
    });
    const selectors = Array.from(section.querySelectorAll('button[data-color]'));
    for (const button of selectors) {
        button.addEventListener('click', () => {
            section.dataset.color = button.dataset.color;
            for (const item of selectors) item.setAttribute('aria-pressed', item === button);
            for (const card of cards) card.updateColor();
        });
    }
    for (const viewer of cards) viewer.select('normal');

    return {
        show: () => cards.forEach(card => card.invalidate()),
        hide: () => cards.forEach(card => card.suspend()),
    };
}
