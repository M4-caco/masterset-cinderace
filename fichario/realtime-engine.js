import{a as h,b as R}from"./chunks/chunk-ESUZZES5.js";import{A as W,G as K,H as L,I as Y,La as te,Q as J,S as m,W as Z,Xa as ie,_ as P,bb as ae,e as G,ha as $,i as B,m as O,n as I,o as H,p as Q,pa as b,q as k,qa as U,r as X,s as V,u as j,va as ee,y as q}from"./chunks/chunk-OTERQLNG.js";var se={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var v=class extends h{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof U?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=b.clone(e.uniforms),this.material=new U({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new R(this.material)}render(e,t,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var D=class extends h{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,a){let s=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let o,f;this.inverse?(o=0,f=1):(o=1,f=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),i.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),i.buffers.stencil.setClear(f),i.buffers.stencil.setLocked(!0),e.setRenderTarget(a),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(s.EQUAL,1,4294967295),i.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),i.buffers.stencil.setLocked(!0)}},A=class extends h{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var y=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let a=e.getSize(new m);this._width=a.width,this._height=a.height,t=new P(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:L}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new v(se),this.copyPass.material.blending=B,this.clock=new ie}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),a=!1;for(let s=0,i=this.passes.length;s<i;s++){let o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,a),o.needsSwap){if(a){let f=this.renderer.getContext(),r=this.renderer.state.buffers.stencil;r.setFunc(f.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),r.setFunc(f.EQUAL,1,4294967295)}this.swapBuffers()}D!==void 0&&(o instanceof D?a=!0:o instanceof A&&(a=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new m);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let a=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(a,s),this.renderTarget2.setSize(a,s);for(let i=0;i<this.passes.length;i++)this.passes[i].setSize(a,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var z=class extends h{constructor(e,t,a=null,s=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=a,this.clearColor=s,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new $}render(e,t,a){let s=e.autoClear;e.autoClear=!1;let i,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=s}};var T={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var F=class extends h{constructor(){super(),this.uniforms=b.clone(T.uniforms),this.material=new te({name:T.name,uniforms:this.uniforms,vertexShader:T.vertexShader,fragmentShader:T.fragmentShader}),this._fsQuad=new R(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},Z.getTransfer(this._outputColorSpace)===J&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===O?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===I?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===H?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Q?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===X?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===V?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===k&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var ne={name:"FXAAShader",uniforms:{tDiffuse:{value:null},resolution:{value:new m(1/1024,1/512)},detailStrength:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		uniform float detailStrength;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 RestoreDetail( vec4 color, LuminanceData l, float blend ) {

			// Reuse the FXAA neighborhood to recover texture detail at reduced resolution.
			float average = 0.25 * ( l.n + l.s + l.e + l.w );
			float limit = min( 0.045, 0.25 * l.contrast );
			float edgeProtection = 1.0 - smoothstep( 0.20, 0.55, l.contrast );
			float correction = clamp( l.m - average, -limit, limit );
			color.rgb = clamp( color.rgb + correction * detailStrength * edgeProtection * ( 1.0 - blend ), 0.0, 1.0 );
			return color;

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return RestoreDetail( Sample( tex2D, uv ), luminance, 0.0 );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return RestoreDetail( Sample( tex2D, uv ), luminance, finalBlend );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`};function createStudioEnvironment(width = 512, height = 256) {
  const data = new Float32Array(width * height * 4);
  // Linear HDR output of the studio softboxes, prefiltered once by Three.js.
  const softboxes = [
    { azimuth: -.85, elevation: .68, spreadX: .42, spreadY: .38, power: 8, tint: [1, .95, .88] },
    { azimuth: .92, elevation: .40, spreadX: .55, spreadY: .50, power: 2.6, tint: [.83, .90, 1] },
    { azimuth: 2.5, elevation: .35, spreadX: .18, spreadY: .65, power: 7, tint: [.88, .94, 1] },
    { azimuth: -2.7, elevation: .15, spreadX: .40, spreadY: .65, power: 2, tint: [1, .94, .86] }
  ];
  for (let y = 0; y < height; y++) {
    const elevation = (.5 - y / height) * Math.PI;
    const sky = Math.max(0, Math.sin(elevation));
    for (let x = 0; x < width; x++) {
      const azimuth = (x / width - .5) * Math.PI * 2;
      const offset = (y * width + x) * 4;
      data[offset] = .035 + sky * .045;
      data[offset + 1] = .035 + sky * .050;
      data[offset + 2] = .038 + sky * .063;
      data[offset + 3] = 1;
      for (const box of softboxes) {
        const angle = azimuth - box.azimuth;
        const dx = Math.atan2(Math.sin(angle), Math.cos(angle)) / box.spreadX;
        const dy = (elevation - box.elevation) / box.spreadY;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const edge = Math.min(1, Math.max(0, (1.12 - distance) / .40));
        const falloff = edge * edge * (3 - 2 * edge);
        for (let channel = 0; channel < 3; channel++) {
          data[offset + channel] += falloff * box.power * box.tint[channel];
        }
      }
    }
  }
  return {data, width, height};
}
function fe(n){let e=n.getContext(),t=e.getExtension("EXT_disjoint_timer_query_webgl2"),a=[],s=null,i=null;return{begin(){!t||a.length>=4||(s=e.createQuery(),e.beginQuery(t.TIME_ELAPSED_EXT,s))},end(){s&&(e.endQuery(t.TIME_ELAPSED_EXT),a.push(s),s=null)},poll(){if(!t)return null;let o=e.getParameter(t.GPU_DISJOINT_EXT);for(;a.length&&e.getQueryParameter(a[0],e.QUERY_RESULT_AVAILABLE);){let f=a.shift(),r=e.getQueryParameter(f,e.QUERY_RESULT);e.deleteQuery(f),o||(i=r/1e6)}return o&&(i=null),i},dispose(){for(let o of a)e.deleteQuery(o)}}}function Oe(n,e,t){let a={environment:e.environment,intensity:e.environmentIntensity,rotation:e.environmentRotation.clone(),shadowType:n.shadowMap.type,shadowAuto:n.shadowMap.autoUpdate},s=createStudioEnvironment(),i=new ee(s.data,s.width,s.height,Y,K);i.mapping=j,i.minFilter=i.magFilter=q,i.needsUpdate=!0;let o=new ae(n),f=o.fromEquirectangular(i);o.dispose(),i.dispose(),e.environment=f.texture,e.environmentIntensity=.42;let r=new m;n.getDrawingBufferSize(r);let c=new P(r.x,r.y,{type:n.extensions.has("EXT_color_buffer_float")?L:W,depthBuffer:!0}),p=new y(n,c),w=new z(e,t),C=new F,x=new v(ne);p.setPixelRatio(1),p.addPass(w),p.addPass(C),p.addPass(x),n.shadowMap.type=G,n.shadowMap.autoUpdate=!1,n.shadowMap.needsUpdate=!0;let _=[];e.traverse(l=>{l.isLight&&l.castShadow&&_.push({light:l,size:l.shadow.mapSize.x})});let M=2048,E=!1,g=0,S=0,d=fe(n);function N(l){if(l!==M){M=l;for(let{light:u}of _)u.shadow.mapSize.set(l,l),u.shadow.map?.dispose(),u.shadow.map=null,u.shadow.mapPass?.dispose(),u.shadow.mapPass=null;n.shadowMap.needsUpdate=!0}}return{render({dirty:l=!1,moving:u=!1,floating:le=!1,scale:re=1}={}){if(!E){n.getDrawingBufferSize(r),(r.x!==g||r.y!==S)&&(g=r.x,S=r.y,p.setSize(g,S),x.uniforms.resolution.value.set(1/g,1/S)),x.uniforms.detailStrength.value=Math.max(0,Math.min(.65,(1-re)*1.8)),N(re<.78?1024:2048),(l||u)&&(n.shadowMap.needsUpdate=!0),le?e.environmentRotation.setFromQuaternion(t.quaternion):e.environmentRotation.copy(a.rotation),d.begin();try{p.render()}finally{d.end()}}},get gpuMs(){return d.poll()},dispose(){if(!E){E=!0,d.dispose(),p.dispose(),w.dispose(),C.dispose(),x.dispose(),f.dispose(),e.environment=a.environment,e.environmentIntensity=a.intensity,e.environmentRotation.copy(a.rotation),n.shadowMap.type=a.shadowType,n.shadowMap.autoUpdate=a.shadowAuto;for(let{light:l,size:u}of _)l.shadow.mapSize.x!==u&&(l.shadow.mapSize.set(u,u),l.shadow.map?.dispose(),l.shadow.map=null);n.shadowMap.needsUpdate=!0}}}}export{Oe as createRealtimeEngine};
