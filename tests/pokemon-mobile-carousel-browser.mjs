// Browser-level verification of the mobile-only Pokédex carousel.
// Uses the branch's localhost, NOT Vercel or production.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const server=spawn('python3',['-m','http.server','8775','--bind','127.0.0.1'],{
    cwd:process.cwd(),stdio:'ignore'
});
let browser;
try{
    for(let i=0;i<60;i++){
        try{if((await fetch('http://127.0.0.1:8775/')).ok)break;}catch{}
        if(i===59)throw Error('Local server failed');
        await delay(250);
    }
    browser=await chromium.launch({
        executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
        headless:true,
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
          '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'],
    });
    const page=await browser.newPage({
        viewport:{width:390,height:844},deviceScaleFactor:1.5,
        isMobile:true,hasTouch:true,reducedMotion:'no-preference'
    });
    await page.addInitScript(()=>{
        window.__mobileAudioPlays=[];
        HTMLMediaElement.prototype.canPlayType=function(type){
            if(type.includes('ogg'))return '';
            return 'probably';
        };
        HTMLMediaElement.prototype.play=function(){
            window.__mobileAudioPlays.push(this.currentSrc||this.src);
            return Promise.resolve();
        };
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8775/',{waitUntil:'domcontentloaded'});
    await page.locator('#nav-pokemon').click();
    await page.waitForFunction(()=>{
        const stage=document.querySelector('.pokemon-viewer[data-selected] .pokemon-stage');
        return stage && stage.querySelector('canvas') && stage.hasAttribute('data-ready');
    },null,{timeout:50000});
    const selectedName=()=>page.locator('.pokemon-viewer[data-selected] .pokemon-stage-species').textContent();
    assert.equal((await selectedName()).trim(),'SCORBUNNY');
    const nav=page.locator('.pokemon-pagination');
    const next=nav.locator('[data-next]');
    const prev=nav.locator('[data-prev]');
    assert.equal(await next.locator('svg polygon').count(),1,'right SVG uploaded');
    assert.equal(await prev.locator('svg polygon').count(),1,'left SVG uploaded');
    const bg=await next.evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.ok(bg==='rgba(0, 0, 0, 0)'||bg==='transparent','mobile arrow has no square background: '+bg);
    assert.equal(await page.locator('.pokemon-welcome').count(),0,'old welcome sentence removed');
    const top=(await page.locator('.pokemon-viewer[data-selected] .pokemon-stage').boundingBox()).y;
    const labelY=(await page.locator('.pokemon-viewer[data-selected] .pokemon-stage-species').boundingBox()).y;
    assert.ok(labelY>top+40,'caption after stage, not floating above Pokémon');
    await next.click();
    assert.equal((await selectedName()).trim(),'RABOOT');
    await page.waitForFunction(()=>{
        const el=document.querySelector('.pokemon-viewer[data-selected] .pokemon-stage');
        return el&&el.hasAttribute('data-ready');
    },null,{timeout:50000});
    await prev.click();
    assert.equal((await selectedName()).trim(),'SCORBUNNY');
    const played=await page.evaluate(()=>window.__mobileAudioPlays);
    assert.ok(played.filter(url=>url.includes('scorbunny.mp3')).length>=2,
      'Scorbunny greeting repeats upon return, including initial Pokémon tab tap: '+played);
    assert.ok(played.some(url=>url.includes('raboot.mp3')),
      'Raboot greeting plays synchronously on arrow: '+played);
    const caption=page.locator('.pokemon-viewer[data-selected] .pokemon-stage-species');
    assert.equal(await caption.textContent(),'SCORBUNNY');
    const image=await page.screenshot({type:'png',animations:'disabled'});
    console.log('MOBILE_POKEMON_TEST='+JSON.stringify({
      selected:await selectedName(),
      audio:played,
      arrowBackground:bg,
      pageErrors:errors.slice(0,4),
    }));
    const encoded=image.toString('base64');
    for(let i=0;i<encoded.length;i+=3500)
      console.log('MOBILE_POKEMON_PNG_CHUNK:'+encoded.slice(i,i+3500));
}finally{
    if(browser)await browser.close();
    server.kill();
}
