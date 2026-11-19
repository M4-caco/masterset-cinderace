// Verify that move badges contain real visible SVG path geometry in Chromium.
// This runs against the PR's local checkout, not a Vercel preview.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
const server=spawn('python3',['-m','http.server','8772','--bind','127.0.0.1'],
  {cwd:process.cwd(),stdio:'ignore'});
let browser;
try {
  for(let n=0;n<40;n++){
    try { if((await fetch('http://127.0.0.1:8772/')).ok)break; }catch {}
    if(n===39)throw new Error('Local server did not start');
    await pause(250);
  }
  browser=await chromium.launch({
    executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
    args:['--no-sandbox','--disable-dev-shm-usage',
      '--enable-webgl','--enable-unsafe-swiftshader',
      '--use-gl=angle','--use-angle=swiftshader'],
    headless:true
  });
  const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8772/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav-pokemon').click();
  const cinderace=page.locator('#pokemon-lineup .pokemon-viewer').nth(1);
  await page.waitForFunction(()=>{
    const v=document.querySelectorAll('#pokemon-lineup .pokemon-viewer')[1];
    return v && !v.querySelector('.pokemon-target')?.disabled && !!v.querySelector('canvas');
  },null,{timeout:45000});
  await cinderace.locator('.pokemon-target').click();
  // Captions were moved below the 3D stage; they must visually dim together
  // with their non-selected models, but keep the selected name at full light.
  await page.mouse.move(8, 8); // no hovered Pokémon
  // Browser/3D initialization may delay the 360ms stage/label transitions.
  // Wait for the final CSS state instead of reading halfway through a fade.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('#pokemon-lineup .pokemon-viewer')].every(el => {
      const selected=el.hasAttribute('data-selected');
      const caption=getComputedStyle(el.querySelector('.pokemon-stage-species')).filter;
      const model=getComputedStyle(el.querySelector('.pokemon-stage')).filter;
      const expected=selected?'none':'brightness(0.59) saturate(0.82)';
      return caption===expected && model===expected;
    }), null, { timeout: 10000 });
  const names = await page.locator('#pokemon-lineup .pokemon-viewer')
    .evaluateAll(viewers => viewers.map(viewer => ({
      selected: viewer.hasAttribute('data-selected'),
      caption: getComputedStyle(viewer.querySelector('.pokemon-stage-species')).filter,
      model: getComputedStyle(viewer.querySelector('.pokemon-stage')).filter,
    })));
  assert.equal(names.length, 3);
  for (const item of names) {
    assert.equal(item.caption, item.model,
      'caption and Pokémon model must use the same brightness filter');
    assert.equal(item.caption, item.selected ? 'none'
      : 'brightness(0.59) saturate(0.82)',
      'only the selected Pokémon name should stay fully bright');
  }

  const controls=page.locator('#pokemon-inspector .pokemon-controls').nth(1);
  const buttons=controls.locator('.pokemon-moves .pokemon-icon-control');
  await page.waitForFunction(()=> {
    const v=document.querySelectorAll('#pokemon-inspector .pokemon-controls')[1];
    return v && v.querySelectorAll('.pokemon-moves button').length>=2;
  },null,{timeout:20000});
  const states=await buttons.evaluateAll(nodes=>nodes.map(el=>{
    const svg=el.querySelector('.pokemon-badge svg');
    return {label:el.textContent.trim(),pathCount:svg?.querySelectorAll('path').length||0,
      paths:[...(svg?.querySelectorAll('path')||[])].map(p=>p.getAttribute('d'))};
  }));
  for(const state of states)
    assert.ok(state.paths.length && state.paths.every(p=>p && p.trim().length>15),
      'missing actual SVG glyph for '+state.label);
  assert.ok(states.length>=2,'two or more Cinderace moves are exposed');
  const fireBadge=buttons.first().locator('.pokemon-badge');
  const fireAppearance=await fireBadge.evaluate(el=>{
    const style=getComputedStyle(el);
    const svg=el.querySelector('svg');
    return {bg:style.backgroundColor, border:style.borderWidth, size:style.width,
      whiteArt:getComputedStyle(svg).color, path:svg.querySelector('path')?.getAttribute('d')};
  });
  assert.equal(fireAppearance.bg,'rgb(255, 164, 86)','GO-inspired flat Fire orange');
  assert.equal(fireAppearance.size,'36px','readable GO-like battle icon scale');
  assert.ok(parseFloat(fireAppearance.border)>1,'thin game-like white outline');
  assert.ok(fireAppearance.path?.includes('13.6'), 'curled white flame silhouette loaded');

  // Selected state is brightness, never the old square outline.
  const selectedColor=controls.locator('.pokemon-colors .pokemon-icon-control[aria-pressed="true"]');
  const unselectedColor=controls.locator('.pokemon-colors .pokemon-icon-control[aria-pressed="false"]');
  await page.waitForTimeout(230);
  const appearance=await selectedColor.evaluate(el=>{
    const style=getComputedStyle(el);
    return { border:style.borderWidth,background:style.backgroundColor,filter:style.filter };
  });
  const dim=await unselectedColor.evaluate(el=>getComputedStyle(el).filter);
  assert.equal(appearance.border,'0px','no square around selected color');
  assert.ok(appearance.background==='rgba(0, 0, 0, 0)'||appearance.background==='transparent',
    'no selected square background');
  assert.equal(appearance.filter,'brightness(1)','selected color stays 100% bright');
  assert.equal(dim,'brightness(0.57) saturate(0.84)',
    'unselected color/form uses dimmed state');
  const typeIcon=buttons.first();
  assert.equal(await typeIcon.getAttribute('aria-pressed'),'false');
  await typeIcon.click();
  assert.equal(await typeIcon.getAttribute('data-executing'),'true',
    'active native move starts circular ring');
  assert.equal(await typeIcon.getAttribute('aria-pressed'),'true',
    'active move is full brightness');
  const circle=typeIcon.locator('.pokemon-move-timer-fill');
  await page.waitForTimeout(105);
  const offset=await circle.evaluate(el=>Number(el.style.strokeDashoffset));
  assert.ok(Number.isFinite(offset)&&offset>=0&&offset<100,
    'ring must advance during actual clip: '+offset);
  // Do not take a screenshot in the first few animation frames. Capture
  // a visibly filled meter and prove it updates beyond its initial value.
  await page.waitForFunction(() => {
    const circle=document.querySelectorAll('#pokemon-inspector .pokemon-controls')[1]
      ?.querySelector('.pokemon-moves [data-executing] .pokemon-move-timer-fill');
    return circle && Number(circle.style.strokeDashoffset) < 75;
  },null,{timeout:9000});
  const middleOffset=await circle.evaluate(el=>Number(el.style.strokeDashoffset));
  assert.ok(middleOffset>=0&&middleOffset<75,
    'ring advances to at least 25% before native clip completes');
  const region=controls.locator('.pokemon-control-group').last();
  const png=await region.screenshot({type:'png',animations:'disabled'});
  await page.waitForFunction(()=>{
    const el=document.querySelectorAll('#pokemon-inspector .pokemon-controls')[1]?.querySelector('.pokemon-moves button');
    return !el || !el.hasAttribute('data-executing');
  },null,{timeout:12000});
  assert.equal(await typeIcon.getAttribute('aria-pressed'),'false',
    'move returns to dimmed state at clip end');
  // Check the second type as actually rendered on Scorbunny (not a stub).
  const scorbunny=page.locator('#pokemon-lineup .pokemon-viewer').first();
  await scorbunny.locator('.pokemon-target').click();
  await page.waitForFunction(()=>{
    const chosen=document.querySelector('#pokemon-lineup .pokemon-viewer[data-selected]');
    return chosen && chosen.querySelector('.pokemon-stage-species')?.textContent==='SCORBUNNY' &&
      chosen.querySelector('.pokemon-moves [data-move-type="normal"]');
  },null,{timeout:25000});
  const normalBadge=scorbunny.locator('.pokemon-moves [data-move-type="normal"] .pokemon-badge');
  const normalAppearance=await normalBadge.evaluate(el=>{
    const style=getComputedStyle(el);
    return {bg:style.backgroundColor,ring:!!el.querySelector('svg circle')};
  });
  assert.equal(normalAppearance.bg,'rgb(152, 161, 168)','GO-inspired flat Normal grey');
  assert.ok(normalAppearance.ring,'Normal-type pictogram is a bold white ring');
  console.log('GO_BADGES='+JSON.stringify({fireAppearance,normalAppearance}));
  console.log('MOVE_EXECUTION='+JSON.stringify({appearance,dim,offset,middleOffset,
    cleared:true}));
  console.log('MOVE_ICONS='+JSON.stringify({moves:states.map(({label,pathCount})=>({label,pathCount})),
    errors:errors.slice(0,3)}));
  const encoded=png.toString('base64');
  for(let i=0;i<encoded.length;i+=3000)
    console.log('MOVE_ICONS_PNG_CHUNK:'+encoded.slice(i,i+3000));
} finally {
  if(browser)await browser.close();
  server.kill();
}
