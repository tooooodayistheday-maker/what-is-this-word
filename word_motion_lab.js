/* Two original Canvas studies for the reading room. Palette: existing site tokens. */
(function () {
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
 class TagWorld {
  constructor(w,h,labels,measure){this.w=w;this.h=h;this.labels=labels;this.measure=measure;this.time=0;this.drag=null;this.bodies=[];this.reset()}
  reset(){
   this.time=0;this.drag=null;
   this.bodies=this.labels.map((text,i)=>{
    const r=17,width=Math.min(this.w-24,Math.max(68,this.measure(text)+32)),count=Math.min(9,Math.max(3,Math.ceil((width-2*r)/19)+1));
    const length=width-2*r,angle=Math.sin(i*2.31)*.7,cx=22+width/2+(this.w-width-44)*((i*.6180339)%1),cy=-35-(i%3)*30;
    const particles=Array.from({length:count},(_,j)=>{const d=(j/(count-1)-.5)*length;const x=cx+Math.cos(angle)*d,y=cy+Math.sin(angle)*d;return{x,y,px:x-.2*Math.cos(i),py:y,r}});
    const constraints=[];for(let a=0;a<count;a++)for(let b=a+1;b<count;b++)constraints.push([a,b,length*(b-a)/(count-1)]);
    return{text,width,r,particles,constraints,release:i*.17,style:i%3};
   });
  }
  resize(w,h){const sx=w/this.w,sy=h/this.h;this.w=w;this.h=h;for(const b of this.bodies)for(const p of b.particles){p.x*=sx;p.px*=sx;p.y*=sy;p.py*=sy}}
  hit(x,y){for(let i=this.bodies.length-1;i>=0;i--){const b=this.bodies[i];if(this.time<b.release)continue;for(const p of b.particles)if(Math.hypot(p.x-x,p.y-y)<p.r+6)return b}return null}
  grab(b,x,y){let point=b.particles.reduce((a,p)=>Math.hypot(p.x-x,p.y-y)<Math.hypot(a.x-x,a.y-y)?p:a);this.drag={b,point,x,y,ox:point.x-x,oy:point.y-y};return this.drag}
  move(x,y){if(this.drag){this.drag.x=x;this.drag.y=y}}
  release(vx=0,vy=0){if(!this.drag)return;const b=this.drag.b;this.drag=null;for(const p of b.particles){p.px=p.x-clamp(vx,-1000,1000)/120;p.py=p.y-clamp(vy,-1000,1000)/120}}
  impulse(x,y,body=null,power=1){for(const b of this.bodies){if(body&&body!==b)continue;if(this.time<b.release)continue;for(const p of b.particles){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(!body&&d>210)continue;const f=body?1:Math.max(0,1-d/210);p.px-=clamp(dx/Math.max(d,24)*4*power*f,-8,8);p.py+=((body?3.3:5.5)*power*f)}}}
  settle(){this.time=10;for(let i=0;i<1200;i++)this.step();}
  step(){
   this.time+=1/120;const pinned=this.drag?.point;
   for(const b of this.bodies){if(this.time<b.release)continue;for(const p of b.particles){if(p===pinned)continue;const vx=clamp((p.x-p.px)*.994,-12,12),vy=clamp((p.y-p.py)*.994,-12,12);p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+.12}}
   for(let iteration=0;iteration<5;iteration++){
    if(this.drag){const d=this.drag;d.point.x=d.x+d.ox;d.point.y=d.y+d.oy;d.point.px=d.point.x;d.point.py=d.point.y}
    for(const b of this.bodies){if(this.time<b.release)continue;for(const [ai,bi,rest] of b.constraints){const a=b.particles[ai],c=b.particles[bi],dx=c.x-a.x,dy=c.y-a.y,dist=Math.hypot(dx,dy)||.001;const wa=a===pinned?0:1,wb=c===pinned?0:1,sum=wa+wb;if(!sum)continue;const f=(dist-rest)/dist/sum;a.x+=dx*f*wa;a.y+=dy*f*wa;c.x-=dx*f*wb;c.y-=dy*f*wb}}
    for(let ai=0;ai<this.bodies.length;ai++){const a=this.bodies[ai];if(this.time<a.release)continue;for(let bi=ai+1;bi<this.bodies.length;bi++){const b=this.bodies[bi];if(this.time<b.release)continue;for(const p of a.particles)for(const q of b.particles){let dx=q.x-p.x,dy=q.y-p.y,d2=dx*dx+dy*dy,min=p.r+q.r;if(d2>=min*min)continue;if(d2<.00001){dx=.01;dy=.01;d2=.0002}const dist=Math.sqrt(d2),wa=p===pinned?0:1,wb=q===pinned?0:1,sum=wa+wb;if(!sum)continue;const f=(min-dist)/dist/sum*.92;p.x-=dx*f*wa;p.y-=dy*f*wa;q.x+=dx*f*wb;q.y+=dy*f*wb}}}
    for(const b of this.bodies){if(this.time<b.release)continue;for(const p of b.particles){if(p===pinned)continue;const vx=p.x-p.px,vy=p.y-p.py;if(p.y>this.h-p.r){p.y=this.h-p.r;p.py=p.y+Math.max(0,vy)*.18;p.px=p.x-vx*.72}if(p.x<p.r){p.x=p.r;p.px=p.x+Math.abs(vx)*.35}if(p.x>this.w-p.r){p.x=this.w-p.r;p.px=p.x-Math.abs(vx)*.35}if(p.y< -this.h*1.2){p.y=-this.h*1.2;p.py=p.y}}}
   }
  }
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={TagWorld,paperProgress,isTap};
 if(typeof document==='undefined')return;
 const root=document.querySelector('#word-motion-lab');if(!root)return;
 const paper=document.querySelector('#paper-canvas'),tags=root.querySelector('#tag-canvas');
 const pc=paper.getContext('2d'),tc=tags.getContext('2d');if(!pc||!tc)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),css=getComputedStyle(document.documentElement);
 const colors=Object.fromEntries(['brand','paper','accent','section','ink','muted'].map(k=>[k,css.getPropertyValue('--color-'+k).trim()]));
 const terms=window.WordNotes.terms;
 const font='"Noto Sans TC","Microsoft JhengHei",sans-serif';
 const texture=document.createElement('canvas');texture.width=640;texture.height=820;const tx=texture.getContext('2d');
 let W=0,H=0,TW=0,TH=0,dpr=1,world,frame=0,previous=0,paperTime=0,accumulator=0,idleTime=0,visible=false,paused=reduced.matches,readerOpen=false,currentTitle='',phase='',samples=[],fpsStart=0,fpsFrames=0,paperFlat=false;
 const pauseButton=root.querySelector('#lab-pause'),replay=root.querySelector('#paper-replay'),tagReset=root.querySelector('#tag-reset'),form=root.querySelector('#tag-form'),input=root.querySelector('#tag-text'),status=root.querySelector('#tag-status'),target=root.querySelector('#tag-target');
 const splitLines=(ctx,text,width)=>{const lines=[];let line='';for(const ch of text){if(ctx.measureText(line+ch).width>width&&line){lines.push(line);line=ch}else line+=ch}if(line)lines.push(line);return lines};
 function poster(){
  const term=window.WordNotes.getSelected(),title=window.WordNotes.getState()==='closed'?term.scenario:term.title;currentTitle=title;
  tx.fillStyle=colors.paper;tx.fillRect(0,0,640,820);tx.strokeStyle=colors.brand;tx.lineWidth=2;tx.strokeRect(30,30,580,760);
  tx.fillStyle=colors.brand;tx.font='700 22px '+font;tx.fillText('這個詞，是什麼？',56,88);
  tx.fillRect(56,118,528,2);tx.fillStyle=colors.muted;tx.font='22px '+font;tx.fillText('攤開日常，發現名字',56,167);
  tx.fillStyle=colors.brand;const size=title.length<=8?Math.min(86,Math.floor(500/Math.max(1,title.length))):(title.length>16?40:66);tx.font='900 '+size+'px '+font;const lines=splitLines(tx,title,510);if(lines.length>1&&[...lines.at(-1)].length===1){const previous=[...lines[lines.length-2]];lines[lines.length-1]=previous.pop()+lines.at(-1);lines[lines.length-2]=previous.join('')}lines.forEach((line,i)=>tx.fillText(line,56,300+i*(size+23)));
  tx.fillStyle=colors.accent;tx.beginPath();tx.arc(535,640,39,0,Math.PI*2);tx.fill();tx.fillStyle=colors.brand;tx.font='900 60px '+font;tx.fillText('？',500,662);
  tx.font='27px '+font;tx.fillText('有些日常，',56,665);tx.fillText('原來早就有名字。',56,710);tx.font='18px '+font;tx.fillText('翻讀這個詞 →',56,765);
  // Permanent subtle fold highlights belong to the paper, not the text layout.
  tx.strokeStyle=colors.brand;tx.globalAlpha=.055;tx.lineWidth=2;for(const [x,y] of [[170,215],[440,535],[300,740]]){tx.beginPath();tx.moveTo(x-80,0);tx.lineTo(x,y);tx.lineTo(640,x+150);tx.stroke()}tx.globalAlpha=1;
 }
 const cols=18,rows=24,mesh=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)mesh.push({u:x/cols,v:y/rows});
 const triangles=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;if((x+y)%2)triangles.push([a,b,c],[b,d,c]);else triangles.push([a,b,d],[a,d,c])}
 function paperProgress(t){return [.62+.38*smooth(t/1.15),'攤開日常']}
 function isTap(distance,ms,cancelled=false){return !cancelled&&distance<=8&&ms<=500}
 function drawPaper(){
  pc.setTransform(dpr,0,0,dpr,0,0);pc.clearRect(0,0,W,H);const [progress,state]=[paperTime,'攤開日常'];
  if(state!==phase){phase=state;paper.dataset.phase=state;paper.dataset.progress=String(progress)}
  const p=clamp(progress,0,1.025),fold=clamp(1-p),fh=Math.min(H*.76,W*1.12),fw=fh*640/820,cx=W/2,cy=H*.44;
  const shadowW=fw*(.23+.33*clamp(p)),shadowH=9+10*clamp(p);pc.save();pc.translate(cx,H*.87);pc.scale(shadowW,shadowH);const shade=pc.createRadialGradient(0,0,0,0,0,1);shade.addColorStop(0,colors.brand+'32');shade.addColorStop(1,colors.brand+'00');pc.fillStyle=shade;pc.beginPath();pc.arc(0,0,1,0,Math.PI*2);pc.fill();pc.restore();
  if(Math.abs(progress-1)<.001){pc.drawImage(texture,cx-fw/2,cy-fh/2,fw,fh);return}
  // Integrate shared crease angles instead of pulling a sphere into a rectangle.
  // Adjacent vertices remain on one continuous sheet throughout the unfolding.
  function crease(count,length,strength,offset){const positions=[0],depth=[0];for(let i=1;i<=count;i++){const t=(i-.5)/count,edge=Math.abs(t-.5)*2,amount=fold*(.86+.14*edge),angle=amount*strength*(Math.sin(t*Math.PI*4+offset)+.12*Math.sin(t*Math.PI*8+1.1));positions.push(positions[i-1]+Math.cos(angle)*length/count);depth.push(depth[i-1]+Math.sin(angle)*length/count)}const mx=positions.reduce((a,b)=>a+b,0)/(count+1),mz=depth.reduce((a,b)=>a+b,0)/(count+1);return{positions:positions.map(v=>v-mx),depth:depth.map(v=>v-mz)}}
  const horizontal=crease(cols,fw,2.28,.35),vertical=crease(rows,fh,2.2,1.0);
  const az=fold*(paperTime*.2+.35),ax=fold*.42,ay=fold*.7,cz=Math.cos(az),sz=Math.sin(az),ca=Math.cos(ax),sa=Math.sin(ax),cb=Math.cos(ay),sb=Math.sin(ay);
  const vertices=mesh.map(({u,v},index)=>{
   const ix=index%(cols+1),iy=Math.floor(index/(cols+1)),wrinkle=Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
   let x=horizontal.positions[ix]*Math.max(1,p),y=vertical.positions[iy]*Math.max(1,p),z=horizontal.depth[ix]+vertical.depth[iy]+fold*wrinkle*fw*.012*Math.sin(u*25+v*19)+(1-fold)*.8*Math.sin(u*19+v*7);
   const yy=y*ca-z*sa;z=y*sa+z*ca;y=yy;const xx=x*cb+z*sb;z=-x*sb+z*cb;x=xx;const rx=x*cz-y*sz;y=x*sz+y*cz;x=rx;
   const perspective=850/(850-z);return{x:cx+x*perspective,y:cy+y*perspective,z,u:u*640,v:v*820};
  });
  const faces=triangles.map(ids=>{const a=vertices[ids[0]],b=vertices[ids[1]],c=vertices[ids[2]];return{a,b,c,z:(a.z+b.z+c.z)/3}}).sort((a,b)=>a.z-b.z);
  for(const {a,b,c} of faces){
   const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1,front=nz>0;
   if(Math.abs(nz)<.02)continue;const center={x:(a.x+b.x+c.x)/3,y:(a.y+b.y+c.y)/3};
   pc.save();pc.beginPath();for(const [i,q] of [a,b,c].entries()){const x=center.x+(q.x-center.x)*1.007,y=center.y+(q.y-center.y)*1.007;i?pc.lineTo(x,y):pc.moveTo(x,y)}pc.closePath();pc.clip();
   if(front){const den=(b.u-a.u)*(c.v-a.v)-(c.u-a.u)*(b.v-a.v),aa=((b.x-a.x)*(c.v-a.v)-(c.x-a.x)*(b.v-a.v))/den,cc=((c.x-a.x)*(b.u-a.u)-(b.x-a.x)*(c.u-a.u))/den,bb=((b.y-a.y)*(c.v-a.v)-(c.y-a.y)*(b.v-a.v))/den,dd=((c.y-a.y)*(b.u-a.u)-(b.y-a.y)*(c.u-a.u))/den;
    pc.setTransform(dpr*aa,dpr*bb,dpr*cc,dpr*dd,dpr*(a.x-aa*a.u-cc*a.v),dpr*(a.y-bb*a.u-dd*a.v));const sx=Math.max(0,Math.min(a.u,b.u,c.u)-1),sy=Math.max(0,Math.min(a.v,b.v,c.v)-1),sw=Math.min(640-sx,Math.max(a.u,b.u,c.u)-sx+1),sh=Math.min(820-sy,Math.max(a.v,b.v,c.v)-sy+1);pc.drawImage(texture,sx,sy,sw,sh,sx,sy,sw,sh);
   }else{pc.fillStyle=colors.paper;pc.fillRect(0,0,W,H)}
   pc.setTransform(dpr,0,0,dpr,0,0);const sign=front?1:-1,light=clamp((-.35*nx-.4*ny+.85*nz)*sign/len,-1,1),dark=clamp((1-light)*.3,0,.5);pc.globalAlpha=dark;pc.fillStyle=colors.brand;pc.fillRect(0,0,W,H);pc.restore();
  }
 }
 const measure=t=>{tc.font='600 16px '+font;return tc.measureText(t).width};
 function drawTags(){
  tc.setTransform(dpr,0,0,dpr,0,0);tc.clearRect(0,0,TW,TH);tc.lineWidth=1.5;tc.textAlign='center';tc.textBaseline='middle';tc.font='600 16px '+font;
  for(const b of world.bodies){if(world.time<b.release)continue;const a=b.particles[0],z=b.particles.at(-1),cx=(a.x+z.x)/2,cy=(a.y+z.y)/2,angle=Math.atan2(z.y-a.y,z.x-a.x);tc.save();tc.translate(cx,cy);tc.rotate(angle);tc.beginPath();tc.roundRect(-b.width/2,-b.r,b.width,b.r*2,b.r);tc.fillStyle=[colors.brand,colors.paper,colors.accent][b.style];tc.strokeStyle=colors.brand;tc.fill();tc.stroke();tc.fillStyle=b.style===0?colors.paper:colors.brand;tc.fillText(b.text,0,1);tc.restore()}
 }
 function choices(labels){target.replaceChildren();const links=root.querySelector('#tag-word-links');links.replaceChildren();for(const [i,text] of labels.entries()){const option=document.createElement('option');option.value=i;option.textContent=text;target.append(option);const term=terms.find(t=>t.title===text),el=document.createElement(term?'a':'span');el.textContent=text;if(term)el.href='#'+term.id;links.append(el)}}
 function buildTags(labels){if(typeof hidePopover==='function'&&world)hidePopover();world=new TagWorld(TW,TH,labels,measure);choices(labels);if(paused||reduced.matches)world.settle();idleTime=0;drawTags();status.textContent='目前 '+labels.length+' 個標籤。拖曳甩動，或點空白處震一下。'}
 function defaults(){const seen=new Set(),out=[];for(const t of terms)if(!seen.has(t.category)){seen.add(t.category);out.push(t.title)}for(const t of terms)if(out.length<12&&!out.includes(t.title))out.push(t.title);return out}
 let defaultLabels=defaults();input.value=defaultLabels.join('、');
 function resize(force=false){
  const pr=paper.parentElement.getBoundingClientRect(),tr=tags.parentElement.getBoundingClientRect(),nextDpr=Math.min(devicePixelRatio||1,1.75);
  if(force!==true&&world&&Math.abs(W-pr.width)<.5&&Math.abs(H-pr.height)<.5&&Math.abs(TW-tr.width)<.5&&Math.abs(TH-tr.height)<.5&&dpr===nextDpr)return;
  W=Math.max(1,pr.width);H=Math.max(1,pr.height);TW=Math.max(1,tr.width);TH=Math.max(1,tr.height);dpr=nextDpr;for(const [c,w,h] of [[paper,W,H],[tags,TW,TH]]){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}if(world){const labels=world.labels;buildTags(labels)}else buildTags(defaultLabels);drawPaper();drawTags();
 }
 function stop(){cancelAnimationFrame(frame);frame=0;previous=0;accumulator=0;fpsStart=0;fpsFrames=0}
 function permitted(){return visible&&!paused&&!document.hidden&&!readerOpen}
 function loop(now){frame=0;if(!permitted())return;const workStart=performance.now(),elapsed=previous?Math.max(0,(now-previous)/1000):0,delta=Math.min(.05,elapsed);previous=now;paperTime+=elapsed;accumulator+=delta;idleTime+=delta;fpsFrames++;if(!fpsStart)fpsStart=now;if(now-fpsStart>1200){root.dataset.motionFps=String(Math.round(fpsFrames*1000/(now-fpsStart)));fpsStart=now;fpsFrames=0}while(accumulator>=1/120){world.step();accumulator-=1/120}if(idleTime>6&&!world.drag){const b=world.bodies[Math.floor(Math.random()*world.bodies.length)];const p=b.particles[Math.floor(b.particles.length/2)];world.impulse(p.x,p.y+20,b,.55);idleTime=0}drawTags();root.dataset.drawMs=String(Math.round(performance.now()-workStart));frame=requestAnimationFrame(loop)}
 function start(){if(permitted()&&!frame)frame=requestAnimationFrame(loop)}
 function syncPause(){pauseButton.textContent=paused?'播放互動動畫':'暫停互動動畫';pauseButton.setAttribute('aria-pressed',String(paused));if(paused){stop();drawPaper();drawTags()}else start()}
 pauseButton.addEventListener('click',()=>{paused=!paused;syncPause()});
 let paperFrame=0,resolvePaper=null;
 function cancelPaper(){cancelAnimationFrame(paperFrame);paperFrame=0;if(resolvePaper){resolvePaper(false);resolvePaper=null}}
 function flatPaper(){cancelAnimationFrame(paperFrame);paperTime=1;drawPaper();if(resolvePaper){resolvePaper(true);resolvePaper=null}}
 window.WordPaper={reset(){cancelPaper();paperTime=.62;poster();drawPaper()},reveal(){cancelPaper();poster();if(reduced.matches){paperTime=1;drawPaper();return Promise.resolve(true)}return new Promise(resolve=>{resolvePaper=resolve;const start=performance.now();function tick(now){paperTime=paperProgress((now-start)/1000)[0];drawPaper();if(now-start>=1150){flatPaper();return}paperFrame=requestAnimationFrame(tick)}paperFrame=requestAnimationFrame(tick)})}};
 tagReset.addEventListener('click',()=>{world.reset();if(paused)world.settle();idleTime=0;drawTags();start()});
 root.querySelector('#tag-nudge').addEventListener('click',()=>{const b=world.bodies[Number(target.value)||0],p=b.particles[Math.floor(b.particles.length/2)];world.impulse(p.x,p.y+28,b);if(paused){for(let i=0;i<45;i++)world.step();drawTags()}else start()});
 form.addEventListener('submit',e=>{e.preventDefault();const labels=input.value.split('、').map(t=>t.trim()).filter(Boolean);if(!labels.length||labels.length>16||labels.some(t=>[...t].length>12)){status.textContent='請輸入1–16個標籤，以頓號「、」分隔，每個最多12字。';input.setAttribute('aria-invalid','true');input.focus();return}input.removeAttribute('aria-invalid');buildTags(labels);start()});
 function point(e){const b=tags.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top,t:performance.now()}}
 const pop=root.querySelector('#tag-popover'),popRead=root.querySelector('#tag-popover-read');let gesture=null;
 function hidePopover(){pop.hidden=true}
 function showPopover(b,focus=false){const term=terms.find(t=>t.title===b.text);if(!term){hidePopover();status.textContent='這個自訂標籤尚無站內文章，仍然可以拖曳。';return}root.querySelector('#tag-popover-title').textContent=term.title;root.querySelector('#tag-popover-scenario').textContent=term.scenario;popRead.href='#'+term.id;popRead.dataset.termId=term.id;pop.hidden=false;const a=b.particles[0],z=b.particles.at(-1),r=tags.getBoundingClientRect(),pr=pop.getBoundingClientRect();const x=(a.x+z.x)/2,y=(a.y+z.y)/2;pop.style.left=clamp(x-pr.width/2,8,Math.max(8,TW-pr.width-8))+'px';const low=Math.max(8,-r.top+8),high=Math.min(TH-pr.height-8,innerHeight-r.top-pr.height-8);pop.style.top=clamp(y-pr.height-30,low,Math.max(low,high))+'px';if(focus)popRead.focus({preventScroll:true})}
 root.querySelector('#tag-popover-close').addEventListener('click',()=>{hidePopover();target.focus({preventScroll:true})});pop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();hidePopover();target.focus()}});
 popRead.addEventListener('click',e=>{e.preventDefault();window.WordNotes.open(popRead.dataset.termId,popRead)});
 const inspect=document.createElement('button');inspect.type='button';inspect.textContent='看這個詞 →';root.querySelector('.tag-keyboard').append(inspect);inspect.addEventListener('click',()=>showPopover(world.bodies[Number(target.value)||0],true));
 tags.addEventListener('pointerdown',e=>{if(e.button!==0||gesture)return;const p=point(e),b=world.hit(p.x,p.y);hidePopover();tags.setPointerCapture(e.pointerId);idleTime=0;samples=[p];gesture={id:e.pointerId,b,start:p,distance:0};if(b){world.grab(b,p.x,p.y);tags.classList.add('is-grabbing')}else{world.impulse(p.x,p.y);if(paused){for(let i=0;i<40;i++)world.step();drawTags()}}});
 tags.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const p=point(e);gesture.distance=Math.max(gesture.distance,Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y));if(!world.drag)return;world.move(p.x,p.y);samples.push(p);samples=samples.filter(s=>p.t-s.t<110);if(paused){for(let i=0;i<4;i++)world.step();drawTags()}});
 function release(e,cancelled=false){if(!gesture||gesture.id!==e.pointerId)return;const g=gesture,p=point(e),first=samples[0]||p,ms=Math.max(16,p.t-first.t);gesture=null;world.release((p.x-first.x)*1000/ms,(p.y-first.y)*1000/ms);if(tags.hasPointerCapture(e.pointerId))tags.releasePointerCapture(e.pointerId);tags.classList.remove('is-grabbing');if(paused){world.settle();drawTags()}if(g.b&&isTap(Math.max(g.distance,Math.hypot(p.x-g.start.x,p.y-g.start.y)),p.t-g.start.t,cancelled))showPopover(g.b);start()}
 tags.addEventListener('pointerup',e=>release(e));tags.addEventListener('pointercancel',e=>release(e,true));tags.addEventListener('lostpointercapture',()=>{gesture=null;if(world.drag)world.release();tags.classList.remove('is-grabbing')});
 document.addEventListener('word:recommended',()=>window.WordPaper.reset());
 const io=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)start();else stop()},{threshold:.05});io.observe(root);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(resolvePaper)flatPaper()}else start()});
 const dialog=document.querySelector('.reader');if(dialog)new MutationObserver(()=>{readerOpen=dialog.open;if(readerOpen)stop();else start()}).observe(dialog,{attributes:true,attributeFilter:['open']});
 reduced.addEventListener('change',()=>{paused=reduced.matches;if(reduced.matches&&resolvePaper)flatPaper();world.release();if(paused)world.settle();syncPause()});
 const resizeObserver=new ResizeObserver(()=>resize());resizeObserver.observe(tags.parentElement);resizeObserver.observe(paper.parentElement);
 paperTime=.62;poster();resize();root.classList.add('canvas-ready');paper.parentElement.classList.add('canvas-ready');for(const el of [pauseButton,tagReset,form,root.querySelector('.tag-keyboard')])el.hidden=false;syncPause();
 document.fonts.ready.then(()=>{poster();resize(true)});
})();
