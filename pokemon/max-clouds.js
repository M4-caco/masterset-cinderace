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

export function positionMaxClouds(cloud, modelHeight, frameHeight, heading, time, floor) {
    const spread = Math.min(0.46, Math.max(0.22, modelHeight * 0.24));
    const ceiling = frameHeight * floor;
    cloud.position.set(0, Math.min(ceiling - spread * 0.63, modelHeight + spread * 0.38 + 0.09), -0.04);
    cloud.scale.setScalar(spread);
    cloud.rotation.set(-0.27, 0, 0);

    const radius = 1.08;
    const phase = time * 0.82 - heading;
    const separation = 2 * Math.PI / cloud.children.length;
    for (const [index, cluster] of cloud.children.entries()) {
        const angle = phase + index * separation;
        cluster.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        cluster.rotation.set(-0.14, -angle + Math.PI * 0.5, Math.sin(time * 0.75 + index) * 0.16);
    }
}
