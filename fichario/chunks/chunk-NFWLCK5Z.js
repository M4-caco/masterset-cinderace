import{A as de,B as me,C as Xe,D as Ye,E as Ot,F as at,G as lt,I as dt,J as je,K as Ke,L as We,M as Ht,N as kt,S as et,U as E,_a as K,a as kn,ba as G,ca as Ze,ea as j,f as pe,g as qe,ga as nt,h as Ge,ka as mt,va as Dt,x as tt,xa as qt}from"./chunk-OTERQLNG.js";var $e=Math.pow(2,-24),Gt=Symbol("SKIP_GENERATION");function xe(n){return n.index?n.index.count:n.attributes.position.count}function $(n){return xe(n)/3}function ye(n,t=ArrayBuffer){return n>65535?new Uint32Array(new t(4*n)):new Uint16Array(new t(2*n))}function Je(n,t){if(!n.index){let e=n.attributes.position.count,i=t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,o=ye(e,i);n.setIndex(new mt(o,1));for(let c=0;c<e;c++)o[c]=c}}function he(n,t){let e=$(n),i=t||n.drawRange,o=i.start/3,c=(i.start+i.count)/3,s=Math.max(0,o),a=Math.min(e,c)-s;return[{offset:Math.floor(s),count:Math.floor(a)}]}function Ae(n,t){if(!n.groups||!n.groups.length)return he(n,t);let e=[],i=new Set,o=t||n.drawRange,c=o.start/3,s=(o.start+o.count)/3;for(let r of n.groups){let p=r.start/3,f=(r.start+r.count)/3;i.add(Math.max(c,p)),i.add(Math.min(s,f))}let a=Array.from(i.values()).sort((r,p)=>r-p);for(let r=0;r<a.length-1;r++){let p=a[r],f=a[r+1];e.push({offset:Math.floor(p),count:Math.floor(f-p)})}return e}function Qe(n,t){let e=$(n),i=Ae(n,t).sort((s,a)=>s.offset-a.offset),o=i[i.length-1];o.count=Math.min(e-o.offset,o.count);let c=0;return i.forEach(({count:s})=>c+=s),e!==c}function Xt(n,t,e,i,o){let c=1/0,s=1/0,a=1/0,r=-1/0,p=-1/0,f=-1/0,u=1/0,l=1/0,d=1/0,b=-1/0,T=-1/0,y=-1/0;for(let m=t*6,x=(t+e)*6;m<x;m+=6){let h=n[m+0],v=n[m+1],A=h-v,w=h+v;A<c&&(c=A),w>r&&(r=w),h<u&&(u=h),h>b&&(b=h);let g=n[m+2],_=n[m+3],B=g-_,P=g+_;B<s&&(s=B),P>p&&(p=P),g<l&&(l=g),g>T&&(T=g);let I=n[m+4],S=n[m+5],D=I-S,F=I+S;D<a&&(a=D),F>f&&(f=F),I<d&&(d=I),I>y&&(y=I)}i[0]=c,i[1]=s,i[2]=a,i[3]=r,i[4]=p,i[5]=f,o[0]=u,o[1]=l,o[2]=d,o[3]=b,o[4]=T,o[5]=y}function tn(n,t=null,e=null,i=null){let o=n.attributes.position,c=n.index?n.index.array:null,s=$(n),a=o.normalized,r;t===null?(r=new Float32Array(s*6),e=0,i=s):(r=t,e=e||0,i=i||s);let p=o.array,f=o.offset||0,u=3;o.isInterleavedBufferAttribute&&(u=o.data.stride);let l=["getX","getY","getZ"];for(let d=e;d<e+i;d++){let b=d*3,T=d*6,y=b+0,m=b+1,x=b+2;c&&(y=c[y],m=c[m],x=c[x]),a||(y=y*u+f,m=m*u+f,x=x*u+f);for(let h=0;h<3;h++){let v,A,w;a?(v=o[l[h]](y),A=o[l[h]](m),w=o[l[h]](x)):(v=p[y+h],A=p[m+h],w=p[x+h]);let g=v;A<g&&(g=A),w<g&&(g=w);let _=v;A>_&&(_=A),w>_&&(_=w);let B=(_-g)/2,P=h*2;r[T+P+0]=g+B,r[T+P+1]=B+(Math.abs(g)+B)*$e}}return r}function C(n,t,e){return e.min.x=t[n],e.min.y=t[n+1],e.min.z=t[n+2],e.max.x=t[n+3],e.max.y=t[n+4],e.max.z=t[n+5],e}function be(n){let t=-1,e=-1/0;for(let i=0;i<3;i++){let o=n[i+3]-n[i];o>e&&(e=o,t=i)}return t}function Te(n,t){t.set(n)}function ve(n,t,e){let i,o;for(let c=0;c<3;c++){let s=c+3;i=n[c],o=t[c],e[c]=i<o?i:o,i=n[s],o=t[s],e[s]=i>o?i:o}}function Et(n,t,e){for(let i=0;i<3;i++){let o=t[n+2*i],c=t[n+2*i+1],s=o-c,a=o+c;s<e[i]&&(e[i]=s),a>e[i+3]&&(e[i+3]=a)}}function xt(n){let t=n[3]-n[0],e=n[4]-n[1],i=n[5]-n[2];return 2*(t*e+e*i+i*t)}var J=32,Gn=(n,t)=>n.candidate-t.candidate,it=new Array(J).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),Yt=new Float32Array(6);function on(n,t,e,i,o,c){let s=-1,a=0;if(c===0)s=be(t),s!==-1&&(a=(t[s]+t[s+3])/2);else if(c===1)s=be(n),s!==-1&&(a=Xn(e,i,o,s));else if(c===2){let r=xt(n),p=1.25*o,f=i*6,u=(i+o)*6;for(let l=0;l<3;l++){let d=t[l],y=(t[l+3]-d)/J;if(o<J/4){let m=[...it];m.length=o;let x=0;for(let v=f;v<u;v+=6,x++){let A=m[x];A.candidate=e[v+2*l],A.count=0;let{bounds:w,leftCacheBounds:g,rightCacheBounds:_}=A;for(let B=0;B<3;B++)_[B]=1/0,_[B+3]=-1/0,g[B]=1/0,g[B+3]=-1/0,w[B]=1/0,w[B+3]=-1/0;Et(v,e,w)}m.sort(Gn);let h=o;for(let v=0;v<h;v++){let A=m[v];for(;v+1<h&&m[v+1].candidate===A.candidate;)m.splice(v+1,1),h--}for(let v=f;v<u;v+=6){let A=e[v+2*l];for(let w=0;w<h;w++){let g=m[w];A>=g.candidate?Et(v,e,g.rightCacheBounds):(Et(v,e,g.leftCacheBounds),g.count++)}}for(let v=0;v<h;v++){let A=m[v],w=A.count,g=o-A.count,_=A.leftCacheBounds,B=A.rightCacheBounds,P=0;w!==0&&(P=xt(_)/r);let I=0;g!==0&&(I=xt(B)/r);let S=1+1.25*(P*w+I*g);S<p&&(s=l,p=S,a=A.candidate)}}else{for(let h=0;h<J;h++){let v=it[h];v.count=0,v.candidate=d+y+h*y;let A=v.bounds;for(let w=0;w<3;w++)A[w]=1/0,A[w+3]=-1/0}for(let h=f;h<u;h+=6){let w=~~((e[h+2*l]-d)/y);w>=J&&(w=J-1);let g=it[w];g.count++,Et(h,e,g.bounds)}let m=it[J-1];Te(m.bounds,m.rightCacheBounds);for(let h=J-2;h>=0;h--){let v=it[h],A=it[h+1];ve(v.bounds,A.rightCacheBounds,v.rightCacheBounds)}let x=0;for(let h=0;h<J-1;h++){let v=it[h],A=v.count,w=v.bounds,_=it[h+1].rightCacheBounds;A!==0&&(x===0?Te(w,Yt):ve(w,Yt,Yt)),x+=A;let B=0,P=0;x!==0&&(B=xt(Yt)/r);let I=o-x;I!==0&&(P=xt(_)/r);let S=1+1.25*(B*x+P*I);S<p&&(s=l,p=S,a=v.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${c} used.`);return{axis:s,pos:a}}function Xn(n,t,e,i){let o=0;for(let c=t,s=t+e;c<s;c++)o+=n[c*6+i*2];return o/e}var yt=class{constructor(){this.boundingData=new Float32Array(6)}};function sn(n,t,e,i,o,c){let s=i,a=i+o-1,r=c.pos,p=c.axis*2;for(;;){for(;s<=a&&e[s*6+p]<r;)s++;for(;s<=a&&e[a*6+p]>=r;)a--;if(s<a){for(let f=0;f<3;f++){let u=t[s*3+f];t[s*3+f]=t[a*3+f],t[a*3+f]=u}for(let f=0;f<6;f++){let u=e[s*6+f];e[s*6+f]=e[a*6+f],e[a*6+f]=u}s++,a--}else return s}}function rn(n,t,e,i,o,c){let s=i,a=i+o-1,r=c.pos,p=c.axis*2;for(;;){for(;s<=a&&e[s*6+p]<r;)s++;for(;s<=a&&e[a*6+p]>=r;)a--;if(s<a){let f=n[s];n[s]=n[a],n[a]=f;for(let u=0;u<6;u++){let l=e[s*6+u];e[s*6+u]=e[a*6+u],e[a*6+u]=l}s++,a--}else return s}}function R(n,t){return t[n+15]===65535}function U(n,t){return t[n+6]}function z(n,t){return t[n+14]}function k(n){return n+8}function H(n,t){return t[n+6]}function ht(n,t){return t[n+7]}var cn,Ft,jt,an,Yn=Math.pow(2,32);function Kt(n){return"count"in n?1:1+Kt(n.left)+Kt(n.right)}function ln(n,t,e){return cn=new Float32Array(e),Ft=new Uint32Array(e),jt=new Uint16Array(e),an=new Uint8Array(e),we(n,t)}function we(n,t){let e=n/4,i=n/2,o="count"in t,c=t.boundingData;for(let s=0;s<6;s++)cn[e+s]=c[s];if(o)if(t.buffer){let s=t.buffer;an.set(new Uint8Array(s),n);for(let a=n,r=n+s.byteLength;a<r;a+=32){let p=a/2;R(p,jt)||(Ft[a/4+6]+=e)}return n+s.byteLength}else{let s=t.offset,a=t.count;return Ft[e+6]=s,jt[i+14]=a,jt[i+15]=65535,n+32}else{let s=t.left,a=t.right,r=t.splitAxis,p;if(p=we(n+32,s),p/4>Yn)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return Ft[e+6]=p/4,p=we(p,a),Ft[e+7]=r,p}}function jn(n,t){let e=(n.index?n.index.count:n.attributes.position.count)/3,i=e>2**16,o=i?4:2,c=t?new SharedArrayBuffer(e*o):new ArrayBuffer(e*o),s=i?new Uint32Array(c):new Uint16Array(c);for(let a=0,r=s.length;a<r;a++)s[a]=a;return s}function Kn(n,t,e,i,o){let{maxDepth:c,verbose:s,maxLeafTris:a,strategy:r,onProgress:p,indirect:f}=o,u=n._indirectBuffer,l=n.geometry,d=l.index?l.index.array:null,b=f?rn:sn,T=$(l),y=new Float32Array(6),m=!1,x=new yt;return Xt(t,e,i,x.boundingData,y),v(x,e,i,y),x;function h(A){p&&p(A/T)}function v(A,w,g,_=null,B=0){if(!m&&B>=c&&(m=!0,s&&(console.warn(`MeshBVH: Max depth of ${c} reached when generating BVH. Consider increasing maxDepth.`),console.warn(l))),g<=a||B>=c)return h(w+g),A.offset=w,A.count=g,A;let P=on(A.boundingData,_,t,w,g,r);if(P.axis===-1)return h(w+g),A.offset=w,A.count=g,A;let I=b(u,d,t,w,g,P);if(I===w||I===w+g)h(w+g),A.offset=w,A.count=g;else{A.splitAxis=P.axis;let S=new yt,D=w,F=I-w;A.left=S,Xt(t,D,F,S.boundingData,y),v(S,D,F,y,B+1);let M=new yt,O=I,Q=g-F;A.right=M,Xt(t,O,Q,M.boundingData,y),v(M,O,Q,y,B+1)}return A}}function fn(n,t){let e=n.geometry;t.indirect&&(n._indirectBuffer=jn(e,t.useSharedArrayBuffer),Qe(e,t.range)&&!t.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),n._indirectBuffer||Je(e,t);let i=t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,o=tn(e),c=t.indirect?he(e,t.range):Ae(e,t.range);n._roots=c.map(s=>{let a=Kn(n,o,s.offset,s.count,t),r=Kt(a),p=new i(32*r);return ln(0,a,p),p})}var Y=class{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(t,e){let i=1/0,o=-1/0;for(let c=0,s=t.length;c<s;c++){let r=t[c][e];i=r<i?r:i,o=r>o?r:o}this.min=i,this.max=o}setFromPoints(t,e){let i=1/0,o=-1/0;for(let c=0,s=e.length;c<s;c++){let a=e[c],r=t.dot(a);i=r<i?r:i,o=r>o?r:o}this.min=i,this.max=o}isSeparated(t){return this.min>t.max||t.min>this.max}};Y.prototype.setFromBox=(function(){let n=new E;return function(e,i){let o=i.min,c=i.max,s=1/0,a=-1/0;for(let r=0;r<=1;r++)for(let p=0;p<=1;p++)for(let f=0;f<=1;f++){n.x=o.x*r+c.x*(1-r),n.y=o.y*p+c.y*(1-p),n.z=o.z*f+c.z*(1-f);let u=e.dot(n);s=Math.min(u,s),a=Math.max(u,a)}this.min=s,this.max=a}})();var qi=(function(){let n=new Y;return function(e,i){let o=e.points,c=e.satAxes,s=e.satBounds,a=i.points,r=i.satAxes,p=i.satBounds;for(let f=0;f<3;f++){let u=s[f],l=c[f];if(n.setFromPoints(l,a),u.isSeparated(n))return!1}for(let f=0;f<3;f++){let u=p[f],l=r[f];if(n.setFromPoints(l,o),u.isSeparated(n))return!1}}})();var Wn=(function(){let n=new E,t=new E,e=new E;return function(o,c,s){let a=o.start,r=n,p=c.start,f=t;e.subVectors(a,p),n.subVectors(o.end,o.start),t.subVectors(c.end,c.start);let u=e.dot(f),l=f.dot(r),d=f.dot(f),b=e.dot(r),y=r.dot(r)*d-l*l,m,x;y!==0?m=(u*l-b*d)/y:m=0,x=(u+m*l)/d,s.x=m,s.y=x}})(),Nt=(function(){let n=new et,t=new E,e=new E;return function(o,c,s,a){Wn(o,c,n);let r=n.x,p=n.y;if(r>=0&&r<=1&&p>=0&&p<=1){o.at(r,s),c.at(p,a);return}else if(r>=0&&r<=1){p<0?c.at(0,a):c.at(1,a),o.closestPointToPoint(a,!0,s);return}else if(p>=0&&p<=1){r<0?o.at(0,s):o.at(1,s),c.closestPointToPoint(s,!0,a);return}else{let f;r<0?f=o.start:f=o.end;let u;p<0?u=c.start:u=c.end;let l=t,d=e;if(o.closestPointToPoint(u,!0,t),c.closestPointToPoint(f,!0,e),l.distanceToSquared(u)<=d.distanceToSquared(f)){s.copy(l),a.copy(u);return}else{s.copy(f),a.copy(d);return}}}})(),un=(function(){let n=new E,t=new E,e=new qt,i=new K;return function(c,s){let{radius:a,center:r}=c,{a:p,b:f,c:u}=s;if(i.start=p,i.end=f,i.closestPointToPoint(r,!0,n).distanceTo(r)<=a||(i.start=p,i.end=u,i.closestPointToPoint(r,!0,n).distanceTo(r)<=a)||(i.start=f,i.end=u,i.closestPointToPoint(r,!0,n).distanceTo(r)<=a))return!0;let T=s.getPlane(e);if(Math.abs(T.distanceToPoint(r))<=a){let m=T.projectPoint(r,t);if(s.containsPoint(m))return!0}return!1}})();var Zn=1e-15;function ge(n){return Math.abs(n)<Zn}var q=class extends nt{constructor(...t){super(...t),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new E),this.satBounds=new Array(4).fill().map(()=>new Y),this.points=[this.a,this.b,this.c],this.sphere=new Ze,this.plane=new qt,this.needsUpdate=!0}intersectsSphere(t){return un(t,this)}update(){let t=this.a,e=this.b,i=this.c,o=this.points,c=this.satAxes,s=this.satBounds,a=c[0],r=s[0];this.getNormal(a),r.setFromPoints(a,o);let p=c[1],f=s[1];p.subVectors(t,e),f.setFromPoints(p,o);let u=c[2],l=s[2];u.subVectors(e,i),l.setFromPoints(u,o);let d=c[3],b=s[3];d.subVectors(i,t),b.setFromPoints(d,o),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(a,t),this.needsUpdate=!1}};q.prototype.closestPointToSegment=(function(){let n=new E,t=new E,e=new K;return function(o,c=null,s=null){let{start:a,end:r}=o,p=this.points,f,u=1/0;for(let l=0;l<3;l++){let d=(l+1)%3;e.start.copy(p[l]),e.end.copy(p[d]),Nt(e,o,n,t),f=n.distanceToSquared(t),f<u&&(u=f,c&&c.copy(n),s&&s.copy(t))}return this.closestPointToPoint(a,n),f=a.distanceToSquared(n),f<u&&(u=f,c&&c.copy(n),s&&s.copy(a)),this.closestPointToPoint(r,n),f=r.distanceToSquared(n),f<u&&(u=f,c&&c.copy(n),s&&s.copy(r)),Math.sqrt(u)}})();q.prototype.intersectsTriangle=(function(){let n=new q,t=new Array(3),e=new Array(3),i=new Y,o=new Y,c=new E,s=new E,a=new E,r=new E,p=new E,f=new K,u=new K,l=new K,d=new E;function b(T,y,m){let x=T.points,h=0,v=-1;for(let A=0;A<3;A++){let{start:w,end:g}=f;w.copy(x[A]),g.copy(x[(A+1)%3]),f.delta(s);let _=ge(y.distanceToPoint(w));if(ge(y.normal.dot(s))&&_){m.copy(f),h=2;break}let B=y.intersectLine(f,d);if(!B&&_&&d.copy(w),(B||_)&&!ge(d.distanceTo(g))){if(h<=1)(h===1?m.start:m.end).copy(d),_&&(v=h);else if(h>=2){(v===1?m.start:m.end).copy(d),h=2;break}if(h++,h===2&&v===-1)break}}return h}return function(y,m=null,x=!1){this.needsUpdate&&this.update(),y.isExtendedTriangle?y.needsUpdate&&y.update():(n.copy(y),n.update(),y=n);let h=this.plane,v=y.plane;if(Math.abs(h.normal.dot(v.normal))>1-1e-10){let A=this.satBounds,w=this.satAxes;e[0]=y.a,e[1]=y.b,e[2]=y.c;for(let B=0;B<4;B++){let P=A[B],I=w[B];if(i.setFromPoints(I,e),P.isSeparated(i))return!1}let g=y.satBounds,_=y.satAxes;t[0]=this.a,t[1]=this.b,t[2]=this.c;for(let B=0;B<4;B++){let P=g[B],I=_[B];if(i.setFromPoints(I,t),P.isSeparated(i))return!1}for(let B=0;B<4;B++){let P=w[B];for(let I=0;I<4;I++){let S=_[I];if(c.crossVectors(P,S),i.setFromPoints(c,t),o.setFromPoints(c,e),i.isSeparated(o))return!1}}return m&&(x||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),m.start.set(0,0,0),m.end.set(0,0,0)),!0}else{let A=b(this,v,u);if(A===1&&y.containsPoint(u.end))return m&&(m.start.copy(u.end),m.end.copy(u.end)),!0;if(A!==2)return!1;let w=b(y,h,l);if(w===1&&this.containsPoint(l.end))return m&&(m.start.copy(l.end),m.end.copy(l.end)),!0;if(w!==2)return!1;if(u.delta(a),l.delta(r),a.dot(r)<0){let D=l.start;l.start=l.end,l.end=D}let g=u.start.dot(a),_=u.end.dot(a),B=l.start.dot(a),P=l.end.dot(a),I=_<B,S=g<P;return g!==P&&B!==_&&I===S?!1:(m&&(p.subVectors(u.start,l.start),p.dot(a)>0?m.start.copy(u.start):m.start.copy(l.start),p.subVectors(u.end,l.end),p.dot(a)<0?m.end.copy(u.end):m.end.copy(l.end)),!0)}}})();q.prototype.distanceToPoint=(function(){let n=new E;return function(e){return this.closestPointToPoint(e,n),e.distanceTo(n)}})();q.prototype.distanceToTriangle=(function(){let n=new E,t=new E,e=["a","b","c"],i=new K,o=new K;return function(s,a=null,r=null){let p=a||r?i:null;if(this.intersectsTriangle(s,p))return(a||r)&&(a&&p.getCenter(a),r&&p.getCenter(r)),0;let f=1/0;for(let u=0;u<3;u++){let l,d=e[u],b=s[d];this.closestPointToPoint(b,n),l=b.distanceToSquared(n),l<f&&(f=l,a&&a.copy(n),r&&r.copy(b));let T=this[d];s.closestPointToPoint(T,n),l=T.distanceToSquared(n),l<f&&(f=l,a&&a.copy(T),r&&r.copy(n))}for(let u=0;u<3;u++){let l=e[u],d=e[(u+1)%3];i.set(this[l],this[d]);for(let b=0;b<3;b++){let T=e[b],y=e[(b+1)%3];o.set(s[T],s[y]),Nt(i,o,n,t);let m=n.distanceToSquared(t);m<f&&(f=m,a&&a.copy(n),r&&r.copy(t))}}return Math.sqrt(f)}})();var V=class{constructor(t,e,i){this.isOrientedBox=!0,this.min=new E,this.max=new E,this.matrix=new j,this.invMatrix=new j,this.points=new Array(8).fill().map(()=>new E),this.satAxes=new Array(3).fill().map(()=>new E),this.satBounds=new Array(3).fill().map(()=>new Y),this.alignedSatBounds=new Array(3).fill().map(()=>new Y),this.needsUpdate=!1,t&&this.min.copy(t),e&&this.max.copy(e),i&&this.matrix.copy(i)}set(t,e,i){this.min.copy(t),this.max.copy(e),this.matrix.copy(i),this.needsUpdate=!0}copy(t){this.min.copy(t.min),this.max.copy(t.max),this.matrix.copy(t.matrix),this.needsUpdate=!0}};V.prototype.update=(function(){return function(){let t=this.matrix,e=this.min,i=this.max,o=this.points;for(let p=0;p<=1;p++)for(let f=0;f<=1;f++)for(let u=0;u<=1;u++){let l=1*p|2*f|4*u,d=o[l];d.x=p?i.x:e.x,d.y=f?i.y:e.y,d.z=u?i.z:e.z,d.applyMatrix4(t)}let c=this.satBounds,s=this.satAxes,a=o[0];for(let p=0;p<3;p++){let f=s[p],u=c[p],l=1<<p,d=o[l];f.subVectors(a,d),u.setFromPoints(f,o)}let r=this.alignedSatBounds;r[0].setFromPointsField(o,"x"),r[1].setFromPointsField(o,"y"),r[2].setFromPointsField(o,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}})();V.prototype.intersectsBox=(function(){let n=new Y;return function(e){this.needsUpdate&&this.update();let i=e.min,o=e.max,c=this.satBounds,s=this.satAxes,a=this.alignedSatBounds;if(n.min=i.x,n.max=o.x,a[0].isSeparated(n)||(n.min=i.y,n.max=o.y,a[1].isSeparated(n))||(n.min=i.z,n.max=o.z,a[2].isSeparated(n)))return!1;for(let r=0;r<3;r++){let p=s[r],f=c[r];if(n.setFromBox(p,e),f.isSeparated(n))return!1}return!0}})();V.prototype.intersectsTriangle=(function(){let n=new q,t=new Array(3),e=new Y,i=new Y,o=new E;return function(s){this.needsUpdate&&this.update(),s.isExtendedTriangle?s.needsUpdate&&s.update():(n.copy(s),n.update(),s=n);let a=this.satBounds,r=this.satAxes;t[0]=s.a,t[1]=s.b,t[2]=s.c;for(let l=0;l<3;l++){let d=a[l],b=r[l];if(e.setFromPoints(b,t),d.isSeparated(e))return!1}let p=s.satBounds,f=s.satAxes,u=this.points;for(let l=0;l<3;l++){let d=p[l],b=f[l];if(e.setFromPoints(b,u),d.isSeparated(e))return!1}for(let l=0;l<3;l++){let d=r[l];for(let b=0;b<4;b++){let T=f[b];if(o.crossVectors(d,T),e.setFromPoints(o,t),i.setFromPoints(o,u),e.isSeparated(i))return!1}}return!0}})();V.prototype.closestPointToPoint=(function(){return function(t,e){return this.needsUpdate&&this.update(),e.copy(t).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),e}})();V.prototype.distanceToPoint=(function(){let n=new E;return function(e){return this.closestPointToPoint(e,n),e.distanceTo(n)}})();V.prototype.distanceToBox=(function(){let n=["x","y","z"],t=new Array(12).fill().map(()=>new K),e=new Array(12).fill().map(()=>new K),i=new E,o=new E;return function(s,a=0,r=null,p=null){if(this.needsUpdate&&this.update(),this.intersectsBox(s))return(r||p)&&(s.getCenter(o),this.closestPointToPoint(o,i),s.closestPointToPoint(i,o),r&&r.copy(i),p&&p.copy(o)),0;let f=a*a,u=s.min,l=s.max,d=this.points,b=1/0;for(let y=0;y<8;y++){let m=d[y];o.copy(m).clamp(u,l);let x=m.distanceToSquared(o);if(x<b&&(b=x,r&&r.copy(m),p&&p.copy(o),x<f))return Math.sqrt(x)}let T=0;for(let y=0;y<3;y++)for(let m=0;m<=1;m++)for(let x=0;x<=1;x++){let h=(y+1)%3,v=(y+2)%3,A=m<<h|x<<v,w=1<<y|m<<h|x<<v,g=d[A],_=d[w];t[T].set(g,_);let P=n[y],I=n[h],S=n[v],D=e[T],F=D.start,M=D.end;F[P]=u[P],F[I]=m?u[I]:l[I],F[S]=x?u[S]:l[I],M[P]=l[P],M[I]=m?u[I]:l[I],M[S]=x?u[S]:l[I],T++}for(let y=0;y<=1;y++)for(let m=0;m<=1;m++)for(let x=0;x<=1;x++){o.x=y?l.x:u.x,o.y=m?l.y:u.y,o.z=x?l.z:u.z,this.closestPointToPoint(o,i);let h=o.distanceToSquared(i);if(h<b&&(b=h,r&&r.copy(i),p&&p.copy(o),h<f))return Math.sqrt(h)}for(let y=0;y<12;y++){let m=t[y];for(let x=0;x<12;x++){let h=e[x];Nt(m,h,i,o);let v=i.distanceToSquared(o);if(v<b&&(b=v,r&&r.copy(i),p&&p.copy(o),v<f))return Math.sqrt(v)}}return Math.sqrt(b)}})();var st=class{constructor(t){this._getNewPrimitive=t,this._primitives=[]}getPrimitive(){let t=this._primitives;return t.length===0?this._getNewPrimitive():t.pop()}releasePrimitive(t){this._primitives.push(t)}};var Be=class extends st{constructor(){super(()=>new q)}},X=new Be;var _e=class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;let t=[],e=null;this.setBuffer=i=>{e&&t.push(e),e=i,this.float32Array=new Float32Array(i),this.uint16Array=new Uint16Array(i),this.uint32Array=new Uint32Array(i)},this.clearBuffer=()=>{e=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,t.length!==0&&this.setBuffer(t.pop())}}},N=new _e;var rt,bt,At=[],Zt=new st(()=>new G);function pn(n,t,e,i,o,c){rt=Zt.getPrimitive(),bt=Zt.getPrimitive(),At.push(rt,bt),N.setBuffer(n._roots[t]);let s=Se(0,n.geometry,e,i,o,c);N.clearBuffer(),Zt.releasePrimitive(rt),Zt.releasePrimitive(bt),At.pop(),At.pop();let a=At.length;return a>0&&(bt=At[a-1],rt=At[a-2]),s}function Se(n,t,e,i,o=null,c=0,s=0){let{float32Array:a,uint16Array:r,uint32Array:p}=N,f=n*2;if(R(f,r)){let l=U(n,p),d=z(f,r);return C(n,a,rt),i(l,d,!1,s,c+n,rt)}else{let P=function(S){let{uint16Array:D,uint32Array:F}=N,M=S*2;for(;!R(M,D);)S=k(S),M=S*2;return U(S,F)},I=function(S){let{uint16Array:D,uint32Array:F}=N,M=S*2;for(;!R(M,D);)S=H(S,F),M=S*2;return U(S,F)+z(M,D)},l=k(n),d=H(n,p),b=l,T=d,y,m,x,h;if(o&&(x=rt,h=bt,C(b,a,x),C(T,a,h),y=o(x),m=o(h),m<y)){b=d,T=l;let S=y;y=m,m=S,x=h}x||(x=rt,C(b,a,x));let v=R(b*2,r),A=e(x,v,y,s+1,c+b),w;if(A===2){let S=P(b),F=I(b)-S;w=i(S,F,!0,s+1,c+b,x)}else w=A&&Se(b,t,e,i,o,c,s+1);if(w)return!0;h=bt,C(T,a,h);let g=R(T*2,r),_=e(h,g,m,s+1,c+T),B;if(_===2){let S=P(T),F=I(T)-S;B=i(S,F,!0,s+1,c+T,h)}else B=_&&Se(T,t,e,i,o,c,s+1);return!!B}}var Mt=new E,Pe=new E;function dn(n,t,e={},i=0,o=1/0){let c=i*i,s=o*o,a=1/0,r=null;if(n.shapecast({boundsTraverseOrder:f=>(Mt.copy(t).clamp(f.min,f.max),Mt.distanceToSquared(t)),intersectsBounds:(f,u,l)=>l<a&&l<s,intersectsTriangle:(f,u)=>{f.closestPointToPoint(t,Mt);let l=t.distanceToSquared(Mt);return l<a&&(Pe.copy(Mt),a=l,r=u),l<c}}),a===1/0)return null;let p=Math.sqrt(a);return e.point?e.point.copy(Pe):e.point=Pe.clone(),e.distance=p,e.faceIndex=r,e}var Qn=parseInt("180")>=169,ft=new E,ut=new E,pt=new E,Jt=new et,Qt=new et,te=new et,mn=new E,xn=new E,yn=new E,Ct=new E;function ti(n,t,e,i,o,c,s,a){let r;if(c===qe?r=n.intersectTriangle(i,e,t,!0,o):r=n.intersectTriangle(t,e,i,c!==Ge,o),r===null)return null;let p=n.origin.distanceTo(o);return p<s||p>a?null:{distance:p,point:o.clone()}}function ei(n,t,e,i,o,c,s,a,r,p,f){ft.fromBufferAttribute(t,c),ut.fromBufferAttribute(t,s),pt.fromBufferAttribute(t,a);let u=ti(n,ft,ut,pt,Ct,r,p,f);if(u){let l=new E;nt.getBarycoord(Ct,ft,ut,pt,l),i&&(Jt.fromBufferAttribute(i,c),Qt.fromBufferAttribute(i,s),te.fromBufferAttribute(i,a),u.uv=nt.getInterpolation(Ct,ft,ut,pt,Jt,Qt,te,new et)),o&&(Jt.fromBufferAttribute(o,c),Qt.fromBufferAttribute(o,s),te.fromBufferAttribute(o,a),u.uv1=nt.getInterpolation(Ct,ft,ut,pt,Jt,Qt,te,new et)),e&&(mn.fromBufferAttribute(e,c),xn.fromBufferAttribute(e,s),yn.fromBufferAttribute(e,a),u.normal=nt.getInterpolation(Ct,ft,ut,pt,mn,xn,yn,new E),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let d={a:c,b:s,c:a,normal:new E,materialIndex:0};nt.getNormal(ft,ut,pt,d.normal),u.face=d,u.faceIndex=c,Qn&&(u.barycoord=l)}return u}function Tt(n,t,e,i,o,c,s){let a=i*3,r=a+0,p=a+1,f=a+2,u=n.index;n.index&&(r=u.getX(r),p=u.getX(p),f=u.getX(f));let{position:l,normal:d,uv:b,uv1:T}=n.attributes,y=ei(e,l,d,b,T,r,p,f,t,c,s);return y?(y.faceIndex=i,o&&o.push(y),y):null}function L(n,t,e,i){let o=n.a,c=n.b,s=n.c,a=t,r=t+1,p=t+2;e&&(a=e.getX(a),r=e.getX(r),p=e.getX(p)),o.x=i.getX(a),o.y=i.getY(a),o.z=i.getZ(a),c.x=i.getX(r),c.y=i.getY(r),c.z=i.getZ(r),s.x=i.getX(p),s.y=i.getY(p),s.z=i.getZ(p)}function hn(n,t,e,i,o,c,s,a){let{geometry:r,_indirectBuffer:p}=n;for(let f=i,u=i+o;f<u;f++)Tt(r,t,e,f,c,s,a)}function An(n,t,e,i,o,c,s){let{geometry:a,_indirectBuffer:r}=n,p=1/0,f=null;for(let u=i,l=i+o;u<l;u++){let d;d=Tt(a,t,e,u,null,c,s),d&&d.distance<p&&(f=d,p=d.distance)}return f}function bn(n,t,e,i,o,c,s){let{geometry:a}=e,{index:r}=a,p=a.attributes.position;for(let f=n,u=t+n;f<u;f++){let l;if(l=f,L(s,l*3,r,p),s.needsUpdate=!0,i(s,l,o,c))return!0}return!1}function Tn(n,t=null){t&&Array.isArray(t)&&(t=new Set(t));let e=n.geometry,i=e.index?e.index.array:null,o=e.attributes.position,c,s,a,r,p=0,f=n._roots;for(let l=0,d=f.length;l<d;l++)c=f[l],s=new Uint32Array(c),a=new Uint16Array(c),r=new Float32Array(c),u(0,p),p+=c.byteLength;function u(l,d,b=!1){let T=l*2;if(a[T+15]===65535){let m=s[l+6],x=a[T+14],h=1/0,v=1/0,A=1/0,w=-1/0,g=-1/0,_=-1/0;for(let B=3*m,P=3*(m+x);B<P;B++){let I=i[B],S=o.getX(I),D=o.getY(I),F=o.getZ(I);S<h&&(h=S),S>w&&(w=S),D<v&&(v=D),D>g&&(g=D),F<A&&(A=F),F>_&&(_=F)}return r[l+0]!==h||r[l+1]!==v||r[l+2]!==A||r[l+3]!==w||r[l+4]!==g||r[l+5]!==_?(r[l+0]=h,r[l+1]=v,r[l+2]=A,r[l+3]=w,r[l+4]=g,r[l+5]=_,!0):!1}else{let m=l+8,x=s[l+6],h=m+d,v=x+d,A=b,w=!1,g=!1;t?A||(w=t.has(h),g=t.has(v),A=!w&&!g):(w=!0,g=!0);let _=A||w,B=A||g,P=!1;_&&(P=u(m,d,A));let I=!1;B&&(I=u(x,d,A));let S=P||I;if(S)for(let D=0;D<3;D++){let F=m+D,M=x+D,O=r[F],Q=r[F+3],Pt=r[M],It=r[M+3];r[l+D]=O<Pt?O:Pt,r[l+D+3]=Q>It?Q:It}return S}}}function W(n,t,e,i,o){let c,s,a,r,p,f,u=1/e.direction.x,l=1/e.direction.y,d=1/e.direction.z,b=e.origin.x,T=e.origin.y,y=e.origin.z,m=t[n],x=t[n+3],h=t[n+1],v=t[n+3+1],A=t[n+2],w=t[n+3+2];return u>=0?(c=(m-b)*u,s=(x-b)*u):(c=(x-b)*u,s=(m-b)*u),l>=0?(a=(h-T)*l,r=(v-T)*l):(a=(v-T)*l,r=(h-T)*l),c>r||a>s||((a>c||isNaN(c))&&(c=a),(r<s||isNaN(s))&&(s=r),d>=0?(p=(A-y)*d,f=(w-y)*d):(p=(w-y)*d,f=(A-y)*d),c>f||p>s)?!1:((p>c||c!==c)&&(c=p),(f<s||s!==s)&&(s=f),c<=o&&s>=i)}function vn(n,t,e,i,o,c,s,a){let{geometry:r,_indirectBuffer:p}=n;for(let f=i,u=i+o;f<u;f++){let l=p?p[f]:f;Tt(r,t,e,l,c,s,a)}}function wn(n,t,e,i,o,c,s){let{geometry:a,_indirectBuffer:r}=n,p=1/0,f=null;for(let u=i,l=i+o;u<l;u++){let d;d=Tt(a,t,e,r?r[u]:u,null,c,s),d&&d.distance<p&&(f=d,p=d.distance)}return f}function gn(n,t,e,i,o,c,s){let{geometry:a}=e,{index:r}=a,p=a.attributes.position;for(let f=n,u=t+n;f<u;f++){let l;if(l=e.resolveTriangleIndex(f),L(s,l*3,r,p),s.needsUpdate=!0,i(s,l,o,c))return!0}return!1}function Bn(n,t,e,i,o,c,s){N.setBuffer(n._roots[t]),Ie(0,n,e,i,o,c,s),N.clearBuffer()}function Ie(n,t,e,i,o,c,s){let{float32Array:a,uint16Array:r,uint32Array:p}=N,f=n*2;if(R(f,r)){let l=U(n,p),d=z(f,r);hn(t,e,i,l,d,o,c,s)}else{let l=k(n);W(l,a,i,c,s)&&Ie(l,t,e,i,o,c,s);let d=H(n,p);W(d,a,i,c,s)&&Ie(d,t,e,i,o,c,s)}}var ni=["x","y","z"];function _n(n,t,e,i,o,c){N.setBuffer(n._roots[t]);let s=De(0,n,e,i,o,c);return N.clearBuffer(),s}function De(n,t,e,i,o,c){let{float32Array:s,uint16Array:a,uint32Array:r}=N,p=n*2;if(R(p,a)){let u=U(n,r),l=z(p,a);return An(t,e,i,u,l,o,c)}else{let u=ht(n,r),l=ni[u],b=i.direction[l]>=0,T,y;b?(T=k(n),y=H(n,r)):(T=H(n,r),y=k(n));let x=W(T,s,i,o,c)?De(T,t,e,i,o,c):null;if(x){let A=x.point[l];if(b?A<=s[y+u]:A>=s[y+u+3])return x}let v=W(y,s,i,o,c)?De(y,t,e,i,o,c):null;return x&&v?x.distance<=v.distance?x:v:x||v||null}}var ee=new G,vt=new q,wt=new q,Lt=new j,Sn=new V,ne=new V;function Pn(n,t,e,i){N.setBuffer(n._roots[t]);let o=Ee(0,n,e,i);return N.clearBuffer(),o}function Ee(n,t,e,i,o=null){let{float32Array:c,uint16Array:s,uint32Array:a}=N,r=n*2;if(o===null&&(e.boundingBox||e.computeBoundingBox(),Sn.set(e.boundingBox.min,e.boundingBox.max,i),o=Sn),R(r,s)){let f=t.geometry,u=f.index,l=f.attributes.position,d=e.index,b=e.attributes.position,T=U(n,a),y=z(r,s);if(Lt.copy(i).invert(),e.boundsTree)return C(n,c,ne),ne.matrix.copy(Lt),ne.needsUpdate=!0,e.boundsTree.shapecast({intersectsBounds:x=>ne.intersectsBox(x),intersectsTriangle:x=>{x.a.applyMatrix4(i),x.b.applyMatrix4(i),x.c.applyMatrix4(i),x.needsUpdate=!0;for(let h=T*3,v=(y+T)*3;h<v;h+=3)if(L(wt,h,u,l),wt.needsUpdate=!0,x.intersectsTriangle(wt))return!0;return!1}});for(let m=T*3,x=(y+T)*3;m<x;m+=3){L(vt,m,u,l),vt.a.applyMatrix4(Lt),vt.b.applyMatrix4(Lt),vt.c.applyMatrix4(Lt),vt.needsUpdate=!0;for(let h=0,v=d.count;h<v;h+=3)if(L(wt,h,d,b),wt.needsUpdate=!0,vt.intersectsTriangle(wt))return!0}}else{let f=n+8,u=a[n+6];return C(f,c,ee),!!(o.intersectsBox(ee)&&Ee(f,t,e,i,o)||(C(u,c,ee),o.intersectsBox(ee)&&Ee(u,t,e,i,o)))}}var ie=new j,Fe=new V,Rt=new V,ii=new E,oi=new E,si=new E,ri=new E;function In(n,t,e,i={},o={},c=0,s=1/0){t.boundingBox||t.computeBoundingBox(),Fe.set(t.boundingBox.min,t.boundingBox.max,e),Fe.needsUpdate=!0;let a=n.geometry,r=a.attributes.position,p=a.index,f=t.attributes.position,u=t.index,l=X.getPrimitive(),d=X.getPrimitive(),b=ii,T=oi,y=null,m=null;o&&(y=si,m=ri);let x=1/0,h=null,v=null;return ie.copy(e).invert(),Rt.matrix.copy(ie),n.shapecast({boundsTraverseOrder:A=>Fe.distanceToBox(A),intersectsBounds:(A,w,g)=>g<x&&g<s?(w&&(Rt.min.copy(A.min),Rt.max.copy(A.max),Rt.needsUpdate=!0),!0):!1,intersectsRange:(A,w)=>{if(t.boundsTree)return t.boundsTree.shapecast({boundsTraverseOrder:_=>Rt.distanceToBox(_),intersectsBounds:(_,B,P)=>P<x&&P<s,intersectsRange:(_,B)=>{for(let P=_,I=_+B;P<I;P++){L(d,3*P,u,f),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let S=A,D=A+w;S<D;S++){L(l,3*S,p,r),l.needsUpdate=!0;let F=l.distanceToTriangle(d,b,y);if(F<x&&(T.copy(b),m&&m.copy(y),x=F,h=S,v=P),F<c)return!0}}}});{let g=$(t);for(let _=0,B=g;_<B;_++){L(d,3*_,u,f),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let P=A,I=A+w;P<I;P++){L(l,3*P,p,r),l.needsUpdate=!0;let S=l.distanceToTriangle(d,b,y);if(S<x&&(T.copy(b),m&&m.copy(y),x=S,h=P,v=_),S<c)return!0}}}}}),X.releasePrimitive(l),X.releasePrimitive(d),x===1/0?null:(i.point?i.point.copy(T):i.point=T.clone(),i.distance=x,i.faceIndex=h,o&&(o.point?o.point.copy(m):o.point=m.clone(),o.point.applyMatrix4(ie),T.applyMatrix4(ie),o.distance=T.sub(o.point).length(),o.faceIndex=v),i)}function Dn(n,t=null){t&&Array.isArray(t)&&(t=new Set(t));let e=n.geometry,i=e.index?e.index.array:null,o=e.attributes.position,c,s,a,r,p=0,f=n._roots;for(let l=0,d=f.length;l<d;l++)c=f[l],s=new Uint32Array(c),a=new Uint16Array(c),r=new Float32Array(c),u(0,p),p+=c.byteLength;function u(l,d,b=!1){let T=l*2;if(a[T+15]===65535){let m=s[l+6],x=a[T+14],h=1/0,v=1/0,A=1/0,w=-1/0,g=-1/0,_=-1/0;for(let B=m,P=m+x;B<P;B++){let I=3*n.resolveTriangleIndex(B);for(let S=0;S<3;S++){let D=I+S;D=i?i[D]:D;let F=o.getX(D),M=o.getY(D),O=o.getZ(D);F<h&&(h=F),F>w&&(w=F),M<v&&(v=M),M>g&&(g=M),O<A&&(A=O),O>_&&(_=O)}}return r[l+0]!==h||r[l+1]!==v||r[l+2]!==A||r[l+3]!==w||r[l+4]!==g||r[l+5]!==_?(r[l+0]=h,r[l+1]=v,r[l+2]=A,r[l+3]=w,r[l+4]=g,r[l+5]=_,!0):!1}else{let m=l+8,x=s[l+6],h=m+d,v=x+d,A=b,w=!1,g=!1;t?A||(w=t.has(h),g=t.has(v),A=!w&&!g):(w=!0,g=!0);let _=A||w,B=A||g,P=!1;_&&(P=u(m,d,A));let I=!1;B&&(I=u(x,d,A));let S=P||I;if(S)for(let D=0;D<3;D++){let F=m+D,M=x+D,O=r[F],Q=r[F+3],Pt=r[M],It=r[M+3];r[l+D]=O<Pt?O:Pt,r[l+D+3]=Q>It?Q:It}return S}}}function En(n,t,e,i,o,c,s){N.setBuffer(n._roots[t]),Ne(0,n,e,i,o,c,s),N.clearBuffer()}function Ne(n,t,e,i,o,c,s){let{float32Array:a,uint16Array:r,uint32Array:p}=N,f=n*2;if(R(f,r)){let l=U(n,p),d=z(f,r);vn(t,e,i,l,d,o,c,s)}else{let l=k(n);W(l,a,i,c,s)&&Ne(l,t,e,i,o,c,s);let d=H(n,p);W(d,a,i,c,s)&&Ne(d,t,e,i,o,c,s)}}var ci=["x","y","z"];function Fn(n,t,e,i,o,c){N.setBuffer(n._roots[t]);let s=Me(0,n,e,i,o,c);return N.clearBuffer(),s}function Me(n,t,e,i,o,c){let{float32Array:s,uint16Array:a,uint32Array:r}=N,p=n*2;if(R(p,a)){let u=U(n,r),l=z(p,a);return wn(t,e,i,u,l,o,c)}else{let u=ht(n,r),l=ci[u],b=i.direction[l]>=0,T,y;b?(T=k(n),y=H(n,r)):(T=H(n,r),y=k(n));let x=W(T,s,i,o,c)?Me(T,t,e,i,o,c):null;if(x){let A=x.point[l];if(b?A<=s[y+u]:A>=s[y+u+3])return x}let v=W(y,s,i,o,c)?Me(y,t,e,i,o,c):null;return x&&v?x.distance<=v.distance?x:v:x||v||null}}var oe=new G,gt=new q,Bt=new q,Ut=new j,Nn=new V,se=new V;function Mn(n,t,e,i){N.setBuffer(n._roots[t]);let o=Ce(0,n,e,i);return N.clearBuffer(),o}function Ce(n,t,e,i,o=null){let{float32Array:c,uint16Array:s,uint32Array:a}=N,r=n*2;if(o===null&&(e.boundingBox||e.computeBoundingBox(),Nn.set(e.boundingBox.min,e.boundingBox.max,i),o=Nn),R(r,s)){let f=t.geometry,u=f.index,l=f.attributes.position,d=e.index,b=e.attributes.position,T=U(n,a),y=z(r,s);if(Ut.copy(i).invert(),e.boundsTree)return C(n,c,se),se.matrix.copy(Ut),se.needsUpdate=!0,e.boundsTree.shapecast({intersectsBounds:x=>se.intersectsBox(x),intersectsTriangle:x=>{x.a.applyMatrix4(i),x.b.applyMatrix4(i),x.c.applyMatrix4(i),x.needsUpdate=!0;for(let h=T,v=y+T;h<v;h++)if(L(Bt,3*t.resolveTriangleIndex(h),u,l),Bt.needsUpdate=!0,x.intersectsTriangle(Bt))return!0;return!1}});for(let m=T,x=y+T;m<x;m++){let h=t.resolveTriangleIndex(m);L(gt,3*h,u,l),gt.a.applyMatrix4(Ut),gt.b.applyMatrix4(Ut),gt.c.applyMatrix4(Ut),gt.needsUpdate=!0;for(let v=0,A=d.count;v<A;v+=3)if(L(Bt,v,d,b),Bt.needsUpdate=!0,gt.intersectsTriangle(Bt))return!0}}else{let f=n+8,u=a[n+6];return C(f,c,oe),!!(o.intersectsBox(oe)&&Ce(f,t,e,i,o)||(C(u,c,oe),o.intersectsBox(oe)&&Ce(u,t,e,i,o)))}}var re=new j,Le=new V,zt=new V,ai=new E,li=new E,fi=new E,ui=new E;function Cn(n,t,e,i={},o={},c=0,s=1/0){t.boundingBox||t.computeBoundingBox(),Le.set(t.boundingBox.min,t.boundingBox.max,e),Le.needsUpdate=!0;let a=n.geometry,r=a.attributes.position,p=a.index,f=t.attributes.position,u=t.index,l=X.getPrimitive(),d=X.getPrimitive(),b=ai,T=li,y=null,m=null;o&&(y=fi,m=ui);let x=1/0,h=null,v=null;return re.copy(e).invert(),zt.matrix.copy(re),n.shapecast({boundsTraverseOrder:A=>Le.distanceToBox(A),intersectsBounds:(A,w,g)=>g<x&&g<s?(w&&(zt.min.copy(A.min),zt.max.copy(A.max),zt.needsUpdate=!0),!0):!1,intersectsRange:(A,w)=>{if(t.boundsTree){let g=t.boundsTree;return g.shapecast({boundsTraverseOrder:_=>zt.distanceToBox(_),intersectsBounds:(_,B,P)=>P<x&&P<s,intersectsRange:(_,B)=>{for(let P=_,I=_+B;P<I;P++){let S=g.resolveTriangleIndex(P);L(d,3*S,u,f),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let D=A,F=A+w;D<F;D++){let M=n.resolveTriangleIndex(D);L(l,3*M,p,r),l.needsUpdate=!0;let O=l.distanceToTriangle(d,b,y);if(O<x&&(T.copy(b),m&&m.copy(y),x=O,h=D,v=P),O<c)return!0}}}})}else{let g=$(t);for(let _=0,B=g;_<B;_++){L(d,3*_,u,f),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let P=A,I=A+w;P<I;P++){let S=n.resolveTriangleIndex(P);L(l,3*S,p,r),l.needsUpdate=!0;let D=l.distanceToTriangle(d,b,y);if(D<x&&(T.copy(b),m&&m.copy(y),x=D,h=P,v=_),D<c)return!0}}}}}),X.releasePrimitive(l),X.releasePrimitive(d),x===1/0?null:(i.point?i.point.copy(T):i.point=T.clone(),i.distance=x,i.faceIndex=h,o&&(o.point?o.point.copy(m):o.point=m.clone(),o.point.applyMatrix4(re),T.applyMatrix4(re),o.distance=T.sub(o.point).length(),o.faceIndex=v),i)}function Ln(){return typeof SharedArrayBuffer<"u"}var Vt=new N.constructor,ce=new N.constructor,ct=new st(()=>new G),_t=new G,St=new G,Re=new G,Ue=new G,ze=!1;function Rn(n,t,e,i){if(ze)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");ze=!0;let o=n._roots,c=t._roots,s,a=0,r=0,p=new j().copy(e).invert();for(let f=0,u=o.length;f<u;f++){Vt.setBuffer(o[f]),r=0;let l=ct.getPrimitive();C(0,Vt.float32Array,l),l.applyMatrix4(p);for(let d=0,b=c.length;d<b&&(ce.setBuffer(c[d]),s=Z(0,0,e,p,i,a,r,0,0,l),ce.clearBuffer(),r+=c[d].length,!s);d++);if(ct.releasePrimitive(l),Vt.clearBuffer(),a+=o[f].length,s)break}return ze=!1,s}function Z(n,t,e,i,o,c=0,s=0,a=0,r=0,p=null,f=!1){let u,l;f?(u=ce,l=Vt):(u=Vt,l=ce);let d=u.float32Array,b=u.uint32Array,T=u.uint16Array,y=l.float32Array,m=l.uint32Array,x=l.uint16Array,h=n*2,v=t*2,A=R(h,T),w=R(v,x),g=!1;if(w&&A)f?g=o(U(t,m),z(t*2,x),U(n,b),z(n*2,T),r,s+t,a,c+n):g=o(U(n,b),z(n*2,T),U(t,m),z(t*2,x),a,c+n,r,s+t);else if(w){let _=ct.getPrimitive();C(t,y,_),_.applyMatrix4(e);let B=k(n),P=H(n,b);C(B,d,_t),C(P,d,St);let I=_.intersectsBox(_t),S=_.intersectsBox(St);g=I&&Z(t,B,i,e,o,s,c,r,a+1,_,!f)||S&&Z(t,P,i,e,o,s,c,r,a+1,_,!f),ct.releasePrimitive(_)}else{let _=k(t),B=H(t,m);C(_,y,Re),C(B,y,Ue);let P=p.intersectsBox(Re),I=p.intersectsBox(Ue);if(P&&I)g=Z(n,_,e,i,o,c,s,a,r+1,p,f)||Z(n,B,e,i,o,c,s,a,r+1,p,f);else if(P)if(A)g=Z(n,_,e,i,o,c,s,a,r+1,p,f);else{let S=ct.getPrimitive();S.copy(Re).applyMatrix4(e);let D=k(n),F=H(n,b);C(D,d,_t),C(F,d,St);let M=S.intersectsBox(_t),O=S.intersectsBox(St);g=M&&Z(_,D,i,e,o,s,c,r,a+1,S,!f)||O&&Z(_,F,i,e,o,s,c,r,a+1,S,!f),ct.releasePrimitive(S)}else if(I)if(A)g=Z(n,B,e,i,o,c,s,a,r+1,p,f);else{let S=ct.getPrimitive();S.copy(Ue).applyMatrix4(e);let D=k(n),F=H(n,b);C(D,d,_t),C(F,d,St);let M=S.intersectsBox(_t),O=S.intersectsBox(St);g=M&&Z(B,D,i,e,o,s,c,r,a+1,S,!f)||O&&Z(B,F,i,e,o,s,c,r,a+1,S,!f),ct.releasePrimitive(S)}}return g}var ae=new V,Un=new G,pi={strategy:0,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null},Ve=class n{static serialize(t,e={}){e={cloneBuffers:!0,...e};let i=t.geometry,o=t._roots,c=t._indirectBuffer,s=i.getIndex(),a;return e.cloneBuffers?a={roots:o.map(r=>r.slice()),index:s?s.array.slice():null,indirectBuffer:c?c.slice():null}:a={roots:o,index:s?s.array:null,indirectBuffer:c},a}static deserialize(t,e,i={}){i={setIndex:!0,indirect:!!t.indirectBuffer,...i};let{index:o,roots:c,indirectBuffer:s}=t,a=new n(e,{...i,[Gt]:!0});if(a._roots=c,a._indirectBuffer=s||null,i.setIndex){let r=e.getIndex();if(r===null){let p=new mt(t.index,1,!1);e.setIndex(p)}else r.array!==o&&(r.array.set(o),r.needsUpdate=!0)}return a}get indirect(){return!!this._indirectBuffer}constructor(t,e={}){if(t.isBufferGeometry){if(t.index&&t.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(e=Object.assign({...pi,[Gt]:!1},e),e.useSharedArrayBuffer&&!Ln())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=t,this._roots=null,this._indirectBuffer=null,e[Gt]||(fn(this,e),!t.boundingBox&&e.setBoundingBox&&(t.boundingBox=this.getBoundingBox(new G))),this.resolveTriangleIndex=e.indirect?i=>this._indirectBuffer[i]:i=>i}refit(t=null){return(this.indirect?Dn:Tn)(this,t)}traverse(t,e=0){let i=this._roots[e],o=new Uint32Array(i),c=new Uint16Array(i);s(0);function s(a,r=0){let p=a*2,f=c[p+15]===65535;if(f){let u=o[a+6],l=c[p+14];t(r,f,new Float32Array(i,a*4,6),u,l)}else{let u=a+32/4,l=o[a+6],d=o[a+7];t(r,f,new Float32Array(i,a*4,6),d)||(s(u,r+1),s(l,r+1))}}}raycast(t,e=pe,i=0,o=1/0){let c=this._roots,s=this.geometry,a=[],r=e.isMaterial,p=Array.isArray(e),f=s.groups,u=r?e.side:e,l=this.indirect?En:Bn;for(let d=0,b=c.length;d<b;d++){let T=p?e[f[d].materialIndex].side:u,y=a.length;if(l(this,d,T,t,a,i,o),p){let m=f[d].materialIndex;for(let x=y,h=a.length;x<h;x++)a[x].face.materialIndex=m}}return a}raycastFirst(t,e=pe,i=0,o=1/0){let c=this._roots,s=this.geometry,a=e.isMaterial,r=Array.isArray(e),p=null,f=s.groups,u=a?e.side:e,l=this.indirect?Fn:_n;for(let d=0,b=c.length;d<b;d++){let T=r?e[f[d].materialIndex].side:u,y=l(this,d,T,t,i,o);y!=null&&(p==null||y.distance<p.distance)&&(p=y,r&&(y.face.materialIndex=f[d].materialIndex))}return p}intersectsGeometry(t,e){let i=!1,o=this._roots,c=this.indirect?Mn:Pn;for(let s=0,a=o.length;s<a&&(i=c(this,s,t,e),!i);s++);return i}shapecast(t){let e=X.getPrimitive(),i=this.indirect?gn:bn,{boundsTraverseOrder:o,intersectsBounds:c,intersectsRange:s,intersectsTriangle:a}=t;if(s&&a){let u=s;s=(l,d,b,T,y)=>u(l,d,b,T,y)?!0:i(l,d,this,a,b,T,e)}else s||(a?s=(u,l,d,b)=>i(u,l,this,a,d,b,e):s=(u,l,d)=>d);let r=!1,p=0,f=this._roots;for(let u=0,l=f.length;u<l;u++){let d=f[u];if(r=pn(this,u,c,s,o,p),r)break;p+=d.byteLength}return X.releasePrimitive(e),r}bvhcast(t,e,i){let{intersectsRanges:o,intersectsTriangles:c}=i,s=X.getPrimitive(),a=this.geometry.index,r=this.geometry.attributes.position,p=this.indirect?b=>{let T=this.resolveTriangleIndex(b);L(s,T*3,a,r)}:b=>{L(s,b*3,a,r)},f=X.getPrimitive(),u=t.geometry.index,l=t.geometry.attributes.position,d=t.indirect?b=>{let T=t.resolveTriangleIndex(b);L(f,T*3,u,l)}:b=>{L(f,b*3,u,l)};if(c){let b=(T,y,m,x,h,v,A,w)=>{for(let g=m,_=m+x;g<_;g++){d(g),f.a.applyMatrix4(e),f.b.applyMatrix4(e),f.c.applyMatrix4(e),f.needsUpdate=!0;for(let B=T,P=T+y;B<P;B++)if(p(B),s.needsUpdate=!0,c(s,f,B,g,h,v,A,w))return!0}return!1};if(o){let T=o;o=function(y,m,x,h,v,A,w,g){return T(y,m,x,h,v,A,w,g)?!0:b(y,m,x,h,v,A,w,g)}}else o=b}return Rn(this,t,e,o)}intersectsBox(t,e){return ae.set(t.min,t.max,e),ae.needsUpdate=!0,this.shapecast({intersectsBounds:i=>ae.intersectsBox(i),intersectsTriangle:i=>ae.intersectsTriangle(i)})}intersectsSphere(t){return this.shapecast({intersectsBounds:e=>t.intersectsBox(e),intersectsTriangle:e=>e.intersectsSphere(t)})}closestPointToGeometry(t,e,i={},o={},c=0,s=1/0){return(this.indirect?Cn:In)(this,t,e,i,o,c,s)}closestPointToPoint(t,e={},i=0,o=1/0){return dn(this,t,e,i,o)}getBoundingBox(t){return t.makeEmpty(),this._roots.forEach(i=>{C(0,new Float32Array(i),Un),t.union(Un)}),t}};function di(n){switch(n){case 1:return"R";case 2:return"RG";case 3:return"RGBA";case 4:return"RGBA"}throw new Error}function mi(n){switch(n){case 1:return je;case 2:return We;case 3:return dt;case 4:return dt}}function zn(n){switch(n){case 1:return Ke;case 2:return Ht;case 3:return kt;case 4:return kt}}var le=class extends Dt{constructor(){super(),this.minFilter=tt,this.magFilter=tt,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(t){let e=this.overrideItemSize,i=t.itemSize,o=t.count;if(e!==null){if(i*o%e!==0)throw new Error("VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.");t.itemSize=e,t.count=o*i/e}let c=t.itemSize,s=t.count,a=t.normalized,r=t.array.constructor,p=r.BYTES_PER_ELEMENT,f=this._forcedType,u=c;if(f===null)switch(r){case Float32Array:f=lt;break;case Uint8Array:case Uint16Array:case Uint32Array:f=at;break;case Int8Array:case Int16Array:case Int32Array:f=Ot;break}let l,d,b,T,y=di(c);switch(f){case lt:b=1,d=mi(c),a&&p===1?(T=r,y+="8",r===Uint8Array?l=de:(l=me,y+="_SNORM")):(T=Float32Array,y+="32F",l=lt);break;case Ot:y+=p*8+"I",b=a?Math.pow(2,r.BYTES_PER_ELEMENT*8-1):1,d=zn(c),p===1?(T=Int8Array,l=me):p===2?(T=Int16Array,l=Xe):(T=Int32Array,l=Ot);break;case at:y+=p*8+"UI",b=a?Math.pow(2,r.BYTES_PER_ELEMENT*8-1):1,d=zn(c),p===1?(T=Uint8Array,l=de):p===2?(T=Uint16Array,l=Ye):(T=Uint32Array,l=at);break}u===3&&(d===dt||d===kt)&&(u=4);let m=Math.ceil(Math.sqrt(s))||1,x=u*m*m,h=new T(x),v=t.normalized;t.normalized=!1;for(let A=0;A<s;A++){let w=u*A;h[w]=t.getX(A)/b,c>=2&&(h[w+1]=t.getY(A)/b),c>=3&&(h[w+2]=t.getZ(A)/b,u===4&&(h[w+3]=1)),c>=4&&(h[w+3]=t.getW(A)/b)}t.normalized=v,this.internalFormat=y,this.format=d,this.type=l,this.image.width=m,this.image.height=m,this.image.data=h,this.needsUpdate=!0,this.dispose(),t.itemSize=i,t.count=o}},fe=class extends le{constructor(){super(),this._forcedType=at}};var ue=class extends le{constructor(){super(),this._forcedType=lt}};var Vn=class{constructor(){this.index=new fe,this.position=new ue,this.bvhBounds=new Dt,this.bvhContents=new Dt,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(t){let{geometry:e}=t;if(yi(t,this.bvhBounds,this.bvhContents),this.position.updateFrom(e.attributes.position),t.indirect){let i=t._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==i.length)if(e.index)this._cachedIndexAttr=e.index.clone();else{let o=ye(xe(e));this._cachedIndexAttr=new mt(o,1,!1)}xi(e,i,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(e.index)}dispose(){let{index:t,position:e,bvhBounds:i,bvhContents:o}=this;t&&t.dispose(),e&&e.dispose(),i&&i.dispose(),o&&o.dispose()}};function xi(n,t,e){let i=e.array,o=n.index?n.index.array:null;for(let c=0,s=t.length;c<s;c++){let a=3*c,r=3*t[c];for(let p=0;p<3;p++)i[a+p]=o?o[r+p]:r+p}}function yi(n,t,e){let i=n._roots;if(i.length!==1)throw new Error("MeshBVHUniformStruct: Multi-root BVHs not supported.");let o=i[0],c=new Uint16Array(o),s=new Uint32Array(o),a=new Float32Array(o),r=o.byteLength/32,p=2*Math.ceil(Math.sqrt(r/2)),f=new Float32Array(4*p*p),u=Math.ceil(Math.sqrt(r)),l=new Uint32Array(2*u*u);for(let d=0;d<r;d++){let b=d*32/4,T=b*2,y=b;for(let m=0;m<3;m++)f[8*d+0+m]=a[y+0+m],f[8*d+4+m]=a[y+3+m];if(R(T,c)){let m=z(T,c),x=U(b,s),h=4294901760|m;l[d*2+0]=h,l[d*2+1]=x}else{let m=4*H(b,s)/32,x=ht(b,s);l[d*2+0]=x,l[d*2+1]=m}}t.image.data=f,t.image.width=p,t.image.height=p,t.format=dt,t.type=lt,t.internalFormat="RGBA32F",t.minFilter=tt,t.magFilter=tt,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose(),e.image.data=l,e.image.width=u,e.image.height=u,e.format=Ht,e.type=at,e.internalFormat="RG32UI",e.minFilter=tt,e.magFilter=tt,e.generateMipmaps=!1,e.needsUpdate=!0,e.dispose()}var ke={};kn(ke,{bvh_distance_functions:()=>On,bvh_ray_functions:()=>He,bvh_struct_definitions:()=>Hn,common_functions:()=>Oe});var Oe=`

// A stack of uint32 indices can can store the indices for
// a perfectly balanced tree with a depth up to 31. Lower stack
// depth gets higher performance.
//
// However not all trees are balanced. Best value to set this to
// is the trees max depth.
#ifndef BVH_STACK_DEPTH
#define BVH_STACK_DEPTH 60
#endif

#ifndef INFINITY
#define INFINITY 1e20
#endif

// Utilities
uvec4 uTexelFetch1D( usampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

ivec4 iTexelFetch1D( isampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 texelFetch1D( sampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 textureSampleBarycoord( sampler2D tex, vec3 barycoord, uvec3 faceIndices ) {

	return
		barycoord.x * texelFetch1D( tex, faceIndices.x ) +
		barycoord.y * texelFetch1D( tex, faceIndices.y ) +
		barycoord.z * texelFetch1D( tex, faceIndices.z );

}

void ndcToCameraRay(
	vec2 coord, mat4 cameraWorld, mat4 invProjectionMatrix,
	out vec3 rayOrigin, out vec3 rayDirection
) {

	// get camera look direction and near plane for camera clipping
	vec4 lookDirection = cameraWorld * vec4( 0.0, 0.0, - 1.0, 0.0 );
	vec4 nearVector = invProjectionMatrix * vec4( 0.0, 0.0, - 1.0, 1.0 );
	float near = abs( nearVector.z / nearVector.w );

	// get the camera direction and position from camera matrices
	vec4 origin = cameraWorld * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec4 direction = invProjectionMatrix * vec4( coord, 0.5, 1.0 );
	direction /= direction.w;
	direction = cameraWorld * direction - origin;

	// slide the origin along the ray until it sits at the near clip plane position
	origin.xyz += direction.xyz * near / dot( direction, lookDirection );

	rayOrigin = origin.xyz;
	rayDirection = direction.xyz;

}
`;var On=`

float dot2( vec3 v ) {

	return dot( v, v );

}

// https://www.shadertoy.com/view/ttfGWl
vec3 closestPointToTriangle( vec3 p, vec3 v0, vec3 v1, vec3 v2, out vec3 barycoord ) {

    vec3 v10 = v1 - v0;
    vec3 v21 = v2 - v1;
    vec3 v02 = v0 - v2;

	vec3 p0 = p - v0;
	vec3 p1 = p - v1;
	vec3 p2 = p - v2;

    vec3 nor = cross( v10, v02 );

    // method 2, in barycentric space
    vec3  q = cross( nor, p0 );
    float d = 1.0 / dot2( nor );
    float u = d * dot( q, v02 );
    float v = d * dot( q, v10 );
    float w = 1.0 - u - v;

	if( u < 0.0 ) {

		w = clamp( dot( p2, v02 ) / dot2( v02 ), 0.0, 1.0 );
		u = 0.0;
		v = 1.0 - w;

	} else if( v < 0.0 ) {

		u = clamp( dot( p0, v10 ) / dot2( v10 ), 0.0, 1.0 );
		v = 0.0;
		w = 1.0 - u;

	} else if( w < 0.0 ) {

		v = clamp( dot( p1, v21 ) / dot2( v21 ), 0.0, 1.0 );
		w = 0.0;
		u = 1.0-v;

	}

	barycoord = vec3( u, v, w );
    return u * v1 + v * v2 + w * v0;

}

float distanceToTriangles(
	// geometry info and triangle range
	sampler2D positionAttr, usampler2D indexAttr, uint offset, uint count,

	// point and cut off range
	vec3 point, float closestDistanceSquared,

	// outputs
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord, inout float side, inout vec3 outPoint
) {

	bool found = false;
	vec3 localBarycoord;
	for ( uint i = offset, l = offset + count; i < l; i ++ ) {

		uvec3 indices = uTexelFetch1D( indexAttr, i ).xyz;
		vec3 a = texelFetch1D( positionAttr, indices.x ).rgb;
		vec3 b = texelFetch1D( positionAttr, indices.y ).rgb;
		vec3 c = texelFetch1D( positionAttr, indices.z ).rgb;

		// get the closest point and barycoord
		vec3 closestPoint = closestPointToTriangle( point, a, b, c, localBarycoord );
		vec3 delta = point - closestPoint;
		float sqDist = dot2( delta );
		if ( sqDist < closestDistanceSquared ) {

			// set the output results
			closestDistanceSquared = sqDist;
			faceIndices = uvec4( indices.xyz, i );
			faceNormal = normalize( cross( a - b, b - c ) );
			barycoord = localBarycoord;
			outPoint = closestPoint;
			side = sign( dot( faceNormal, delta ) );

		}

	}

	return closestDistanceSquared;

}

float distanceSqToBounds( vec3 point, vec3 boundsMin, vec3 boundsMax ) {

	vec3 clampedPoint = clamp( point, boundsMin, boundsMax );
	vec3 delta = point - clampedPoint;
	return dot( delta, delta );

}

float distanceSqToBVHNodeBoundsPoint( vec3 point, sampler2D bvhBounds, uint currNodeIndex ) {

	uint cni2 = currNodeIndex * 2u;
	vec3 boundsMin = texelFetch1D( bvhBounds, cni2 ).xyz;
	vec3 boundsMax = texelFetch1D( bvhBounds, cni2 + 1u ).xyz;
	return distanceSqToBounds( point, boundsMin, boundsMax );

}

// use a macro to hide the fact that we need to expand the struct into separate fields
#define	bvhClosestPointToPoint(		bvh,		point, maxDistance, faceIndices, faceNormal, barycoord, side, outPoint	)	_bvhClosestPointToPoint(		bvh.position, bvh.index, bvh.bvhBounds, bvh.bvhContents,		point, maxDistance, faceIndices, faceNormal, barycoord, side, outPoint	)

float _bvhClosestPointToPoint(
	// bvh info
	sampler2D bvh_position, usampler2D bvh_index, sampler2D bvh_bvhBounds, usampler2D bvh_bvhContents,

	// point to check
	vec3 point, float maxDistance,

	// output variables
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout vec3 outPoint
 ) {

	// stack needs to be twice as long as the deepest tree we expect because
	// we push both the left and right child onto the stack every traversal
	int ptr = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float closestDistanceSquared = maxDistance * maxDistance;
	bool found = false;
	while ( ptr > - 1 && ptr < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ ptr ];
		ptr --;

		// check if we intersect the current bounds
		float boundsHitDistance = distanceSqToBVHNodeBoundsPoint( point, bvh_bvhBounds, currNodeIndex );
		if ( boundsHitDistance > closestDistanceSquared ) {

			continue;

		}

		uvec2 boundsInfo = uTexelFetch1D( bvh_bvhContents, currNodeIndex ).xy;
		bool isLeaf = bool( boundsInfo.x & 0xffff0000u );
		if ( isLeaf ) {

			uint count = boundsInfo.x & 0x0000ffffu;
			uint offset = boundsInfo.y;
			closestDistanceSquared = distanceToTriangles(
				bvh_position, bvh_index, offset, count, point, closestDistanceSquared,

				// outputs
				faceIndices, faceNormal, barycoord, side, outPoint
			);

		} else {

			uint leftIndex = currNodeIndex + 1u;
			uint splitAxis = boundsInfo.x & 0x0000ffffu;
			uint rightIndex = boundsInfo.y;
			bool leftToRight = distanceSqToBVHNodeBoundsPoint( point, bvh_bvhBounds, leftIndex ) < distanceSqToBVHNodeBoundsPoint( point, bvh_bvhBounds, rightIndex );//rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			ptr ++;
			stack[ ptr ] = c2;
			ptr ++;
			stack[ ptr ] = c1;

		}

	}

	return sqrt( closestDistanceSquared );

}
`;var He=`

#ifndef TRI_INTERSECT_EPSILON
#define TRI_INTERSECT_EPSILON 1e-5
#endif

// Raycasting
bool intersectsBounds( vec3 rayOrigin, vec3 rayDirection, vec3 boundsMin, vec3 boundsMax, out float dist ) {

	// https://www.reddit.com/r/opengl/comments/8ntzz5/fast_glsl_ray_box_intersection/
	// https://tavianator.com/2011/ray_box.html
	vec3 invDir = 1.0 / rayDirection;

	// find intersection distances for each plane
	vec3 tMinPlane = invDir * ( boundsMin - rayOrigin );
	vec3 tMaxPlane = invDir * ( boundsMax - rayOrigin );

	// get the min and max distances from each intersection
	vec3 tMinHit = min( tMaxPlane, tMinPlane );
	vec3 tMaxHit = max( tMaxPlane, tMinPlane );

	// get the furthest hit distance
	vec2 t = max( tMinHit.xx, tMinHit.yz );
	float t0 = max( t.x, t.y );

	// get the minimum hit distance
	t = min( tMaxHit.xx, tMaxHit.yz );
	float t1 = min( t.x, t.y );

	// set distance to 0.0 if the ray starts inside the box
	dist = max( t0, 0.0 );

	return t1 >= dist;

}

bool intersectsTriangle(
	vec3 rayOrigin, vec3 rayDirection, vec3 a, vec3 b, vec3 c,
	out vec3 barycoord, out vec3 norm, out float dist, out float side
) {

	// https://stackoverflow.com/questions/42740765/intersection-between-line-and-triangle-in-3d
	vec3 edge1 = b - a;
	vec3 edge2 = c - a;
	norm = cross( edge1, edge2 );

	float det = - dot( rayDirection, norm );
	float invdet = 1.0 / det;

	vec3 AO = rayOrigin - a;
	vec3 DAO = cross( AO, rayDirection );

	vec4 uvt;
	uvt.x = dot( edge2, DAO ) * invdet;
	uvt.y = - dot( edge1, DAO ) * invdet;
	uvt.z = dot( AO, norm ) * invdet;
	uvt.w = 1.0 - uvt.x - uvt.y;

	// set the hit information
	barycoord = uvt.wxy; // arranged in A, B, C order
	dist = uvt.z;
	side = sign( det );
	norm = side * normalize( norm );

	// add an epsilon to avoid misses between triangles
	uvt += vec4( TRI_INTERSECT_EPSILON );

	return all( greaterThanEqual( uvt, vec4( 0.0 ) ) );

}

bool intersectTriangles(
	// geometry info and triangle range
	sampler2D positionAttr, usampler2D indexAttr, uint offset, uint count,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// outputs
	inout float minDistance, inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	bool found = false;
	vec3 localBarycoord, localNormal;
	float localDist, localSide;
	for ( uint i = offset, l = offset + count; i < l; i ++ ) {

		uvec3 indices = uTexelFetch1D( indexAttr, i ).xyz;
		vec3 a = texelFetch1D( positionAttr, indices.x ).rgb;
		vec3 b = texelFetch1D( positionAttr, indices.y ).rgb;
		vec3 c = texelFetch1D( positionAttr, indices.z ).rgb;

		if (
			intersectsTriangle( rayOrigin, rayDirection, a, b, c, localBarycoord, localNormal, localDist, localSide )
			&& localDist < minDistance
		) {

			found = true;
			minDistance = localDist;

			faceIndices = uvec4( indices.xyz, i );
			faceNormal = localNormal;

			side = localSide;
			barycoord = localBarycoord;
			dist = localDist;

		}

	}

	return found;

}

bool intersectsBVHNodeBounds( vec3 rayOrigin, vec3 rayDirection, sampler2D bvhBounds, uint currNodeIndex, out float dist ) {

	uint cni2 = currNodeIndex * 2u;
	vec3 boundsMin = texelFetch1D( bvhBounds, cni2 ).xyz;
	vec3 boundsMax = texelFetch1D( bvhBounds, cni2 + 1u ).xyz;
	return intersectsBounds( rayOrigin, rayDirection, boundsMin, boundsMax, dist );

}

// use a macro to hide the fact that we need to expand the struct into separate fields
#define	bvhIntersectFirstHit(		bvh,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)	_bvhIntersectFirstHit(		bvh.position, bvh.index, bvh.bvhBounds, bvh.bvhContents,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)

bool _bvhIntersectFirstHit(
	// bvh info
	sampler2D bvh_position, usampler2D bvh_index, sampler2D bvh_bvhBounds, usampler2D bvh_bvhContents,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// output variables split into separate variables due to output precision
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	// stack needs to be twice as long as the deepest tree we expect because
	// we push both the left and right child onto the stack every traversal
	int ptr = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float triangleDistance = INFINITY;
	bool found = false;
	while ( ptr > - 1 && ptr < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ ptr ];
		ptr --;

		// check if we intersect the current bounds
		float boundsHitDistance;
		if (
			! intersectsBVHNodeBounds( rayOrigin, rayDirection, bvh_bvhBounds, currNodeIndex, boundsHitDistance )
			|| boundsHitDistance > triangleDistance
		) {

			continue;

		}

		uvec2 boundsInfo = uTexelFetch1D( bvh_bvhContents, currNodeIndex ).xy;
		bool isLeaf = bool( boundsInfo.x & 0xffff0000u );

		if ( isLeaf ) {

			uint count = boundsInfo.x & 0x0000ffffu;
			uint offset = boundsInfo.y;

			found = intersectTriangles(
				bvh_position, bvh_index, offset, count,
				rayOrigin, rayDirection, triangleDistance,
				faceIndices, faceNormal, barycoord, side, dist
			) || found;

		} else {

			uint leftIndex = currNodeIndex + 1u;
			uint splitAxis = boundsInfo.x & 0x0000ffffu;
			uint rightIndex = boundsInfo.y;

			bool leftToRight = rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			ptr ++;
			stack[ ptr ] = c2;

			ptr ++;
			stack[ ptr ] = c1;

		}

	}

	return found;

}
`;var Hn=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;var mr=`
	${Oe}
	${He}
`;export{Ve as a,fe as b,ue as c,Vn as d,ke as e};
