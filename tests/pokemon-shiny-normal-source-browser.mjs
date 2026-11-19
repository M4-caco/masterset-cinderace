// Real WebGL regression: compare the native normal Cinderace face and a
// Shiny face recolored from the SAME atlas, without publishing to Vercel.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';

const server=spawn('python3',['-m','http.server','8778','--bind','127.0.0.1'],
    {cwd:process.cwd(),stdio:'ignore'});
let browser;
try {
    for(let i=0;i<60;i++){
        try{if((await fetch('http://127.0.0.1:8778/')).ok)break;}catch{}
        if(i===59)throw new Error('Local server failed');
        await pause(250);
    }
    browser=await chromium.launch({
        executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
        headless:true,
        args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
            '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'],
    });
    const page=await browser.newPage({
        viewport:{width:1360,height:960},deviceScaleFactor:2,
        reducedMotion:'reduce',
    });
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8778/',{waitUntil:'domcontentloaded'});
    await page.locator('#nav-pokemon').click();
    const cinderace=page.locator('#pokemon-lineup .pokemon-viewer').nth(1);
    await page.waitForFunction(()=>{
        const v=document.querySelectorAll('#pokemon-lineup .pokemon-viewer')[1];
        return v && !v.querySelector('.pokemon-target')?.disabled &&
            !!v.querySelector('canvas');
    },null,{timeout:55000});
    await cinderace.locator('.pokemon-target').click();
    // The initial carousel interpolates between small and large renders.
    // Compare both forms only after the camera/model reaches its final size.
    await page.waitForTimeout(1800);
    const colors=page.locator('#pokemon-inspector .pokemon-controls').nth(1)
        .locator('.pokemon-colors button');
    const shiny=colors.filter({hasText:'Shiny'});
    const normal=colors.filter({hasText:'Normal'});
    const stage=cinderace.locator('.pokemon-stage');
    const capture=async ()=> {
        const rect=await stage.boundingBox();
        if(!rect)throw new Error('No 3D stage');
        return page.screenshot({type:'png',scale:'device',animations:'disabled',
            clip:{
                x:rect.x+rect.width*.29,y:rect.y+rect.height*.35,
                width:rect.width*.43,height:rect.height*.34
            }
        });
    };
    await normal.click();
    await page.waitForTimeout(700);
    const original=await capture();
    await shiny.click();
    await page.waitForTimeout(700);
    const modified=await capture();
    const atlas=await page.evaluate(async()=>{
        const {recolorNormalFaceForShiny}=await import('/pokemon/face-animation.js?v=19');
        const image=new Image();
        image.src='/pokemon/visuals/cinderace-face.webp';
        await image.decode();
        const singleHeight=image.height/3;
        const result=[];
        for(let pose=0;pose<3;pose++){
            const canvas=document.createElement('canvas');
            canvas.width=image.width;canvas.height=singleHeight;
            const ctx=canvas.getContext('2d',{willReadFrequently:true});
            ctx.drawImage(image,0,pose*singleHeight,image.width,singleHeight,
                0,0,image.width,singleHeight);
            const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
            const changed=recolorNormalFaceForShiny(data,canvas.width,canvas.height);
            let alphaChanged=0, recolored=0, untouchedWhite=0,
                navyChanged=0, originalRed=0, unchangedRed=0;
            for(let i=0;i<data.length;i+=4) {
                if(changed[i+3]!==data[i+3])alphaChanged++;
                if(changed[i]!==data[i]||changed[i+1]!==data[i+1]||
                    changed[i+2]!==data[i+2])recolored++;
                const x=(i/4)%canvas.width;
                const y=Math.floor(i/4/canvas.width);
                const withinEyes=y<singleHeight*.50 &&
                    ((x>30&&x<120)||(x>140&&x<250));
                if(withinEyes && data[i]>233&&data[i+1]>233&&data[i+2]>233&&
                    data[i+3]>0&&changed[i]===data[i]&&changed[i+1]===data[i+1]&&
                    changed[i+2]===data[i+2]) untouchedWhite++;
                if(withinEyes&&data[i]>120&&data[i]>data[i+1]+45&&
                    data[i]>data[i+2]+25) {
                    originalRed++;
                    if(changed[i]===data[i]&&changed[i+1]===data[i+1]&&
                        changed[i+2]===data[i+2])unchangedRed++;
                }
                if(data[i+2]>data[i]+20&&changed[i]>data[i]+100)navyChanged++;
            }
            result.push({pose,alphaChanged,recolored,untouchedWhite,
                navyChanged,originalRed,unchangedRed});
        }
        return result;
    });
    console.log('SHINY_ATLAS_METRICS='+JSON.stringify(atlas));
    // Emit comparable browser crops even if a later assertion fails.
    for(const [name,png] of [['NORMAL_FACE',original],['SHINY_FACE',modified]]){
        const encoded=png.toString('base64');
        for(let i=0;i<encoded.length;i+=3500)
            console.log(name+'_PNG_CHUNK:'+encoded.slice(i,i+3500));
    }
    for(const entry of atlas) {
        assert.equal(entry.alphaChanged,0,'no face alpha may be deleted');
        assert.ok(entry.recolored>1000,'native skin background recolored to shiny');
        assert.ok(entry.untouchedWhite>10,'original white eye art preserved');
        assert.ok(entry.originalRed>10&&entry.unchangedRed===entry.originalRed,
            'every original red iris pixel stays unchanged');
        if(entry.pose!==2)assert.ok(entry.navyChanged>10,'original dark blue eyelash palette updated');
    }
    assert.equal(await shiny.getAttribute('aria-pressed'),'true');
    assert.ok(original.length>3000&&modified.length>3000,'both 3D renders captured');
    // Existing unrelated homepage code emits a known frameReady TDZ
    // warning during initial load. This facial rendering change must not
    // introduce NEW runtime errors while the normal/Shiny switch occurs.
    const unrelated='Cannot access \'frameReady\' before initialization';
    assert.deepEqual(errors.filter(message=>message!==unrelated),[],
        'no new JavaScript errors while switching the Shiny face');
    console.log('SHINY_NORMAL_SOURCE='+JSON.stringify({
        atlas,normalSize:original.length,shinySize:modified.length,errors
    }));
}finally{
    if(browser)await browser.close();
    server.kill();
}
