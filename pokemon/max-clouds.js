const url = new URL('./visuals/max-clouds.gltf', import.meta.url).href;
let pending;

export function loadMaxClouds(loader) {
    if (!pending) {
        pending = loader.loadAsync(url).then(({ scene }) => {
            const materials = new Set();
            scene.traverse(object => {
                if (object.isMesh) materials.add(object.material);
            });
            for (const material of materials) {
                material.onBeforeCompile = shader => {
                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <emissivemap_fragment>',
                        `#include <emissivemap_fragment>
                        float face = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
                        float edge = pow(1.0 - face, 2.0);
                        float ripple = 0.5 + 0.5 * sin(normal.x * 9.0 + normal.y * 7.0 + normal.z * 5.0);
                        totalEmissiveRadiance += vec3(0.68, 0.004, 0.062) * (0.08 + edge * (0.73 + ripple * 0.26));
                        `,
                    );
                };
                material.customProgramCacheKey = () => 'scorace-max-clouds';
            }
            return scene;
        }).catch(error => {
            pending = null;
            console.warn('Scorace · Nuvens Max', error);
            return null;
        });
    }
    return pending;
}

export function positionMaxClouds(cloud, modelHeight, frameHeight, time) {
    const spread = Math.min(0.43, Math.max(0.15, modelHeight * 0.26));
    const ceiling = frameHeight * 0.84;
    cloud.position.y = Math.min(ceiling - spread * 0.46, modelHeight + 0.11 + spread * 0.22);
    cloud.position.z = -0.15;
    cloud.scale.setScalar(spread);
    cloud.rotation.set(-0.13, Math.sin(time * 0.42) * 0.36, Math.sin(time * 0.58) * 0.06);
    for (const [index, cluster] of cloud.children.entries()) {
        cluster.rotation.set(time * (index % 2 ? -0.63 : 0.48), time * 0.7 + index, time * 0.26);
    }
}
