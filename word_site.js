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
 let category='all',searchTimer;
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
 let recommended=null;
 function recommend(){
  const pool=cards.filter(card=>card!==recommended);
  recommended=pool[Math.floor(Math.random()*pool.length)]||cards[0];
  const paras=[...recommended.querySelectorAll('details section:first-of-type p')];
  const lead=paras.find(p=>p.textContent.trim().length>25)||paras[0];
  document.querySelector('#recommend-number').textContent=recommended.querySelector('.term-number').textContent;
  document.querySelector('#recommend-category').textContent=recommended.querySelector('.term-category').textContent;
  document.querySelector('#recommend-title').textContent=recommended.querySelector('h2').textContent;
  document.querySelector('#recommend-text').textContent=lead?.textContent||'打開筆記，一起認識這個詞。';
  pickLink.setAttribute('href','#'+recommended.id);
 }
 recommend();
 document.querySelector('#recommend-another').hidden=false;
 document.querySelector('#recommend-another').addEventListener('click',()=>{
  recommend();track('word_recommendation_change',meta(recommended));
  animate(pick,[{opacity:.5,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:280});
 });
 document.querySelector('.nav-random').addEventListener('click',()=>{recommend();track('word_recommendation_change',meta(recommended))});

 const reader=document.querySelector('.reader'),copy=reader.querySelector('.reader-copy'),art=reader.querySelector('.reader-art');
 const prev=reader.querySelector('#reader-prev'),next=reader.querySelector('#reader-next'),close=reader.querySelector('#reader-close');
 let active=null,beat=0,turning=false,version=0,returnFocus=null,oldOverflow='',running=[];
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
   a.addEventListener('click',()=>{exit();active.querySelector('details').open=true;requestAnimationFrame(()=>active.querySelector('details section:last-of-type').scrollIntoView({block:'center'}))});
   copy.append(a);
  }
  art.replaceChildren();
  const img=document.createElement('img');img.src='./assets/'+files[beat];img.alt='';img.width=1024;img.height=1024;art.append(img);
  reader.querySelector('#reader-label').textContent=active.querySelector('.term-number').textContent+' / '+active.querySelector('.term-category').textContent;
  reader.querySelector('#reader-position').textContent=(beat+1)+' / 3';
  reader.querySelector('.reader-progress span').style.width=((beat+1)/3*100)+'%';
  prev.disabled=beat===0;next.disabled=beat===2;
  copy.querySelectorAll('h2,h3,p,.source-return').forEach((el,i)=>{
   running.push(animate(el,[{opacity:0,transform:'translateY('+(direction*20)+'px)'},{opacity:1,transform:'none'}],{duration:430,delay:i*45,fill:'backwards'}));
  });
  running.push(animate(img,[{opacity:0,transform:'translateX('+(direction*75)+'px) rotate('+(direction*9)+'deg)'},{opacity:1,transform:'none'}],{duration:620}));
  reader.scrollTop=0;
 }
 function enter(card,trigger){
  if(typeof reader.showModal!=='function'){location.hash=card.id;return}
  active=card;beat=0;turning=false;version++;returnFocus=trigger;oldOverflow=document.body.style.overflow;
  scene();reader.showModal();document.body.style.overflow='hidden';close.focus();
  track('word_reader_open',meta(card));
 }
 function exit(){
  version++;turning=false;stopScene();reader.close();document.body.style.overflow=oldOverflow;
  returnFocus?.focus({preventScroll:true});
 }
 async function turn(delta){
  const target=beat+delta;if(!reader.open||turning||target<0||target>2)return;
  turning=true;const token=++version;
  try{
   const a=animate(copy,[{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-delta*35)+'px)'}],{duration:180});
   const b=animate(art,[{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-delta*65)+'px) rotate('+(-delta*6)+'deg)'}],{duration:230});
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

 // Finite entrance, under 1.2s; no hidden/inert controls and no scroll capture.
 if(!location.hash&&!motion.matches){
  animate(document.querySelector('.poster-title'),[{opacity:0,translate:'0 28px'},{opacity:1,translate:'0 0'}],{duration:650});
  [['.book',90,40],['.door',190,35],['.lens',300,50]].forEach(([selector,delay,offset])=>{
   animate(document.querySelector('.room-props '+selector),[{opacity:0,translate:offset+'px 25px'},{opacity:1,translate:'0 0'}],{duration:700,delay,fill:'backwards'});
  });
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

 // Keep frame and threshold still while the actual leaf opens about its hinge.
 const leaf=document.querySelector('.door-leaf'),lens=document.querySelector('.room-props .lens');
 let doorAnimation=null,lensAnimation=null;
 function openDoor(){
  if(motion.matches||doorAnimation?.playState==='running')return;
  doorAnimation=animate(leaf,[{transform:'scaleX(-2.15) skewY(-5deg)'},{transform:'scaleX(-.55) skewY(3deg)',offset:.5},{transform:'scaleX(1) skewY(0deg)'}],{duration:1600});
 }
 function magnify(){
  if(motion.matches||lensAnimation?.playState==='running')return;
  lensAnimation=animate(lens,[{transform:'rotate(-18deg) scale(1)'},{transform:'rotate(-9deg) scale(1.16)',offset:.45},{transform:'rotate(-9deg) scale(1.16)',offset:.65},{transform:'rotate(-18deg) scale(1)'}],{duration:1600});
 }
 document.querySelector('.door-wrap')?.addEventListener('pointerenter',openDoor);
 document.querySelector('.lens-wrap')?.addEventListener('pointerenter',magnify);
 const propTimers=[];
 if(!location.hash&&!motion.matches){propTimers.push(setTimeout(openDoor,2600),setTimeout(magnify,4300))}
 motion.addEventListener('change',()=>{if(motion.matches){propTimers.forEach(clearTimeout);doorAnimation?.cancel();lensAnimation?.cancel()}});
 // Passive scroll listener; only transform writes happen on animation frames.
 const room=document.querySelector('.room'),layers=[...document.querySelectorAll('[data-parallax]')];
 let roomHeight=room.offsetHeight,raf=0;
 const small=matchMedia('(max-width:700px)');
 function paint(){
  raf=0;
  const y=Math.max(0,Math.min(window.scrollY,roomHeight));
  layers.forEach(el=>el.style.transform=motion.matches?'':('translate3d(0,'+(-y*Number(el.dataset.parallax)*(small.matches ? 0.28 : 1))+'px,0)'));
 }
 function requestPaint(){if(!raf)raf=requestAnimationFrame(paint)}
 addEventListener('scroll',requestPaint,{passive:true});
 addEventListener('resize',()=>{roomHeight=room.offsetHeight;requestPaint()},{passive:true});
 motion.addEventListener('change',()=>{if(motion.matches)stopScene();requestPaint()});
 requestPaint();
})();
