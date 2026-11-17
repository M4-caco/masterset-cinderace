import { TextureLoader } from './vendor/three-gltf.js';

const modelUrl = new URL('./visuals/max-clouds.gltf?v=5', import.meta.url).href;
const textureUrl = new URL('./visuals/max-cloud-animation.png', import.meta.url).href;
let source;

const linear = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const edgeColor = [0.945098, 0.043137, 0.261183].map(linear).join(', ');
const coreColor = [0.273585, 0.070977, 0.070977].map(linear).join(', ');

function makeClouds(scene, texture) {
    const cloud = scene.clone(true);
    const uniforms = { cloudTime: { value: 0 }, cloudHeading: { value: 0 }, cloudMotion: { value: texture } };
    cloud.userData.motion = uniforms;
    cloud.traverse(mesh => {
        if (!mesh.isMesh) return;
        mesh.frustumCulled = false;
        mesh.material = mesh.material.clone();
        mesh.material.customProgramCacheKey = () => 'scorace-original-max-cloud-v1';
        mesh.material.onBeforeCompile = shader => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
                attribute vec4 _cloud_data;
                uniform float cloudTime;
                uniform float cloudHeading;
                uniform sampler2D cloudMotion;
                varying vec3 cloudNormal;
                varying float cloudTop;`).replace('#include <begin_vertex>', `
                // RGB stores travel, vertical bob and scale over one 6.5-second cycle.
                float moving = step(0.001, _cloud_data.r);
                float phase = fract(cloudTime / 6.5 + _cloud_data.r) * moving;
                vec3 motion = texture2D(cloudMotion, vec2(phase, 0.5)).rgb;
                float scale = 1.25 * _cloud_data.a * mix(1.0, motion.b, moving);
                vec3 local = position * vec3(-scale, scale, scale);
                local.x -= 0.45 * motion.r * moving;
                local.y += 0.09 * (motion.g - 0.5) * moving;
                local.z += 0.4 - 0.4 * motion.r * phase;

                float angle = cloudTime * 0.130899694 + _cloud_data.g * 6.283185307 - cloudHeading;
                float s = sin(angle);
                float c = cos(angle);
                vec3 transformed = vec3(-c * local.x - s * local.z, local.y, -s * local.x + c * local.z);
                vec3 turnedNormal = vec3(c * normal.x - s * normal.z, normal.y, s * normal.x + c * normal.z);
                cloudNormal = normalMatrix * turnedNormal;
                cloudTop = turnedNormal.y;`);
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
                varying vec3 cloudNormal;
                varying float cloudTop;`).replace('#include <opaque_fragment>', `
                float rim = 1.0 - max(0.0, normalize(cloudNormal).z);
                float gradient = pow(clamp(cloudTop, 0.0, 1.0), 0.01);
                vec3 bottomColor = vec3(1.0, 0.0, 0.0);
                vec3 topColor = vec3(1.0, 0.0, ${linear(0.017315865)});
                outgoingLight = clamp(vec3(${coreColor}) * mix(bottomColor, topColor, gradient)
                    + rim * vec3(${edgeColor}), 0.0, 1.0);
                diffuseColor.a = 1.0;
                #include <opaque_fragment>`);
        };
    });
    return cloud;
}

export function loadMaxClouds(loader) {
    if (!source) {
        source = Promise.all([loader.loadAsync(modelUrl), new TextureLoader().loadAsync(textureUrl)])
            .catch(error => {
                source = null;
                console.warn('Scorace · Nuvens Max', error);
                return null;
            });
    }
    return source.then(assets => assets ? makeClouds(assets[0].scene, assets[1]) : null);
}

export function positionMaxClouds(cloud, modelHeight, frameHeight, heading, time, floor, mountScale, halfWidth, gigamax = false, headPosition = null, focused = false) {
    // Preserve the original Dynamax behavior for Scorbunny and Raboot.
    // Their orbit should NOT move with the head bone or react to G-Max changes.
    const scale = Math.min(mountScale, halfWidth / 0.52);
    const ceiling = frameHeight * floor;
    if (!gigamax) {
        const clearSky = scale * 0.31;
        // The side view keeps its established spacing. The center view has
        // additional pre-reserved sky, so it can keep the cloud away from the ears.
        const gap = focused ? 0.12 : 0;
        const y = Math.min(ceiling - clearSky, modelHeight + scale * (0.18 + gap));
        cloud.position.set(0, y, -0.03);
    } else {
        // Only Cinderace Gigamax needs a head-relative correction. The shader
        // moves the clouds above their origin, so leave room below the top edge
        // rather than allowing the ring to disappear outside the canvas.
        const headY = headPosition?.y ?? modelHeight;
        const skyMargin = scale * 0.28;
        const gap = focused ? 0.12 : 0;
        const y = Math.min(ceiling - skyMargin, headY + scale * (0.13 + gap));
        const z = -Math.max(1.6, scale * 1.85);
        cloud.position.set(headPosition?.x ?? 0, y, z);
    }
    cloud.scale.setScalar(scale);
    cloud.rotation.set(-0.19, 0, 0);
    cloud.userData.motion.cloudTime.value = time;
    cloud.userData.motion.cloudHeading.value = heading;
}
