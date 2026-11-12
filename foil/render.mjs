const clamp = (x, min=0, max=1) => Math.max(min,Math.min(max,x));
const attackPanel = {top:464, bottom:784};
const footerTop = 825;
const motifLayout = {
  fogo: {artBottom:366, ruleTop:630, ruleBottom:654},
  pokebola: {artBottom:741, ruleTop:1265, ruleBottom:1306},
  master: {artBottom:744, ruleTop:1274, ruleBottom:1317}
};
function smooth(lo, hi, value) {
  const t = clamp((value-lo)/(hi-lo));
  return t*t*(3-2*t);
}
function seededRandom(seed) {
  return () => {
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    return seed/4294967296;
  };
}

const maxTilt = {x:11.5,y:14};

function motifMap(source,id,w,h,surface) {
  const sw=source.naturalWidth??source.width, sh=source.naturalHeight??source.height;
  const ctx=surface(sw,sh);
  ctx.drawImage(source,0,0);
  const map=ctx.getImageData(0,0,sw,sh).data;
  const result=new Uint8Array(w*h);
  const {artBottom,ruleTop,ruleBottom}=motifLayout[id];
  const attackScale=(ruleTop-artBottom)/(attackPanel.bottom-attackPanel.top);
  for(let y=0;y<h;y++){
    const cardY=(y+.5)*920/h;
    if(cardY<attackPanel.top||(cardY>=attackPanel.bottom&&cardY<footerTop))continue;
    // Register the two visible pieces at the edges of the printed strip.
    const sourceY=cardY<attackPanel.bottom
      ? artBottom+(cardY-attackPanel.top)*attackScale
      : ruleBottom+(cardY-footerTop)*sh/920;
    if(sourceY<.529*sh||sourceY>=.96*sh)continue;
    const row=Math.floor(sourceY)*sw;
    for(let x=0;x<w;x++){
      const sx=x/w-.024;
      if(sx<.349||sx>.937)continue;
      const sample=map[(row+Math.round(sx*(sw-1)))*4];
      result[y*w+x]=255*(1-smooth(30,205,sample));
    }
  }
  return result;
}

function drawFriendBall(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0,0,100,0,2*Math.PI);
  ctx.clip();
  ctx.fillRect(-100,-100,200,83);
  ctx.fillRect(-100,17,200,83);
  ctx.globalCompositeOperation='destination-out';
  ctx.beginPath();
  ctx.arc(0,0,42,0,2*Math.PI);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.rect(-100,28,200,72);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(0,0,89,0,2*Math.PI);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0,-78,9,0,2*Math.PI);
  ctx.fill();
  const petals=new ctx.Path2D('M 25 -54 C 20 -61 28 -82 36 -78 C 50 -75 48 -62 33 -52 C 29 -49 26 -50 25 -54 Z M 45 -32 C 44 -38 58 -51 67 -49 C 79 -47 79 -34 69 -31 C 62 -28 47 -27 45 -32 Z');
  ctx.fill(petals);
  ctx.save();
  ctx.scale(-1,1);
  ctx.fill(petals);
  ctx.restore();
  ctx.globalCompositeOperation='source-over';
  ctx.fillRect(-100,-6.4,200,12.8);
  ctx.beginPath();
  ctx.arc(0,0,32.2,0,2*Math.PI);
  ctx.fill();
  ctx.globalCompositeOperation='destination-out';
  ctx.beginPath();
  ctx.arc(0,0,19.4,0,2*Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawCentralFlame(ctx) {
  ctx.beginPath();
  ctx.arc(0,0,100,0,2*Math.PI);
  ctx.fill();
  ctx.globalCompositeOperation='destination-out';
  ctx.fill(new ctx.Path2D('M -11 -80 C 27 -63 30 -25 27 -2 C 43 -6 59 -15 61 -28 C 76 -10 69 13 43 30 C 59 27 72 17 81 7 C 74 48 41 83 2 85 C -35 86 -61 68 -70 42 C -61 46 -55 47 -50 47 C -76 30 -70 -5 -48 -29 C -52 -12 -49 2 -35 11 C -44 -7 -39 -21 -27 -34 C -13 -48 7 -56 -11 -80 Z'));
  ctx.globalCompositeOperation='source-over';
  ctx.fill(new ctx.Path2D('M 2 10 C -4 23 7 27 9 40 C 13 32 21 29 29 29 C 10 44 28 55 28 65 C 24 78 -14 80 -29 69 C -40 61 -29 52 -24 46 C -21 40 -25 35 -32 32 C -24 31 -17 36 -15 42 C -7 31 -14 24 2 10 Z'));
}

function drawScatteredFlames(ctx) {
  const flame=new ctx.Path2D('M 0 -50 C 17 -40 21 -22 16 -7 C 27 -9 34 -16 36 -22 C 43 -8 37 6 23 15 C 31 14 39 8 44 1 C 45 27 25 46 2 48 C -21 48 -40 34 -44 13 C -39 18 -33 19 -28 17 C -43 4 -37 -12 -25 -25 C -27 -14 -24 -5 -16 -2 C -20 -15 -12 -27 -4 -34 C 1 -39 2 -45 0 -50 Z M 2 9 C 1 18 9 19 8 27 C 12 23 16 22 20 22 C 13 28 20 34 16 38 C 9 45 -9 43 -14 37 C -19 32 -8 26 -14 21 C -9 20 -5 24 -4 27 C 1 21 -6 16 2 9 Z');
  const random=seededRandom(243);
  for(let row=0;row<4;row++){
    for(let column=0;column<4;column++){
      const x=54+column*162+(row%2)*77+(random()-.5)*29;
      const y=473+row*107+(random()-.5)*27;
      const scale=.76+random()*.28;
      ctx.save();
      ctx.translate(x,y);
      ctx.scale(scale,scale);
      ctx.globalAlpha=.54+random()*.43;
      ctx.fill(flame,'evenodd');
      ctx.restore();
    }
  }
}

function newMotifMap(id,w,h,surface) {
  const ctx=surface(w,h);
  ctx.scale(w/660,h/920);
  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.rect(28,attackPanel.top,608,attackPanel.bottom-attackPanel.top);
  ctx.clip();
  if(id==='chamas') {
    drawScatteredFlames(ctx);
  } else {
    ctx.translate(330,624);
    ctx.scale(1.46,1.46);
    if(id==='friend')drawFriendBall(ctx);
    else drawCentralFlame(ctx);
  }
  const pixels=ctx.getImageData(0,0,w,h).data;
  return Uint8Array.from({length:w*h},(_,j)=>pixels[j*4+3]);
}

function starMap(w,h,surface) {
  const ctx=surface(w,h);
  const random=seededRandom(1903);
  const columns=54;
  const spacing=w/columns;
  for(let row=0;row<Math.ceil(h/spacing);row++)for(let column=0;column<columns;column++){
    const x=(column+.5+(random()-.5)*.77)*spacing;
    const y=(row+.5+(random()-.5)*.77)*spacing;
    const radius=(.43+random()**1.65*.44)*spacing;
    const angle=32+Math.floor(random()*201);
    const hue=Math.floor(random()*256);
    const strength=90+Math.floor(random()*166);
    ctx.fillStyle='rgb('+angle+' '+hue+' '+strength+')';
    ctx.beginPath();
    const rotation=random()*Math.PI*2;
    for(let tip=0;tip<10;tip++){
      const a=rotation+tip*Math.PI/5,r=tip%2?radius*.46:radius;
      const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
      if(tip===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fill();
  }
  return ctx.getImageData(0,0,w,h).data;
}
function prismGeometry(w,h) {
  const columns=256, rows=192, repeatY=.89;
  const count=columns*rows;
  const xLocal=new Float32Array(count), yLocal=new Float32Array(count);
  const radius=new Float32Array(count), disk=new Float32Array(count), rim=new Float32Array(count);
  const square=new Float32Array(count), squareCrease=new Float32Array(count);
  const normalX=new Float32Array(count), normalY=new Float32Array(count);
  const fold=new Float32Array(count), reverseFold=new Float32Array(count);
  const bridge=new Float32Array(count), bridgeCrease=new Float32Array(count);
  const bridgeNormalX=new Float32Array(count), bridgeNormalY=new Float32Array(count);
  const pixels=new Uint16Array(w*h);
  const wrap=(value,period)=>value-period*Math.floor(value/period+.5);
  const repeat=(value,period)=>value-period*Math.floor(value/period);
  const facetDirections=[-.74,1.48,.19,-2.21,2.52,-.93,1.12,-2.75,-1.63,.65,2.93,-.42];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const i=y*columns+x;
    const u=(x+.5)/columns-.5, v=((y+.5)/rows-.5)*repeatY;
    const r=Math.hypot(u,v);
    xLocal[i]=u;
    yLocal[i]=v;
    radius[i]=r;
    disk[i]=1-smooth(.398,.445,r);
    rim[i]=1-smooth(.003,.017,Math.abs(r-.424));

    // The adjacent square is cut by a diagonal and split into reflective faces.
    const sx=wrap(u-.429,1), sy=wrap(v+.371,repeatY);
    const a=.934*sx-.358*sy, b=.358*sx+.934*sy;
    const outer=Math.min(.231-Math.abs(a),.193-Math.abs(b),.71*(a+b+.153));
    const interior=smooth(-.010,.005,outer);
    const join=1-.64*disk[i];
    square[i]=interior*join;
    const seams=Math.min(Math.abs(a),Math.abs(b),Math.abs(a-b)*.707);
    squareCrease[i]=join*Math.max(
      1-smooth(.003,.013,Math.abs(outer)),
      interior*(1-smooth(.002,.011,seams))
    );
    const face=Math.atan2(b,a);
    const faceAngle=(Math.floor((face+Math.PI/8)/(Math.PI/4))+.18)*Math.PI/4-.366;
    normalX[i]=Math.cos(faceAngle);
    normalY[i]=Math.sin(faceAngle);

    // Thin diagonal folds connect neighboring repeats outside the circular faces.
    const diagonal=Math.abs(wrap(v+repeatY*u+.178,repeatY));
    const returnFold=Math.abs(wrap(v-repeatY*u-.292,repeatY));
    const seamPhase=repeat(u+.14,.5)*2;
    const seamEnd=Math.min(seamPhase,1-seamPhase);
    const segment=smooth(.012,.093,seamEnd);
    fold[i]=(1-smooth(.007,.031,diagonal))*segment*(1-.59*disk[i]);
    reverseFold[i]=(1-smooth(.004,.023,returnFold))*(1-.81*disk[i])*(1-.54*interior);

    // A periodic set of adjoining, skewed facets fills the spaces between the motifs.
    const gridX=3*(u+.5+.074*Math.sin(2*Math.PI*(v/repeatY+.15)));
    const gridY=2*(v/repeatY+.5+.112*Math.sin(2*Math.PI*(u-.17)));
    const column=Math.floor(gridX), row=Math.floor(gridY);
    const tx=gridX-column, ty=gridY-row;
    const cx=repeat(column,3), cy=repeat(row,2);
    const diagonalSide=(cx+cy)%2===0?tx-ty:tx+ty-1;
    const direction=facetDirections[(cy*3+cx)*2+Number(diagonalSide>0)];
    const facetEdge=Math.min(tx,1-tx,ty,1-ty,Math.abs(diagonalSide)*.71);
    bridge[i]=(1-disk[i])*(1-.93*interior);
    bridgeCrease[i]=bridge[i]*(1-smooth(.006,.064,facetEdge));
    bridgeNormalX[i]=Math.cos(direction);
    bridgeNormalY[i]=Math.sin(direction);
  }
  // Foil registration is set once in card coordinates. The light only changes the response.
  const scale=1/(w*.175);
  const originX=.054*w, originY=.506*h;
  for(let y=0;y<h;y++){
    const vOffset=(y-originY)*scale;
    for(let x=0;x<w;x++){
      const xOffset=(x-originX)*scale;
      const u=.5+xOffset+.022*vOffset, v=.5+(vOffset-.013*xOffset)/repeatY;
      const ix=Math.floor(repeat(u,1)*columns), iy=Math.floor(repeat(v,1)*rows);
      pixels[y*w+x]=iy*columns+ix;
    }
  }
  return {pixels,xLocal,yLocal,radius,disk,rim,square,squareCrease,normalX,normalY,
    fold,reverseFold,bridge,bridgeCrease,bridgeNormalX,bridgeNormalY};
}
const spectrum=Array.from({length:256},(_,i)=>[
  .53+.47*Math.cos(i*Math.PI/128),
  .53+.47*Math.cos(i*Math.PI/128-2.094),
  .53+.47*Math.cos(i*Math.PI/128+2.094)
]);
const bandSpectrum=spectrum.map(color=>{
  const peak=Math.max(...color);
  return color.map(channel=>channel/peak);
});
function rainbowReflection(orientation,lamp) {
  const rx=orientation.rotateX*Math.PI/180, ry=orientation.rotateY*Math.PI/180;
  const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
  // Transform the fixed lamp and viewer into the local coordinates of the card.
  const local=(x,y,z)=>{
    const zAfterX=z*cx-y*sx;
    return [x*cy-zAfterX*sy,y*cx+z*sx,x*sy+zAfterX*cy];
  };
  const view=local(0,0,1.22);
  const open=smooth(.025,.235,Math.abs(ry)+.43*Math.abs(rx));
  const lateral=.13+.44*(lamp-.64);
  const orders=[
    [lateral,-.026,.0058+.013*open,1.03,0],
    [lateral-.29,-.154,.005+.010*open,.035+.65*smooth(.037,.205,Math.abs(ry+.40*rx)),.17],
    [lateral+.24,.125,.0075+.016*open,.025+.62*smooth(.052,.202,Math.abs(rx-.49*ry)),-.15]
  ];
  return orders.map(([x,y,aperture,weight,phaseOffset])=>{
    const ray=local(x,y,1);
    const height=.5+view[1]+view[2]*ray[1]/ray[2];
    const mismatch=ray[0]/ray[2]+view[0]/view[2];
    return {
      center:height,
      width:aperture*view[2]/ray[2],
      slope:.016*ray[0]/ray[2]+.049*sy,
      gain:weight/(1+1.65*mismatch*mismatch),
      phase:.74+5.7*Math.atan2(ray[1],ray[2])-1.32*Math.atan2(ray[0],ray[2])+phaseOffset
    };
  });
}
const prismColors=[
  [.61,.16,1],[.17,.48,1],[.02,.94,1],[.78,1,.86],
  [1,.97,.06],[1,.64,.015],[1,.29,.045]
];
const prismSpectrum=Array.from({length:256},(_,i)=>{
  const location=i*(prismColors.length-1)/255;
  const index=Math.min(Math.floor(location),prismColors.length-2);
  const mix=location-index;
  return prismColors[index].map((value,channel)=>value+(prismColors[index+1][channel]-value)*mix);
});

export function paintFoil(scene, pose, mix=.78, lamp=.64) {
  const {w,h,input,output,field,all,protection,noise,motif,reverse,stars,prism,effect:selected}=scene;
  const source=input.data,dest=output.data;
  const starEffect=selected==='estrelas', prismEffect=selected==='prisma', bands=selected==='faixas';
  const scatteredFlames=selected==='chamas';
  dest.set(source);
  if(mix===0)return output;
  const turn=pose.rotateY/maxTilt.y;
  const pitch=pose.rotateX/maxTilt.x;
  // Reflect a fixed light through the changing card angle.
  const lightCenter=clamp(.50+(lamp-.5)*.84-.29*turn+.07*pitch,.12,.88);
  const glintY=.72+.20*pitch-.06*turn;
  const slant=.32+.12*turn-.16*pitch;
  const foilAngle=clamp(.58-.31*turn+.17*pitch+(lamp-.64)*.36,.11,.89);
  const prismAngle=-.27+1.25*turn-1.03*pitch+1.68*(lamp-.64);
  const prismRayX=Math.cos(prismAngle), prismRayY=Math.sin(prismAngle);
  const faceRayX=Math.cos(prismAngle+.49), faceRayY=Math.sin(prismAngle+.49);
  const foldLight=smooth(.18,.92,Math.abs(prismRayX*.65+prismRayY*.76));
  const reverseLight=smooth(.16,.94,Math.abs(prismRayX*.68-prismRayY*.73));
  const lampTurn=.30+(lamp-.64)*.84;
  const prismAlignment=1/(1+3.05*(turn-lampTurn)**2+2.7*(pitch+.18)**2);
  const prismHueShift=-.27*turn+.29*pitch+.41*(lamp-.64);
  const rainbow=bands?rainbowReflection(pose,lamp):null;
  const shineStrength=prismEffect?.38+.20*prismAlignment:starEffect?.58:1;
  for(let y=0;y<h;y++){
    const ny=y/h, drift=(ny-glintY)*slant;
    const vertical=1/(1+6*(ny-glintY)**2);
    const foilStrength=mix*(1-.23*smooth(.83,.90,ny));
    const flamesInRow=scatteredFlames&&ny*920>=attackPanel.top&&ny*920<attackPanel.bottom;
    const visibleBands=bands?rainbow.filter(ray=>Math.abs(ny-ray.center)<2.45*ray.width+.5*Math.abs(ray.slope)):null;
    for(let x=0;x<w;x++){
      const j=y*w+x,i=j*4;
      const mask=field[i+3]/255, acrossArt=all[i+3]/255;
      const foilSurface=starEffect||prismEffect||bands?source[i+3]/255:0;
      if(!mask&&!foilSurface)continue;
      const nx=x/w,d=nx-lightCenter-drift;
      const broad=1/(1+42*d*d)*vertical;
      const peak=1/(1+200*d*d)*vertical*shineStrength;
      const exposed=motif?motif[j]/255:0;
      const grain=noise[j];
      const response=foilStrength*mask*protection[j];
      let shade=.43+.21*broad+.08*peak+exposed*(.24+.04*broad);
      let copper=.09*broad+.15*peak+exposed*(.09+.12*broad);
      let f=0,hr=1,hg=.75,hb=.45;
      if(flamesInRow){
        shade=.43+.13*broad+.09*peak+exposed*(.15+.13*broad);
        copper=.07+.12*peak+exposed*(.08+.13*broad);
        f=mask*exposed*(.04+.24*peak);
        hg=.64;hb=.28;
      }
      if(reverse){
        const relief=reverse[j]/255;
        const gleam=.30+.58*broad+.12*peak;
        shade+=(relief-.50)*(.33+.14*gleam);
        copper+=(relief-.42)*.078*gleam;
        f=mask*relief*gleam*.23;
        hr=1;hg=.88;hb=.63;
      }
      if(starEffect&&stars[i+3]){
        const phase=stars[i]/255;
        const color=stars[i+1]/255;
        const contrast=stars[i+2]/255;
        const opacity=stars[i+3]/255;
        const twinkle=1-smooth(.038,.19,Math.abs(phase-foilAngle));
        const coverage=(.72+.28*mask)*foilSurface;
        shade-=.105*opacity*(1-twinkle);
        f=opacity*(.36+twinkle*.72)*(.7+.30*contrast)*coverage;
        const tint=spectrum[Math.floor((color*.92+foilAngle*.17+ny*.14)*255)&255];
        const colorMix=color<.44?.23:.42+.49*twinkle;
        hr=.95+(tint[0]-.95)*colorMix;
        hg=.72+(tint[1]-.72)*colorMix;
        hb=.37+(tint[2]-.37)*colorMix;
      }
      if(prismEffect&&foilSurface){
        const k=prism.pixels[j];
        const localX=prism.xLocal[k], localY=prism.yLocal[k];
        const across=localX*prismRayX+localY*prismRayY;
        const along=localY*prismRayX-localX*prismRayY;
        const radius=prism.radius[k];
        const distanceToCross=Math.min(Math.abs(across),Math.abs(along));
        const width=.008+.031*(1-smooth(.09,.435,radius));
        const cross=prism.disk[k]*(1-smooth(width*.24,width,distanceToCross));
        const core=prism.disk[k]*(1-smooth(.001,width*.34,distanceToCross));
        const wedge=prism.disk[k]*(1-smooth(.018,.136,distanceToCross));
        const facetSlope=across*along/(radius*radius+.002);
        const rimLight=prism.rim[k]*(.012+.066*smooth(.87,1,Math.abs(across)/Math.max(radius,.001)));
        const faceDot=prism.normalX[k]*faceRayX+prism.normalY[k]*faceRayY;
        const face=smooth(-.14,.97,faceDot);
        const plane=prism.square[k];
        const crease=prism.squareCrease[k];
        const connection=prism.fold[k];
        const backConnection=prism.reverseFold[k];
        const bridgeDot=prism.bridgeNormalX[k]*faceRayX+prism.bridgeNormalY[k]*faceRayY;
        const bridgeLight=smooth(-.36,.98,bridgeDot);
        const bridge=prism.bridge[k], edge=prism.bridgeCrease[k];

        // The relief lives in the copper field. Its diffracted streaks cross the artwork too.
        const catchLight=prismAlignment*(.56+.44*broad);
        const flash=smooth(.15,.78,catchLight);
        shade+=(.72+.28*prismAlignment)*(wedge*.073+prism.disk[k]*facetSlope*.27+
          (face-.48)*plane*.24-crease*(1-face)*.048-connection*.044+
          bridge*(bridgeLight-.47)*.18-edge*(1-bridgeLight)*.058);
        const bodySheen=mask*(.04+.18*catchLight)*(wedge*.49+rimLight+plane*face*.52+
          crease*.29+bridge*bridgeLight*.45+edge*.37);
        const direction=Math.abs(along)<Math.abs(across)?1:.66+.34*reverseLight;
        const lineLight=cross*(.65+.40*direction)+connection*(.17+.87*foldLight)+
          backConnection*(.10+.63*reverseLight)+crease*face*.29+edge*bridgeLight*.26;
        const acrossIllustration=.64+.26*flash;
        const coverage=mask+(1-mask)*(.38+(acrossIllustration-.38)*acrossArt);
        const colorLight=(.04+1.28*flash)*lineLight*coverage*foilSurface;
        f=clamp(bodySheen+colorLight);
        const hue=clamp(.64*nx+.48*ny-.11+prismHueShift);
        const tint=prismSpectrum[Math.floor(255*hue)];
        const spectrumMix=clamp(colorLight/(f+.002));
        const hotCore=core*flash*.22;
        hr=.98+(tint[0]-.98)*spectrumMix*(1-hotCore);
        hg=.81+(tint[1]-.81)*spectrumMix*(1-hotCore);
        hb=.48+(tint[2]-.48)*spectrumMix*(1-hotCore);
      }
      if(bands){
        const offset=ny-rainbow[0].center-(nx-.5)*rainbow[0].slope;
        const metalSweep=1/(1+17*(offset-.031)**2+4.8*(nx-.50+.24*turn)**2);
        shade=.40+.49*metalSweep;
        copper=.023+.185*metalSweep*rainbow[0].gain;
        let total=0,red=0,green=0,blue=0;
        for(const ray of visibleBands){
          const position=(ny-ray.center-(nx-.5)*ray.slope)/ray.width;
          const distance=Math.abs(position);
          const core=1-smooth(.22,1.04+.17*grain,distance);
          const fringe=1-smooth(.65,2.40,distance);
          const amount=ray.gain*(.97*core+.19*fringe);
          if(amount<=.001)continue;
          const phase=ray.phase+.13*(nx-.5)+.119*clamp(position,-1.35,1.35);
          const tint=bandSpectrum[Math.floor((phase-Math.floor(phase))*255)];
          total+=amount;
          red+=amount*tint[0];green+=amount*tint[1];blue+=amount*tint[2];
        }
        f=foilSurface*clamp(total);
        if(total){hr=red/total;hg=green/total;hb=blue/total;}
      }
      copper+=grain*.048;
      const sourceR=source[i],sourceG=source[i+1],sourceB=source[i+2];
      const foilR=sourceR*shade+255*copper;
      const foilG=sourceG*(shade*.96)+170*copper;
      const foilB=sourceB*(shade*.78)+81*copper;
      const r=sourceR+(foilR-sourceR)*response;
      const g=sourceG+(foilG-sourceG)*response;
      const b=sourceB+(foilB-sourceB)*response;
      if(f<=0){
        dest[i]=r;
        dest[i+1]=g;
        dest[i+2]=b;
        continue;
      }
      // Preserve the legibility of the printed ink in the reflected light.
      const ink=smooth(30,120,.2126*sourceR+.7152*sourceG+.0722*sourceB);
      const foilInk=ink+(prismEffect?.37:starEffect?.26:bands?.28:0)*Math.max(0,acrossArt-mask)*(1-ink);
      const sparkle=mix*f*foilInk;
      if(bands){
        // The strong band replaces some reflected color instead of just whitening it.
        dest[i]=r+(255*hr-r)*sparkle;
        dest[i+1]=g+(255*hg-g)*sparkle;
        dest[i+2]=b+(255*hb-b)*sparkle;
      }else{
        dest[i]=r+(255-r)*sparkle*hr;
        dest[i+1]=g+(255-g)*sparkle*hg;
        dest[i+2]=b+(255-b)*sparkle*hb;
      }
    }
  }
  return output;
}

function fieldMask(w,h,layout,stage,surface) {
  const ctx=surface(w,h);
  ctx.scale(w/660,h/920);
  ctx.fillStyle='#fff';
  const path=d=>new ctx.Path2D(d);
  const yellow=layout==='yellow';
  ctx.fill(path(yellow?'M 34 26 H 626 Q 631 26 632 35 V 884 Q 632 893 623 896 H 35 Q 29 896 29 883 V 34 Q 29 26 34 26 Z':
    'M 36 26 H 626 Q 636 26 636 39 V 886 Q 636 895 626 895 H 37 Q 28 895 28 886 V 37 Q 28 26 36 26 Z'));
  ctx.globalCompositeOperation='destination-out';
  ctx.fill(path('M 48 86 H 614 V 436 H 628 C 621 450 612 454 603 464 H 44 Q 30 464 34 452 Q 38 440 48 435 Z'));
  ctx.fill(path(stage?(yellow?
    'M 14 24 H 132 L 122 52 H 99 V 138 Q 97 156 77 158 H 41 Q 21 158 21 140 V 69 H 14 Z':
    'M 24 24 H 131 L 125 33 L 108 51 L 99 65 C 121 79 126 105 116 132 C 106 155 90 169 67 173 C 36 177 13 161 10 136 C 7 108 20 82 40 66 L 40 58 H 22 Q 12 55 16 43 Z'):
    'M 14 24 H 130 L 119 47 Q 108 61 96 61 H 20 Q 11 55 14 24 Z'));
  ctx.fill(path('M 486 25 H 497 C 494 47 478 56 461 68 C 452 75 446 81 445 89 H 433 C 435 77 443 68 455 60 C 475 46 483 38 486 25 Z'));
  ctx.fill(path(yellow?'M 12 788 H 630 V 819 H 12 Z':
    'M 34 784 H 387 L 376 792 H 34 Z M 396 784 H 629 L 623 792 H 394 L 373 810 L 364 824 H 35 V 817 H 359 L 370 805 Z M 376 816 H 630 L 624 825 H 369 Z'));
  ctx.beginPath();
  ctx.arc(604,55,25,0,Math.PI*2);
  ctx.fill();
  ctx.fillRect(36,858,78,31);
  return ctx.getImageData(0,0,w,h).data;
}

function columnsMap(w,h,surface) {
  const ctx=surface(w,h);
  ctx.scale(w/660,h/920);
  ctx.fillStyle='#a7a7a7';
  ctx.fillRect(0,0,660,920);
  ctx.strokeStyle='#3d3d3d';
  ctx.fillStyle='#444';
  ctx.lineWidth=3;
  const flame=new ctx.Path2D('M 0 -21 C 11 -16 14 -8 11 -2 C 18 -3 19 -8 20 -10 C 25 -1 18 9 13 11 C 20 11 24 6 25 3 C 22 18 12 24 1 24 C -14 24 -22 14 -23 5 C -18 8 -16 8 -13 8 C -21 -3 -14 -12 -10 -14 C -12 -6 -8 -3 -6 -3 C -8 -11 4 -16 0 -21 Z M 0 4 C -1 9 7 11 5 15 C 8 12 10 11 13 11 C 9 15 12 19 7 20 C 2 22 -8 20 -9 17 C -11 14 -5 13 -8 11 C -4 10 -2 13 -2 13 C 2 10 -2 7 0 4 Z');
  for(let col=0;col<9;col++){
    const x=18+col*79;
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,920);
    for(let y=(col%2)*54-51;y<940;y+=108){
      ctx.moveTo(x,y);
      ctx.lineTo(x+39.5,y-29);
      ctx.lineTo(x+79,y);
      ctx.save();
      ctx.translate(x+39.5,y+32);
      ctx.scale(.80,.80);
      ctx.fill(flame,'evenodd');
      ctx.restore();
    }
    ctx.stroke();
  }
  const rgba=ctx.getImageData(0,0,w,h).data;
  return Uint8Array.from({length:w*h},(_,j)=>rgba[j*4]);
}

function mosaicMap(source,w,h,surface) {
  const ctx=surface(w,h);
  ctx.drawImage(source,0,0,w,h);
  const rgba=ctx.getImageData(0,0,w,h).data;
  return Uint8Array.from({length:w*h},(_,j)=>{
    const y=Math.floor(j/w)*920/h;
    const level=rgba[j*4];
    return level<62||(y>=attackPanel.bottom&&y<footerTop) ? 127 : 255*(1-smooth(72,174,level));
  });
}

function copyPrintDetails(ctx,print,layout,effect) {
  // Retain only the printed set identifiers or logo from the foil scan.
  const patches=layout==='gem' ? [[.047,.937,.271,.037]] : [[.797,.421,.153,.131]];
  if(layout==='gem'&&effect==='faixas')patches.push([.659,.318,.311,.152]);
  const {width:w,height:h}=ctx.canvas;
  const sw=print.naturalWidth??print.width, sh=print.naturalHeight??print.height;
  for(const [x,y,width,height] of patches){
    ctx.drawImage(print,x*sw,y*sh,width*sw,height*sh,x*w,y*h,width*w,height*h);
  }
}

export function prepareFoil(base,config,stencil,print,w,createCanvas,Path2DClass) {
  const h=Math.round(w*(base.naturalHeight??base.height)/(base.naturalWidth??base.width));
  const surface=(width,height)=>{
    const canvas=createCanvas(width,height);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.Path2D=Path2DClass;
    return ctx;
  };
  const ctx=surface(w,h);
  ctx.drawImage(base,0,0,w,h);
  const {effect,layout,stage}=config;
  if(print)copyPrintDetails(ctx,print,layout,effect);
  const input=ctx.getImageData(0,0,w,h);
  const field=fieldMask(w,h,layout,stage,surface), all=field;
  const protection=new Float32Array(w*h), noise=new Float32Array(w*h);
  const random=seededRandom(2019);
  for(let j=0;j<protection.length;j++){
    const i=j*4;
    const r=input.data[i],g=input.data[i+1],b=input.data[i+2];
    const luma=.2126*r+.7152*g+.0722*b;
    protection[j]=smooth(39,124,luma)*smooth(6,48,r-b);
    noise[j]=random()-.5;
  }
  const motif=stencil&&effect!=='mosaico' ? motifMap(stencil,effect,w,h,surface) :
    ['friend','fogo-central','chamas'].includes(effect) ? newMotifMap(effect,w,h,surface) : null;
  const reverse=effect==='colunas' ? columnsMap(w,h,surface) : effect==='mosaico' ? mosaicMap(stencil,w,h,surface) : null;
  return {w,h,input,field,all,protection,noise,motif,reverse,effect,
    output:ctx.createImageData(w,h),stars:effect==='estrelas'?starMap(w,h,surface):null,
    prism:effect==='prisma'?prismGeometry(w,h):null};
}

export const stencilFor = effect => ['fogo','pokebola','master','mosaico'].includes(effect) ? effect+'.png' : null;
