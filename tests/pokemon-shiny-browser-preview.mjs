// Captures the actual local browser rendering of the unmerged SCORACE branch.
// Never touches Vercel, Firebase or the production GitHub branch.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], {
    cwd: process.cwd(), stdio: 'ignore'
});
let browser;
try {
    for (let i = 0; i < 60; i++) {
        try {
            const response = await fetch('http://127.0.0.1:8765/pokemon/face-animation.js');
            if (response.ok) break;
        } catch {}
        if (i === 59) throw new Error('Local server failed to start');
        await delay(250);
    }
    browser = await chromium.launch({
        executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
        headless: true,
        args: [
            '--no-sandbox', '--disable-dev-shm-usage',
            '--enable-webgl', '--enable-unsafe-swiftshader',
            '--use-gl=angle', '--use-angle=swiftshader'
        ],
    });
    const page = await browser.newPage({
        viewport: { width: 1360, height: 940 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.locator('#nav-pokemon').click({ timeout: 25000 });
    const cinderace = page.locator('#pokemon-lineup .pokemon-viewer').nth(1);
    await page.waitForFunction(() => {
        const viewer = document.querySelectorAll('#pokemon-lineup .pokemon-viewer')[1];
        return viewer && !viewer.querySelector('.pokemon-target')?.disabled &&
            !!viewer.querySelector('canvas');
    }, { timeout: 45000 });
    await cinderace.locator('.pokemon-target').click();
    const shinyButton = page.locator('#pokemon-inspector .pokemon-colors button').filter({hasText:'Shiny'});
    await shinyButton.click({ timeout: 15000 });
    await page.waitForTimeout(1800);
    const canvas = cinderace.locator('canvas');
    if (!(await canvas.count())) throw new Error('No WebGL canvas present in Cinderace');
    const stage = cinderace.locator('.pokemon-stage');
    const shot = await stage.screenshot({type:'png',animations:'disabled',timeout:20000});
    console.log('VISUAL_RENDER_SUMMARY='+JSON.stringify({
        status: 'captured',
        pixels: (await stage.boundingBox())?.width,
        shiny: await shinyButton.getAttribute('aria-pressed'),
        webgl: await canvas.evaluate(el => !!el.getContext('webgl2')),
        pageErrors: errors.slice(0,4),
    }));
    const base64 = shot.toString('base64');
    console.log('SCORACE_SCREENSHOT_BEGIN');
    for (let i = 0; i < base64.length; i += 3500)
        console.log('SCORACE_SCREENSHOT_CHUNK:'+base64.slice(i,i+3500));
    console.log('SCORACE_SCREENSHOT_END');
} finally {
    if (browser) await browser.close();
    server.kill();
}
