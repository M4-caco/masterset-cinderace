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

// Pokemon_UBER_MAX projects caustics in screen space. The model bundles
// supply these attenuation, underlight and color values through BreadMode.
export function applyMaxMaterial(material, fx) {
    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, {
            maxPower: fx.power,
            maxTime: fx.time,
            maxPattern: fx.pattern,
            maxAspect: fx.aspect,
        });
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', `#include <common>
                varying vec4 vMaxProjection;
                varying vec2 vMaxLight;`)
            .replace('#include <project_vertex>', `#include <project_vertex>
                vMaxProjection = gl_Position;
                vec3 maxNormal = normalize(transformedNormal);
                vec3 underLight = normalize(mat3(viewMatrix) * vec3(0.0, -1.0, 0.1));
                vMaxLight.x = clamp(maxNormal.z, 0.0, 1.0);
                vMaxLight.y = (dot(maxNormal, underLight) * 0.5 + 0.5) * 0.95;`);
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>
                varying vec4 vMaxProjection;
                varying vec2 vMaxLight;
                uniform sampler2D maxPattern;
                uniform float maxAspect, maxPower, maxTime;`)
            .replace('#include <opaque_fragment>', `
                if (maxPower > 0.0) {
                    vec2 screenUv = vMaxProjection.xy / vMaxProjection.w * 0.5 + 0.5;
                    vec2 causticUv = (screenUv + maxTime * vec2(0.005, -0.025)) * vec2(maxAspect, 1.0);
                    float caustic = texture2D(maxPattern, causticUv).r;

                    float light = smoothstep(0.26, 0.46, vMaxLight.y);
                    vec3 body = outgoingLight * mix(vec3(0.58497, 0.50196, 1.0), vec3(1.0), light);
                    float glowGradient = smoothstep(0.65, 0.85, vMaxLight.y);
                    vec3 glow = mix(vec3(2.35068, 0.0, 0.39383), vec3(2.35068, 0.82458, 1.3), glowGradient);
                    float rim = 2.0 * (1.0 - smoothstep(-0.65, 0.65, vMaxLight.x));
                    vec3 maxColor = mix(body, glow, rim) + vec3(0.8, 0.0, 0.2) * caustic;
                    outgoingLight = mix(outgoingLight, maxColor, maxPower);
                }
                #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => 'scorace-bread-mode';
    material.needsUpdate = true;
}
