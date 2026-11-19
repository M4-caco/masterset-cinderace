import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Scene } from '../pokemon/vendor/three-gltf.js';
import { MaxLandingImpact, rockFlight } from '../pokemon/max-landing.js';

for (const compact of [false, true]) {
    const scene = new Scene();
    const impact = new MaxLandingImpact(scene, compact);
    assert.equal(scene.children.length, 1, 'the 3D effect group must be pooled');
    const initialChildren = impact.group.children.length;
    assert.equal(initialChildren, compact ? 15 : 31);
    for (let restart = 0; restart < 100; restart++) {
        const origin = restart * 2100;
        impact.start(2.92, origin);
        assert.ok(impact.active);
        assert.equal(scene.children.length, 1);
        assert.equal(impact.group.children.length, initialChildren, 'repeat bursts cannot accumulate meshes');
        for (const t of [0, 50, 200, 420, 900, 1250]) {
            impact.update(origin + t);
            for (const rock of impact.rocks) {
                assert.ok([rock.position.x, rock.position.y, rock.position.z].every(Number.isFinite));
                assert.ok(rock.position.y >= -1e-6, 'rocks must not cross the floor');
            }
        }
        impact.update(origin + 1600);
        assert.equal(impact.active, false);
        assert.equal(impact.group.visible, false);
        assert.equal(impact.group.children.length, initialChildren);
    }
    impact.start(1.6, 500000);
    const firstSeed = impact.seeds[0];
    const start = rockFlight(firstSeed, 0);
    const flight = rockFlight(firstSeed, 0.2);
    assert.ok(flight.y > start.y, 'rocks should be kicked upwards first');
    assert.ok(Math.hypot(flight.x, flight.z) > Math.hypot(start.x, start.z));
    for (const t of [0, 0.2, 0.55, 0.85, 1.2, 1.54]) {
        const p = rockFlight(firstSeed, t);
        assert.ok(p.y >= firstSeed.ground);
        assert.ok(p.fade >= 0 && p.fade <= 1);
    }
    impact.dispose();
    assert.equal(scene.children.length, 0);
    assert.equal(impact.group.children.length, 0);
}

// Verify the transition hookup uses the active 3D scene, not a separate
// camera or the rotating character subtree. No WebGL window is needed here.
const showcase = await readFile(new URL('../pokemon/showcase.js', import.meta.url), 'utf8');
assert.match(showcase, /this\.maxLanding = new MaxLandingImpact\(this\.scene, mobile\.matches\)/);
assert.match(showcase, /this\.maxLanding\?\.clear\(\)/);
assert.match(showcase, /if \(maxTransformation\) this\.maxLanding\.start/);
assert.match(showcase, /this\.maxLanding\?\.update\(now\);[\s\S]*?renderer\.render\(this\.scene, camera\)/);
const entry = await readFile(new URL('../pokemon/entry.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(entry, /showcase\.js\?v=51/);
assert.match(index, /pokemon\/entry\.js\?v=51/);
console.log('PASS: 100 rapid Max effect restarts for desktop and mobile, bounce physics, cleanup and cache chain.');
