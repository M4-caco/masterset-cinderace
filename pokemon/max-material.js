import { RepeatWrapping, TextureLoader } from './vendor/three-gltf.js';

let caustics;
const url = new URL('./visuals/max-caustics.webp', import.meta.url).href;

export function loadMaxPattern() {
    if (!caustics) {
        caustics = new TextureLoader().loadAsync(url).then(texture => {
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.needsUpdate = true;
            return texture;
        }).catch(() => {
            caustics = null;
            return null;
        });
    }
    return caustics;
}

// The Max shader follows the mesh. BreadMode supplies the underlight, two pink
// glow colors and the scrolling caustic map used by the game's material.
export function applyMaxMaterial(material, fx, fireball) {
    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, {
            maxPower: fx.power,
            maxTime: fx.time,
            maxPattern: fx.pattern,
            maxCenter: fx.center,
            maxHeight: fx.height,
            maxFireball: { value: fireball ? 1 : 0 },
        });
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vMaxPosition;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMaxPosition = position;');
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>
                varying vec3 vMaxPosition;
                uniform sampler2D maxPattern;
                uniform vec3 maxCenter;
                uniform float maxHeight, maxPower, maxTime, maxFireball;`)
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
                if (maxPower > 0.0) {
                    vec3 viewDirection = normalize(vViewPosition);
                    float edge = pow(1.0 - clamp(dot(normal, viewDirection), 0.0, 1.0), 2.15);
                    vec3 p = (vMaxPosition - maxCenter) / maxHeight;
                    vec2 scroll = vec2(0.005, -0.025) * maxTime;
                    vec2 uv = vec2(p.x + p.z * 0.55, p.y - p.z * 0.27) * 1.65 + vec2(0.5);
                    float pattern = texture2D(maxPattern, uv + scroll).r;
                    float ripple = smoothstep(0.17, 0.83, pattern);
                    float lower = 1.0 - smoothstep(-0.55, 0.6, p.y);
                    vec3 pink = mix(vec3(0.71, 0.018, 0.075), vec3(0.88, 0.13, 0.31), edge);
                    vec3 glow = mix(pink, vec3(0.69, 0.025, 0.012), maxFireball * 0.8);
                    float energy = edge * 0.64 + lower * 0.19 + ripple * (0.19 + edge * 0.19);
                    totalEmissiveRadiance += glow * energy * maxPower;
                    diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0, 0.77, 0.82), maxPower * (1.0-maxFireball*0.7));
                }`);
    };
    material.customProgramCacheKey = () => 'scorace-max-caustics-v1';
    material.needsUpdate = true;
}
