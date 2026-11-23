/* Shared capsule physics: independent entry scene and interactive reading-room pile. */
(function () {
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 class TagWorld {
  constructor(w,h,labels,measure,options={}){this.options=options;this.w=w;this.h=h;this.labels=labels;this.measure=measure;this.time=0;this.drag=null;this.bodies=[];this.reset()}
  reset(){
   this.time=0;this.drag=null;
   this.bodies=this.labels.map((text,i)=>{
    const r=this.options.radius||17,width=Math.min(this.w-24,Math.max(68,this.measure(text)+32)),count=Math.min(9,Math.max(3,Math.ceil((width-2*r)/19)+1));
    const length=width-2*r,angle=Math.sin(i*2.31)*.7,cx=width/2+22+Math.max(0,this.w-width-44)*(this.options.position?this.options.position(i,this.labels.length):(i*.6180339)%1),cy=-35-(i%3)*30;
    const particles=Array.from({length:count},(_,j)=>{const d=(j/(count-1)-.5)*length;const x=cx+Math.cos(angle)*d,y=cy+Math.sin(angle)*d;return{x,y,px:x-.2*Math.cos(i),py:y,r}});
    const constraints=[];for(let a=0;a<count;a++)for(let b=a+1;b<count;b++)constraints.push([a,b,length*(b-a)/(count-1)]);
    return{text,width,r,particles,constraints,release:this.options.release?this.options.release(i,this.labels.length):i*.08,landed:false,style:i%3};
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
    for(const b of this.bodies){if(this.time<b.release)continue;for(const p of b.particles){if(p===pinned)continue;const vx=p.x-p.px,vy=p.y-p.py;if(p.y>this.h-p.r){b.landed=true;p.y=this.h-p.r;p.py=p.y+Math.max(0,vy)*.18;p.px=p.x-vx*.72}if(p.x<p.r){p.x=p.r;p.px=p.x+Math.abs(vx)*.35}if(p.x>this.w-p.r){p.x=this.w-p.r;p.px=p.x-Math.abs(vx)*.35}if(p.y< -this.h*1.2){p.y=-this.h*1.2;p.py=p.y}}}
   }
  }
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={TagWorld,isTap,pickLabels,entryRelease};
 if(typeof document==='undefined')return;
 function isTap(distance,ms,cancelled=false){return !cancelled&&distance<=8&&ms<=500}
 function pickLabels(terms,mobile,random=Math.random){const labels=[...new Set(terms.map(t=>t.title))];for(let i=labels.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[labels[i],labels[j]]=[labels[j],labels[i]]}return labels.slice(0,mobile?12:20)}
 function entryRelease(i,n){const second=Math.ceil((n-3)/2);return i<3?i*.055:i<3+second?.23+(i-3)*.025:.46+(i-3-second)*.018}
 const root=document.querySelector('#word-motion-lab');if(!root)return;
 const tags=root.querySelector('#tag-canvas'),tc=tags.getContext('2d');if(!tc){window.WordIntro?.finish('canvas-unavailable');return}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),css=getComputedStyle(document.documentElement);
 const colors=Object.fromEntries(['brand','paper','accent','section','ink','muted'].map(k=>[k,css.getPropertyValue('--color-'+k).trim()]));
 const terms=window.WordNotes.terms,font='"Noto Sans TC","Microsoft JhengHei",sans-serif',mobile=matchMedia('(max-width:700px)');
 let TW=0,TH=0,dpr=1,world,frame=0,previous=0,accumulator=0,idleTime=0,visible=false,paused=reduced.matches,readerOpen=false,samples=[],fpsStart=0,fpsFrames=0,custom=false;
 const pauseButton=root.querySelector('#lab-pause'),tagReset=root.querySelector('#tag-reset'),form=root.querySelector('#tag-form'),input=root.querySelector('#tag-text'),status=root.querySelector('#tag-status'),target=root.querySelector('#tag-target');
 function paintPile(ctx,pile,w,h,ratio,size){ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);ctx.lineWidth=1.5;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 '+size+'px '+font;
 for(const b of pile.bodies){if(pile.time<b.release)continue;const a=b.particles[0],z=b.particles.at(-1),cx=(a.x+z.x)/2,cy=(a.y+z.y)/2,angle=Math.atan2(z.y-a.y,z.x-a.x);ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.beginPath();ctx.roundRect(-b.width/2,-b.r,b.width,b.r*2,b.r);ctx.fillStyle=[colors.brand,colors.paper,colors.accent][b.style];ctx.strokeStyle=colors.brand;ctx.fill();ctx.stroke();ctx.fillStyle=b.style===0?colors.paper:colors.brand;ctx.fillText(b.text,0,1);ctx.restore()}}
 const measure=t=>{tc.font='600 16px '+font;return tc.measureText(t).width};
 function drawTags(){paintPile(tc,world,TW,TH,dpr,16)}
 function choices(labels){target.replaceChildren();const links=root.querySelector('#tag-word-links');links.replaceChildren();for(const [i,text] of labels.entries()){const option=document.createElement('option');option.value=i;option.textContent=text;target.append(option);const term=terms.find(t=>t.title===text),el=document.createElement(term?'a':'span');el.textContent=text;if(term)el.href='#'+term.id;links.append(el)}}
 function buildTags(labels){if(typeof hidePopover==='function'&&world)hidePopover();world=new TagWorld(TW,TH,labels,measure);choices(labels);if(paused||reduced.matches)world.settle();idleTime=0;drawTags();status.textContent='目前 '+labels.length+' 個標籤。拖曳甩動，或點空白處震一下。'}
 function defaults(){return pickLabels(terms,mobile.matches)}
 let defaultLabels=defaults();input.value=defaultLabels.join('、');
 function resize(force=false){const tr=tags.parentElement.getBoundingClientRect(),nextDpr=Math.min(devicePixelRatio||1,1.75);if(force!==true&&world&&Math.abs(TW-tr.width)<.5&&Math.abs(TH-tr.height)<.5&&dpr===nextDpr)return;TW=Math.max(1,tr.width);TH=Math.max(1,tr.height);dpr=nextDpr;tags.width=Math.round(TW*dpr);tags.height=Math.round(TH*dpr);if(world)world.resize(TW,TH);else buildTags(defaultLabels);drawTags()}
 function stop(){cancelAnimationFrame(frame);frame=0;previous=0;accumulator=0;fpsStart=0;fpsFrames=0}
 function permitted(){return visible&&!paused&&!document.hidden&&!readerOpen}
 function loop(now){frame=0;if(!permitted())return;const workStart=performance.now(),elapsed=previous?Math.max(0,(now-previous)/1000):0,delta=Math.min(.05,elapsed);previous=now;accumulator+=delta;idleTime+=delta;fpsFrames++;if(!fpsStart)fpsStart=now;if(now-fpsStart>1200){root.dataset.motionFps=String(Math.round(fpsFrames*1000/(now-fpsStart)));fpsStart=now;fpsFrames=0}while(accumulator>=1/120){world.step();accumulator-=1/120}if(idleTime>6&&!world.drag){const b=world.bodies[Math.floor(Math.random()*world.bodies.length)];const p=b.particles[Math.floor(b.particles.length/2)];world.impulse(p.x,p.y+20,b,.55);idleTime=0}drawTags();root.dataset.drawMs=String(Math.round(performance.now()-workStart));frame=requestAnimationFrame(loop)}
 function start(){if(permitted()&&!frame)frame=requestAnimationFrame(loop)}
 function syncPause(){pauseButton.textContent=paused?'播放互動動畫':'暫停互動動畫';pauseButton.setAttribute('aria-pressed',String(paused));if(paused){stop();drawTags()}else start()}
 pauseButton.addEventListener('click',()=>{paused=!paused;syncPause()});
 tagReset.addEventListener('click',()=>{world.reset();if(paused)world.settle();idleTime=0;drawTags();start()});
 root.querySelector('#tag-nudge').addEventListener('click',()=>{const b=world.bodies[Number(target.value)||0],p=b.particles[Math.floor(b.particles.length/2)];world.impulse(p.x,p.y+28,b);if(paused){for(let i=0;i<45;i++)world.step();drawTags()}else start()});
 form.addEventListener('submit',e=>{e.preventDefault();const labels=input.value.split('、').map(t=>t.trim()).filter(Boolean);if(!labels.length||labels.length>20||labels.some(t=>[...t].length>12)){status.textContent='請輸入1–20個標籤，以頓號「、」分隔，每個最多12字。';input.setAttribute('aria-invalid','true');input.focus();return}input.removeAttribute('aria-invalid');custom=true;buildTags(labels);start()});
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
 const io=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)start();else stop()},{threshold:.05});io.observe(root);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()});
 const dialog=document.querySelector('.reader');if(dialog)new MutationObserver(()=>{readerOpen=dialog.open;if(readerOpen)stop();else start()}).observe(dialog,{attributes:true,attributeFilter:['open']});
 reduced.addEventListener('change',()=>{paused=reduced.matches;world.release();if(paused)world.settle();syncPause()});
 const resizeObserver=new ResizeObserver(()=>resize());resizeObserver.observe(tags.parentElement);
 resize();root.classList.add('canvas-ready');for(const el of [pauseButton,tagReset,form,root.querySelector('.tag-keyboard')])el.hidden=false;syncPause();
 document.fonts.ready.then(()=>resize(true));
 mobile.addEventListener('change',()=>{if(!custom){defaultLabels=defaults();input.value=defaultLabels.join('、');buildTags(defaultLabels);start()}});

 // The entry owns its world, clock, frame and exit; it never borrows the game loop.
 function startEntry(){
  const state=window.WordIntro;if(!state?.active)return;
  const overlay=document.querySelector('#word-entry'),canvas=document.querySelector('#entry-canvas'),ctx=canvas.getContext('2d');if(!ctx){state.finish('canvas-unavailable');return}
  const rect=overlay.getBoundingClientRect(),w=rect.width,h=rect.height,ratio=Math.min(devicePixelRatio||1,1.75),size=mobile.matches?18:25;
  canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.font='600 '+size+'px '+font;
  const labels=pickLabels(terms,mobile.matches),second=Math.ceil((labels.length-3)/2),lastStart=Math.min(labels.length-1,3+second);
  let pile=new TagWorld(w,h,labels,t=>ctx.measureText(t).width,{radius:mobile.matches?21:27,release:entryRelease,position(i,n){const batch=i<3?0:i<3+Math.ceil((n-3)/2)?1:2;return .04+.92*((batch*.31+i*.6180339)%1)}}),entryFrame=0,exitAnimation=null,exitTimer=0,ended=false,exiting=false,started=performance.now();
  overlay.dataset.count=String(labels.length);overlay.dataset.phase='falling';overlay.dataset.frames='0';let frames=0;
  const cleanup=()=>{if(ended)return;ended=true;clearTimeout(exitTimer);cancelAnimationFrame(entryFrame);entryFrame=0;exitAnimation?.cancel();pile=null;overlay.dataset.phase='done';overlay.dataset.running='false';overlay.dataset.frames=String(frames);overlay.dataset.durationMs=String(Math.round(performance.now()-started));removeEventListener('resize',onResize)};
  const onResize=()=>state.finish('resize');addEventListener('resize',onResize,{once:true});document.addEventListener('word:intro-finished',cleanup,{once:true});
  function leave(reason){if(exiting||ended)return;exiting=true;overlay.dataset.phase='leaving';overlay.dataset.exitTrigger=reason;overlay.dataset.running='false';cancelAnimationFrame(entryFrame);entryFrame=0;
   exitTimer=setTimeout(()=>state.finish('complete'),460);
   try{exitAnimation=overlay.animate([{transform:'translateY(0)'},{transform:'translateY(101%)'}],{duration:460,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'});exitAnimation.finished.then(()=>state.finish('complete'),()=>{if(state.active)state.finish('animation-cancelled')})}catch{state.finish('animation-unavailable')}
  }
  function tick(now){entryFrame=0;if(ended||!state.active)return;const elapsed=now-started;const targetTime=Math.min(2.1,elapsed/1000*1.3);
   while(pile.time<targetTime)pile.step();paintPile(ctx,pile,w,h,ratio,size);frames++;overlay.dataset.frames=String(frames);if(!overlay.dataset.firstWordMs&&pile.bodies.some(b=>pile.time>=b.release&&b.particles.some(p=>p.y+p.r>0)))overlay.dataset.firstWordMs=String(Math.round(elapsed));
   const lastBatchAtBottom=pile.bodies.slice(lastStart).some(b=>pile.time>=b.release&&b.particles.some(p=>p.y>=h-b.r*4));
   if(elapsed>=1150&&lastBatchAtBottom){leave('last-batch-contact');return}if(elapsed>=1550){leave('time-limit');return}entryFrame=requestAnimationFrame(tick)
  }
  overlay.dataset.running='true';entryFrame=requestAnimationFrame(tick);
 }
 startEntry();
})();
