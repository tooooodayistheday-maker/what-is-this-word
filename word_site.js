'use strict';
(() => {
 const cards=[...document.querySelectorAll('#archive > article')];
 if(!cards.length)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const query=document.querySelector('#search'),buttons=[...document.querySelectorAll('[data-filter]')];
 const count=document.querySelector('#count'),empty=document.querySelector('#empty');
 const track=(event,params={})=>{if(typeof gtag==='function')gtag('event',event,{...params,send_to:'G-7MSJNH4L4Q'})};
 const meta=card=>({term_id:card.id,term_title:card.querySelector('h2').textContent.trim(),word_category:card.dataset.category});
 const indexed=cards.map(card=>({card,text:card.textContent.toLocaleLowerCase()}));
 let category='all',searchTimer,filterAnimation; 
 document.querySelector('.index-tools').hidden=false;
 function filter(){
  const words=query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let shown=0;
  indexed.forEach(({card,text})=>{
   card.hidden=(category!=='all'&&category!==card.dataset.category)||!words.every(word=>text.includes(word));
   if(!card.hidden)shown++;
  });
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(category===button.dataset.filter)));
  count.textContent='共 '+shown+' 則';empty.hidden=shown>0;
  filterAnimation?.cancel();filterAnimation=animate(document.querySelector('#archive'),[{opacity:.45},{opacity:1}],{duration:180});
  return shown;
 }
 function reset(){query.value='';category='all';filter()}
 buttons.forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.filter===category)return;
  clearTimeout(searchTimer);category=button.dataset.filter;
  track('word_category_select',{word_category:category,result_count:filter()});
 }));
 query.addEventListener('input',()=>{
  filter();clearTimeout(searchTimer);
  if(query.value.trim())searchTimer=setTimeout(()=>track('word_search',{word_category:category,result_count:cards.filter(card=>!card.hidden).length}),700);
 });
 document.querySelector('#reset-filters').addEventListener('click',()=>{reset();query.focus()});
 cards.forEach(card=>card.querySelector('details').addEventListener('toggle',event=>{
  if(event.currentTarget.open)track('word_open',meta(card));
 }));
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||!/^https:/.test(link.href))return;
  const card=link.closest('article'),host=new URL(link.href).hostname;
  if(card)track(host==='www.threads.com'?'word_threads_click':'word_source_click',{...meta(card),link_domain:host});
  else if(link.classList.contains('threads-profile'))track('word_threads_profile_click',{link_domain:host});
 });
 function openAnchor(){
  const card=cards.find(card=>'#'+card.id===location.hash);
  if(!card)return;
  if(card.hidden)reset();
  card.querySelector('details').open=true;
  requestAnimationFrame(()=>card.scrollIntoView({block:'start',behavior:'instant'}));
 }
 addEventListener('hashchange',openAnchor);
 openAnchor();

 const pick=document.querySelector('.home-recommendation'),pickLink=document.querySelector('#recommend-read');
 let recommended=null,pendingPick=null,pickVersion=0,pickAnimations=[];
 const pickContent=pick.querySelector('.recommend-content');
 function choose(){const pool=cards.filter(card=>card!==(pendingPick||recommended));return pool[Math.floor(Math.random()*pool.length)]||cards[0]}
 function renderPick(card){
  recommended=card;
  const paras=[...card.querySelectorAll('details section:first-of-type p')];
  const lead=paras.find(p=>p.textContent.trim().length>25)||paras[0];
  document.querySelector('#recommend-number').textContent=card.querySelector('.term-number').textContent;
  document.querySelector('#recommend-category').textContent=card.querySelector('.term-category').textContent;
  document.querySelector('#recommend-title').textContent=card.querySelector('h2').textContent;
  document.querySelector('#recommend-text').textContent=lead?.textContent||'打開筆記，一起認識這個詞。';
  pickLink.setAttribute('href','#'+card.id);
  document.querySelector('#slip-title').textContent=card.querySelector('h2').textContent;
 }
 async function recommend(withMotion=true){
  const target=choose(),token=++pickVersion;pendingPick=target;
  const from=pick.getBoundingClientRect().height;
  pickAnimations.forEach(a=>a?.cancel());pickAnimations=[];pick.style.height='';
  if(!withMotion||motion.matches){renderPick(target);pendingPick=null;return}
  const out=animate(pickContent,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:160,fill:'forwards'});
  pickAnimations.push(out);
  await out?.finished.catch(()=>{});
  if(token!==pickVersion)return;
  renderPick(target);pendingPick=null;
  const to=pick.getBoundingClientRect().height;
  out?.cancel();
  const height=animate(pick,[{height:from+'px'},{height:to+'px'}],{duration:260});
  const arrival=animate(pickContent,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:260});
  pickAnimations=[height,arrival];
  await Promise.all(pickAnimations.filter(Boolean).map(a=>a.finished.catch(()=>{})));
  if(token===pickVersion){pickAnimations=[];pick.style.height=''}
 }
 recommend(false);
 document.querySelector('#recommend-another').hidden=false;
 document.querySelector('#recommend-another').addEventListener('click',()=>{recommend();track('word_recommendation_change',meta(pendingPick||recommended))});
 document.querySelector('.nav-random').addEventListener('click',()=>{recommend();track('word_recommendation_change',meta(pendingPick||recommended))});
 motion.addEventListener('change',()=>{
  if(!motion.matches)return;
  ++pickVersion;pickAnimations.forEach(a=>a?.cancel());pickAnimations=[];pick.style.height='';
  if(pendingPick){renderPick(pendingPick);pendingPick=null}
 });

 const reader=document.querySelector('.reader'),copy=reader.querySelector('.reader-copy'),art=reader.querySelector('.reader-art');
 const prev=reader.querySelector('#reader-prev'),next=reader.querySelector('#reader-next'),close=reader.querySelector('#reader-close');
 let active=null,beat=0,turning=false,version=0,returnFocus=null,oldOverflow='',running=[],closing=false,dialogAnimation=null;
 const files=['reading-book-v2.png','reading-door-v2.png','reading-lens-v2.png'];
 function animate(el,frames,opts={}){
  if(motion.matches||!el?.animate)return null;
  const a=el.animate(frames,{duration:440,easing:'cubic-bezier(.22,1,.36,1)',...opts});
  return a;
 }
 function stopScene(){running.forEach(a=>a?.cancel());running=[]}
 function scene(direction=1){
  stopScene();
  copy.replaceChildren();
  const title=document.createElement('h2');title.id='reader-title';title.textContent=active.querySelector('h2').textContent;title.tabIndex=-1;copy.append(title);
  const sections=active.querySelectorAll('details section');
  copy.append(sections[beat].cloneNode(true));
  if(beat===2){
   const a=document.createElement('a');a.href='#'+active.id;a.className='source-return';a.textContent='回到筆記與資料來源 ↗';
   a.addEventListener('click',async()=>{const card=active;await exit();card.querySelector('details').open=true;requestAnimationFrame(()=>card.querySelector('details section:last-of-type').scrollIntoView({block:'center'}))});
   copy.append(a);
  }
  art.replaceChildren();
  const img=document.createElement('img');img.src='./assets/'+files[beat];img.alt='';img.width=1024;img.height=1024;art.append(img);
  reader.querySelector('#reader-label').textContent=active.querySelector('.term-number').textContent+' / '+active.querySelector('.term-category').textContent;
  reader.querySelector('#reader-position').textContent=(beat+1)+' / 3';
  reader.querySelector('.reader-progress span').style.transform='scaleX('+((beat+1)/3)+')';
  prev.disabled=beat===0;next.disabled=beat===2;
  const shift=matchMedia('(max-width:700px)').matches?20:42;
  running.push(animate(copy,[{opacity:0,transform:'translateX('+(direction*shift)+'px)'},{opacity:1,transform:'none'}],{duration:260}));
  running.push(animate(img,[{opacity:0,transform:'translateX('+(direction*shift)+'px)'},{opacity:1,transform:'none'}],{duration:260}));
  reader.scrollTop=0;
 }
 function enter(card,trigger){
  if(typeof reader.showModal!=='function'){location.hash=card.id;return}
  active=card;beat=0;turning=false;closing=false;version++;returnFocus=trigger;oldOverflow=document.body.style.overflow;
  scene();reader.showModal();document.body.style.overflow='hidden';close.focus();
  dialogAnimation?.cancel();dialogAnimation=animate(reader,[{opacity:0,translate:'0 15px'},{opacity:1,translate:'0 0'}],{duration:200});
  track('word_reader_open',meta(card));
 }
 async function exit(){
  if(closing||!reader.open)return;
  closing=true;const token=++version;turning=false;stopScene();dialogAnimation?.cancel();
  dialogAnimation=animate(reader,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 10px'}],{duration:160});
  await dialogAnimation?.finished.catch(()=>{});
  if(token!==version)return;
  reader.close();document.body.style.overflow=oldOverflow;closing=false;
  returnFocus?.focus({preventScroll:true});
 }
 async function turn(delta){
  const target=beat+delta;if(!reader.open||closing||turning||target<0||target>2)return;
  turning=true;const token=++version;
  try{
   const a=animate(copy,[{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-delta*35)+'px)'}],{duration:180});
   const b=animate(art,[{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-delta*65)+'px) rotate('+(-delta*6)+'deg)'}],{duration:180});
   running.push(a,b);
   await Promise.all([a,b].filter(Boolean).map(x=>x.finished.catch(()=>{})));
   if(!reader.open||token!==version)return;
   beat=target;scene(delta);copy.querySelector('h2').focus({preventScroll:true});
   await Promise.all(running.filter(Boolean).map(x=>x.finished.catch(()=>{})));
  }finally{if(token===version)turning=false}
 }
 cards.forEach(card=>{
  const b=document.createElement('button');b.type='button';b.className='read-film';b.textContent='用三幕翻讀 →';card.append(b);
  b.addEventListener('click',()=>enter(card,b));
 });
 pickLink.addEventListener('click',event=>{if(typeof reader.showModal==='function'){event.preventDefault();enter(recommended,pickLink)}});
 document.querySelector('.start-reading').addEventListener('click',event=>{if(typeof reader.showModal==='function'){event.preventDefault();enter(recommended,event.currentTarget)}});
 prev.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));close.addEventListener('click',exit);
 reader.addEventListener('cancel',event=>{event.preventDefault();exit()});
 reader.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'){event.preventDefault();turn(1)}
  if(event.key==='ArrowLeft'){event.preventDefault();turn(-1)}
 });
 let touch=null;
 art.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
 art.addEventListener('touchend',e=>{
  if(!touch)return;const dx=touch.x-e.changedTouches[0].clientX,dy=touch.y-e.changedTouches[0].clientY;touch=null;
  if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx>0?1:-1);
 },{passive:true});

 // Distinct title lines and objects arrive in under 1.2 seconds; controls stay live.
 const entrance=[];
 if(!location.hash&&!motion.matches){
  document.querySelectorAll('h1 > span').forEach((line,i)=>entrance.push(animate(line,[{opacity:0,translate:'0 24px'},{opacity:1,translate:'0 0'}],{duration:480,delay:i*100,fill:'backwards'})));
  entrance.push(animate(document.querySelector('.question'),[{opacity:0,transform:'rotate(-14deg) translateY(10px)'},{opacity:1,transform:'rotate(0deg) translateY(0)'}],{duration:400,delay:260,fill:'backwards'}));
  [['.book',180],['.door',300],['.lens',420]].forEach(([selector,delay])=>entrance.push(animate(document.querySelector('.room-props '+selector),[{opacity:0,translate:'0 24px'},{opacity:1,translate:'0 0'}],{duration:600,delay,fill:'backwards'})));
 }
 // One finite paper turn: curled outer edge, moving crease, soft landing.
 const bookSurface=document.querySelector('.book-surface');
 const paper=bookSurface?.querySelector('.turning-page');
 let pageTimer=0,pageBusy=false,pageAnimations=[];
 function restPage(){pageAnimations.forEach(a=>a?.cancel());pageAnimations=[];pageBusy=false}
 function flipPage(){
  if(!paper||motion.matches||pageBusy)return;
  pageBusy=true;
  const frames=[0,.2,.5,.8,1].map(u=>{
   const x=1430-1220*u,lift=Math.sin(Math.PI*u),top=140-135*lift;
   const d=`M750 285 C${930-250*u} ${140-125*lift} ${x-110} ${top+50} ${x-195} ${top} C${x-135} ${330-150*lift} ${x+45} ${420-190*lift} ${x} ${415-155*lift} C${x-45} ${610-80*lift} ${1060-650*u} ${460-120*lift} 808 750 C790 580 775 400 750 285 Z`;
   return {d:'path("'+d+'")',offset:u};
  });
  pageAnimations=[...paper.querySelectorAll('path')].map(path=>animate(path,frames,{duration:1850}));
  const visibility=animate(paper,[{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.88},{opacity:0}],{duration:1850});
  pageAnimations.push(visibility);
  visibility?.finished.then(()=>{pageBusy=false;pageAnimations=[]}).catch(()=>{});
 }
 bookSurface?.addEventListener('pointerenter',flipPage);
 // Mobile gets the same finite entrance turn, without requiring hover.
 if(!location.hash&&!motion.matches)pageTimer=setTimeout(flipPage,1100);
 motion.addEventListener('change',()=>{if(motion.matches){clearTimeout(pageTimer);restPage()}});

 // Scroll narrative: fixed frame + independent clipped leaf, a note and doorway light.
 const room=document.querySelector('.room'),leaf=document.querySelector('.door-leaf'),lens=document.querySelector('.room-props .lens');
 const slip=document.querySelector('.word-slip'),glow=document.querySelector('.door-glow');
 const layers=[...document.querySelectorAll('[data-parallax]')];
 const small=matchMedia('(max-width:700px)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 let lensAnimation=null,roomHeight=room.offsetHeight,roomWidth=room.offsetWidth,raf=0,mx=0,my=0,inside=false,visible=true;
 function magnify(){
  if(motion.matches||lensAnimation?.playState==='running')return;
  lensAnimation=animate(lens,[{transform:'rotate(-18deg) scale(1)'},{transform:'rotate(-9deg) scale(1.13)',offset:.5},{transform:'rotate(-18deg) scale(1)'}],{duration:1100});
 }
 document.querySelector('.lens-wrap')?.addEventListener('pointerenter',()=>{if(fine.matches)magnify()});
 const lensTimer=!location.hash&&!motion.matches?setTimeout(magnify,1700):0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function paint(){
  raf=0;if(document.hidden||!visible)return;
  const y=Math.max(0,window.scrollY),mobile=small.matches;
  const progress=clamp((y-roomHeight*(mobile ? 0.1 : 0.12))/Math.min(520,roomHeight*.62));
  const eased=progress*progress*(3-2*progress),amount=motion.matches?0:eased;
  layers.forEach(el=>{
   const amplitude=el.classList.contains('lens-wrap')?16:el.classList.contains('door-wrap')?8:el.classList.contains('book-wrap')?4:0;
   const px=motion.matches||!fine.matches?0:mx*amplitude;
   const py=motion.matches||!fine.matches?0:my*amplitude;
   el.style.transform=motion.matches?'':`translate3d(${px}px,${-Math.min(y,roomHeight)*Number(el.dataset.parallax)*(mobile ? 0.2 : 1)+py}px,0)`;
  });
  // Opening is driven only by bounded scroll progress, so scrolling up reverses it.
  leaf.style.transform=motion.matches?'':`scaleX(${-2.15+3.15*eased}) skewY(${-5*(1-eased)}deg)`;
  glow.style.opacity=motion.matches?'0':String(.6*eased);
  const release=clamp((amount-.18)/.7);
  slip.style.opacity=motion.matches?'0':String(clamp(release*3)*(1-clamp((progress-.88)/.12)));
  slip.style.transform=`translate3d(${-28*release}px,${(mobile?75:160)*release}px,0) rotate(${-12*release}deg) scale(${.65+.35*release})`;
 }
 function requestPaint(){if(!raf&&!document.hidden&&visible)raf=requestAnimationFrame(paint)}
 room.addEventListener('pointermove',event=>{
  if(!fine.matches||motion.matches||!inside||!visible||document.hidden)return;
  mx=(event.clientX/roomWidth-.5)*2;my=((event.clientY+scrollY)/roomHeight-.5)*2;requestPaint();
 },{passive:true});
 room.addEventListener('pointerenter',()=>{inside=true});
 room.addEventListener('pointerleave',()=>{inside=false;mx=0;my=0;requestPaint()});
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(visible)requestPaint();else{cancelAnimationFrame(raf);raf=0;mx=my=0;clearTimeout(pageTimer);clearTimeout(lensTimer);restPage();lensAnimation?.cancel()}
 }):null;
 observer?.observe(room);
 addEventListener('scroll',requestPaint,{passive:true});
 addEventListener('resize',()=>{roomHeight=room.offsetHeight;roomWidth=room.offsetWidth;requestPaint()},{passive:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(raf);raf=0;mx=my=0;clearTimeout(pageTimer);clearTimeout(lensTimer);restPage();lensAnimation?.cancel();entrance.forEach(a=>a?.cancel())}
  else requestPaint();
 });
 motion.addEventListener('change',()=>{
  if(motion.matches){stopScene();restPage();filterAnimation?.cancel();dialogAnimation?.cancel();entrance.forEach(a=>a?.cancel());clearTimeout(lensTimer);lensAnimation?.cancel()}
  requestPaint();
 });
 requestPaint();
})();
