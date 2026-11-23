'use strict';
(() => {
 const cards=[...document.querySelectorAll('#archive > article')];
 if(!cards.length)return;
 const terms=cards.map(card=>Object.freeze({id:card.id,title:card.querySelector('h2').textContent.trim(),category:card.dataset.category,categoryLabel:card.querySelector('.term-category').textContent,number:card.querySelector('.term-number').textContent,summary:card.dataset.recommendationSummary,scenario:card.dataset.scenario}));
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
  count.textContent='共 '+shown+' 則';empty.hidden=shown>0;moveFilterHighlight();
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
 const answer=document.querySelector('#recommend-answer'),revealButton=document.querySelector('#recommend-reveal'),scenarioHeading=document.querySelector('#recommend-scenario'),discoveryStatus=document.querySelector('#discovery-status');
 let recommended=null,pendingPick=null,pickVersion=0,pickAnimations=[],discoveryState='closed';
 const pickContent=pick.querySelector('.recommend-content');
 const guideDot=document.querySelector('.curiosity-dot'),guideHome=document.querySelector('.guide-home'),guideDock=document.querySelector('.guide-dock'),switchDock=document.querySelector('.switch-dock');
 let guideBusy=false;
 function dockGuide(parent){parent.append(guideDot);guideDot.classList.remove('is-travelling');guideDot.style.cssText='transform:translateY(0) scale(1)'}
 function resetSwitch(){pickAnimations.forEach(a=>a?.cancel());pickAnimations=[];pick.style.height='';guideDot.style.transform='translateY(0) scale(1)'}
 function choose(){const pool=cards.filter(card=>card!==recommended);return pool[Math.floor(Math.random()*pool.length)]||cards[0]}
 const selectedTerm=()=>terms.find(t=>t.id===recommended?.id);
 window.WordNotes=Object.freeze({terms:Object.freeze(terms),getSelected:selectedTerm,getState:()=>discoveryState,open:(id,trigger)=>{const card=cards.find(c=>c.id===id);if(!card)return false;enter(card,trigger);return true}});
 function renderPick(card){
  recommended=card;pendingPick=null;discoveryState='closed';pick.dataset.state='closed';const term=selectedTerm();
  scenarioHeading.textContent=term.scenario;
  answer.hidden=true;answer.inert=true;
  ['recommend-title','recommend-category','recommend-number','recommend-text'].forEach(id=>document.getElementById(id).textContent='');
  pickLink.setAttribute('href','#recommendation');
  revealButton.hidden=false;revealButton.disabled=false;revealButton.textContent='攤開看答案';revealButton.setAttribute('aria-expanded','false');
  document.querySelector('#slip-read').setAttribute('href','#recommendation');document.querySelector('#slip-title').textContent=term.scenario;
  discoveryStatus.textContent='紙上是一個生活情境，攤開後揭曉答案。';
  document.dispatchEvent(new CustomEvent('word:recommended',{detail:{id:card.id}}));
 }
 function recommend(){++pickVersion;resetSwitch();renderPick(choose());requestAnimationFrame(()=>refreshStoryAnchors())}
 function finishReveal(token){
  if(token!==pickVersion||discoveryState!=='opening')return;const term=selectedTerm();
  document.querySelector('#recommend-number').textContent=term.number;document.querySelector('#recommend-category').textContent=term.categoryLabel;
  document.querySelector('#recommend-title').textContent=term.title;document.querySelector('#recommend-text').textContent=term.summary;
  pickLink.setAttribute('href','#'+term.id);answer.hidden=false;answer.inert=false;pick.dataset.state=discoveryState='open';
  revealButton.setAttribute('aria-expanded','true');const shouldFocus=document.activeElement===revealButton;revealButton.hidden=true;revealButton.disabled=false;
  discoveryStatus.textContent='原來，這個詞叫「'+term.title+'」。';if(shouldFocus&&!document.querySelector('.reader[open]'))document.querySelector('#recommend-title').focus({preventScroll:true});
  document.dispatchEvent(new CustomEvent('word:revealed',{detail:{id:term.id}}));requestAnimationFrame(()=>refreshStoryAnchors());
 }
 async function revealAnswer(){
  if(discoveryState!=='closed')return;const token=++pickVersion;discoveryState='opening';pick.dataset.state='opening';revealButton.disabled=true;revealButton.textContent='正在攤開…';discoveryStatus.textContent='正在攤開紙張。';
  try{const result=window.WordPaper?await window.WordPaper.reveal(selectedTerm()):true;if(result!==false)finishReveal(token)}catch{finishReveal(token)}
 }
 renderPick(choose());revealButton.hidden=false;document.querySelector('#recommend-another').hidden=false;
 revealButton.addEventListener('click',revealAnswer);
 document.querySelector('#recommend-another').addEventListener('click',()=>{recommend();track('word_recommendation_change',meta(recommended))});
 document.querySelector('.nav-random').addEventListener('click',()=>{recommend();track('word_recommendation_change',meta(recommended))});
 motion.addEventListener('change',()=>{if(motion.matches&&discoveryState==='opening')finishReveal(pickVersion)});

 const filterGroup=document.querySelector('.filters'),highlight=document.createElement('span');highlight.className='filter-highlight';highlight.setAttribute('aria-hidden','true');filterGroup.prepend(highlight);
 let filterPosition=null,highlightAnimation=null;
 function moveFilterHighlight(play=true){
  const selected=buttons.find(b=>b.getAttribute('aria-pressed')==='true');if(!selected)return;
  const group=filterGroup.getBoundingClientRect(),rect=selected.getBoundingClientRect(),to={x:rect.left-group.left,y:rect.top-group.top,w:rect.width,h:rect.height};
  highlightAnimation?.cancel();highlight.style.cssText=`width:${to.w}px;height:${to.h}px;transform:translate(${to.x}px,${to.y}px)`;
  if(play&&filterPosition&&!motion.matches){const f=filterPosition;highlightAnimation=animate(highlight,[{transform:`translate(${f.x}px,${f.y}px)`,width:f.w+'px',height:f.h+'px'},{transform:`translate(${to.x}px,${to.y}px)`,width:to.w+'px',height:to.h+'px'}],{duration:240})}filterPosition=to;
 }
 new ResizeObserver(()=>moveFilterHighlight(false)).observe(filterGroup);document.fonts.ready.then(()=>moveFilterHighlight(false));moveFilterHighlight(false);

 const reader=document.querySelector('.reader'),copy=reader.querySelector('.reader-copy'),art=reader.querySelector('.reader-art');
 const prev=reader.querySelector('#reader-prev'),next=reader.querySelector('#reader-next'),close=reader.querySelector('#reader-close');
 let active=null,beat=0,turning=false,version=0,returnFocus=null,oldOverflow='',running=[],closing=false,dialogAnimation=null,readerOrbAnimation=null;
 const files=['reading-book-v2.png','reading-door-v2.png','reading-lens-v2.png'];
 function animate(el,frames,opts={}){
  if(motion.matches||!el?.animate)return null;
  try{return el.animate(frames,{duration:440,easing:'cubic-bezier(.22,1,.36,1)',...opts})}catch{return null}
 }
 let dotVersion=0;
 function positionReaderDot(from,to,play=false){
  const dots=[...reader.querySelectorAll('.reader-step-dots i')],token=++dotVersion;readerOrbAnimation?.cancel();
  dots.forEach((dot,i)=>{dot.classList.toggle('is-filled',i<to||!play&&i===to);dot.classList.toggle('is-current',i===to)});reader.dataset.beat=String(to+1);
  const land=()=>{if(token===dotVersion)dots[to]?.classList.add('is-filled')};
  if(play&&!motion.matches){readerOrbAnimation=animate(dots[to],[{transform:'translateY(0) scale(1)'},{transform:'translateY(-7px) scale(.88,1.12)',offset:.45},{transform:'translateY(0) scale(1.18,.8)',offset:.78},{transform:'translateY(0) scale(1)'}],{duration:360});readerOrbAnimation?.finished.then(land,()=>{});if(!readerOrbAnimation)land()}else land();
 }
 function stopScene(){running.forEach(a=>a?.cancel());running=[]}
 function scene(direction=1,fromBeat=beat){
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
  prev.disabled=beat===0;next.disabled=beat===2;positionReaderDot(fromBeat,beat,fromBeat!==beat);
  const shift=matchMedia('(max-width:700px)').matches?12:24;
  running.push(animate(copy,[{opacity:0,transform:'translateX('+(direction*shift)+'px)'},{opacity:1,transform:'none'}],{duration:240}));
  running.push(animate(img,[{opacity:0,transform:'translateX('+(direction*shift)+'px)'},{opacity:1,transform:'none'}],{duration:240}));
  reader.scrollTop=0;
 }
 function enter(card,trigger){
  if(typeof reader.showModal!=='function'){location.hash=card.id;return}
  active=card;beat=0;turning=false;closing=false;version++;returnFocus=trigger;oldOverflow=document.body.style.overflow;
  readerOrbAnimation?.cancel();scene();guideDot.hidden=true;document.querySelector('.word-slip').classList.remove('is-readable');document.querySelector('.word-slip').inert=true;reader.showModal();document.body.style.overflow='hidden';close.focus();
  dialogAnimation?.cancel();dialogAnimation=animate(reader,[{opacity:0,translate:'0 15px'},{opacity:1,translate:'0 0'}],{duration:200});
  track('word_reader_open',meta(card));
 }
 async function exit(){
  if(closing||!reader.open)return;
  closing=true;const token=++version;turning=false;stopScene();readerOrbAnimation?.cancel();dialogAnimation?.cancel();
  dialogAnimation=animate(reader,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 10px'}],{duration:160});
  await dialogAnimation?.finished.catch(()=>{});
  if(token!==version)return;
  reader.close();guideDot.hidden=false;document.body.style.overflow=oldOverflow;closing=false;
  if(returnFocus?.id==='slip-read'){
   if(canShowNote()){setNote(true);slip.style.setProperty('--title-reveal','1');slip.style.setProperty('--slip-enter','1');returnFocus.focus({preventScroll:true})}
   else pickLink.focus({preventScroll:true});
  }else returnFocus?.focus({preventScroll:true});
 }
 async function turn(delta){
  const target=beat+delta;if(!reader.open||closing||turning||target<0||target>2)return;
  turning=true;const token=++version;
  try{
   const a=animate(copy,[{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-delta*18)+'px)'}],{duration:160});
   const b=animate(art,[{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-delta*24)+'px) rotate('+(-delta*6)+'deg)'}],{duration:160});
   running.push(a,b);
   await Promise.all([a,b].filter(Boolean).map(x=>x.finished.catch(()=>{})));
   if(!reader.open||token!==version)return;
   const fromBeat=beat;beat=target;scene(delta,fromBeat);copy.querySelector('h2').focus({preventScroll:true});
   await Promise.all(running.filter(Boolean).map(x=>x.finished.catch(()=>{})));
  }finally{if(token===version)turning=false}
 }
 cards.forEach(card=>{
  const b=document.createElement('button');b.type='button';b.className='read-film';b.textContent='用三幕翻讀 →';card.append(b);
  b.addEventListener('click',()=>enter(card,b));
 });
 pickLink.addEventListener('click',event=>{if(typeof reader.showModal==='function'){event.preventDefault();enter(recommended,pickLink)}});
 document.querySelector('#slip-read').addEventListener('click',()=>{setNote(false)});


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
  const introDrop=matchMedia('(max-width:700px)').matches?32:64;
  document.querySelectorAll('h1 > span').forEach((line,i)=>entrance.push(animate(line,[{opacity:0,translate:'0 24px'},{opacity:1,translate:'0 0'}],{duration:480,delay:i*100,fill:'backwards'})));
  entrance.push(animate(document.querySelector('.question'),[{opacity:0,transform:'rotate(-14deg) translateY(10px)'},{opacity:1,transform:'rotate(0deg) translateY(0)'}],{duration:400,delay:260,fill:'backwards'}));
  const heroDot=document.querySelector('.curiosity-dot');
  const landing=animate(heroDot,[{transform:'translateY(-'+introDrop+'px) scale(.85,1.12)'},{transform:'translateY(0) scale(1.28,.72)',offset:.52},{transform:'translateY(-12px) scale(.92,1.08)',offset:.72},{transform:'translateY(0) scale(1.08,.92)',offset:.9},{transform:'translateY(0) scale(1)'}],{duration:800});
  entrance.push(landing);
  const settleDot=()=>{if(heroDot.parentElement===guideHome)heroDot.style.transform='translateY(0) scale(1)';landing?.cancel()};
  landing?.finished.then(settleDot,settleDot);
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
 const room=document.querySelector('.room'),leaf=document.querySelector('.door-leaf'),lens=document.querySelector('.lens-body');
 const slip=document.querySelector('.word-slip'),glow=document.querySelector('.door-glow'),question=document.querySelector('.question'),lensMessage=document.querySelector('.lens-message');
 let noteSeenAt=0,noteDismissed=false,noteTimer=0,noteActive=false,insightTimer=0,noteRevealTimer=0;
 let recommendationVisible=false,inlineNote=false;
 function recommendationInView(){const r=pick.getBoundingClientRect();return r.bottom>0&&r.top<(window.innerHeight||860)}
 function canShowNote(){return !recommendationVisible&&pick.getBoundingClientRect().top>=(window.innerHeight||860)&&!noteDismissed&&!reader.open}
 function placeNote(){
  inlineNote=matchMedia('(max-width:700px)').matches&&((window.innerWidth||390)<400||(window.innerHeight||844)<820);
  slip.classList.toggle('is-inline',inlineNote);
  const parent=inlineNote?document.querySelector('.slip-inline-slot'):document.body;
  if(slip.parentElement!==parent)parent.append(slip);
 }
 placeNote();
 const setNote=show=>{show=show&&canShowNote();noteActive=show;slip.classList.toggle('is-readable',show);slip.inert=!show;slip.setAttribute('aria-hidden',String(!show))};
 setNote(false);
 document.querySelector('.slip-dismiss').addEventListener('click',()=>{noteDismissed=true;setNote(false);document.querySelector('.nav-random').focus({preventScroll:true})});
 function insight(){
  clearTimeout(insightTimer);lensMessage.classList.add('is-visible');
  animate(question,[{transform:'rotate(0deg)'},{transform:'rotate(9deg)',offset:.45},{transform:'rotate(0deg)'}],{duration:450});
  magnify();insightTimer=setTimeout(()=>lensMessage.classList.remove('is-visible'),1800);
 }
 question.addEventListener('pointerenter',()=>{if(fine.matches)insight()});
 question.addEventListener('click',insight);
 const layers=[...document.querySelectorAll('[data-parallax]')];
 const small=matchMedia('(max-width:700px)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 let doorAnchor=document.querySelector('.door-wrap').getBoundingClientRect();
 let lensAnimation=null,roomHeight=room.offsetHeight,roomWidth=room.offsetWidth,raf=0,mx=0,my=0,inside=false,visible=true;
 function magnify(play=true){
  lensAnimation?.cancel();lens.style.transform='none';const what=document.querySelector('.what-word').getBoundingClientRect(),r=lens.getBoundingClientRect();
  const cx=r.left+r.width*.43,cy=r.top+r.height*.34,dy=what.top+what.height*.54-cy,scale=small.matches?.72:.82;
  const parkX=Math.min((window.innerWidth||roomWidth)-r.width*.35,what.right+what.width*.38)-cx,park=`translate(${parkX}px,${dy}px) scale(${scale})`;
  if(motion.matches||!play){lens.style.transform=park;return}
  lensAnimation=animate(lens,[{transform:park},{transform:`translate(${what.left-cx}px,${dy}px) scale(${scale})`,offset:.25},{transform:`translate(${what.right-cx}px,${dy}px) scale(${scale*1.04})`,offset:.68},{transform:park}],{duration:1150,fill:'forwards'});
  const current=lensAnimation;current?.finished.then(()=>{if(lensAnimation===current){lens.style.transform=park;current.cancel()}},()=>{});
 }
 const lensTrigger=document.querySelector('.lens-trigger');lensTrigger.addEventListener('click',insight);lensTrigger.addEventListener('pointerenter',()=>{if(fine.matches)insight()});
 if(!location.hash)setTimeout(insight,650);else magnify(false);
 const lensTimer=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const storyCaption=document.querySelector('.story-caption'),replay=document.querySelector('.replay-intro');
 let storyEnabled=!location.hash,storyDistance=small.matches?360:520,storyAnchors=null,storyMeasured=false,bookRestAt=0,doorRestAt=0;
 function center(el,rx=.5,ry=.5){const r=el.getBoundingClientRect();return {x:r.left+r.width*rx,y:r.top+window.scrollY+r.height*ry}}
 function refreshStoryAnchors(){
  storyDistance=small.matches?360:520;
  storyAnchors={home:center(guideHome),book:center(document.querySelector('.book-wrap'),.48,.42),door:center(document.querySelector('.door-wrap'),.47,.58),end:center(guideDock)};
 }
 refreshStoryAnchors();
 function leap(a,b,t,height){
  t=Math.max(0,Math.min(1,t));
  if(t<.12)return {...a,sx:1+.15*t/.12,sy:1-.15*t/.12};
  if(t>.8)return {...b,sx:t<.9?1.2-(t-.8)*2:1,sy:t<.9?.8+(t-.8)*2:1};
  const u=(t-.12)/.68;
  return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u-Math.sin(Math.PI*u)*height,sx:.85+.15*u,sy:1.15-.15*u};
 }
 function paintStory(y){
  if(guideBusy||reader.open)return;
  if(!storyEnabled||motion.matches){storyCaption.style.opacity='0';if(guideDot.parentElement!==switchDock)dockGuide(location.hash==='#recommendation'?guideDock:guideHome);return}
  const p=clamp(y/storyDistance);
  if(p>0&&p<1&&!storyMeasured){entrance.forEach(animation=>animation?.cancel());refreshStoryAnchors();storyMeasured=true}
  const a=storyAnchors;
  if(p===0){bookRestAt=doorRestAt=0;dockGuide(guideHome);storyCaption.style.opacity='0';return}
  if(p>=1){if(guideDot.parentElement!==switchDock)dockGuide(guideDock);storyCaption.style.opacity='0';return}
  // Once user scrolls into the scene, entrance animations yield to the guide.
  entrance.forEach(animation=>animation?.cancel());restPage();clearTimeout(pageTimer);
  let point;
  if(small.matches){point=leap(a.home,a.end,p,28)}
  else{
   const now=Date.now();
   if(p<.23)bookRestAt=0;else if(!bookRestAt)bookRestAt=now;
   if(p<.405)doorRestAt=0;else if(!doorRestAt)doorRestAt=now;
   const bookHold=p>=.23&&now-bookRestAt<150,doorHold=p>=.405&&now-doorRestAt<150;
   if(bookHold){point={...a.book,sx:1,sy:1};requestPaint()}
   else if(doorHold){point={...a.door,sx:1,sy:1};requestPaint()}
   else if(p<.23)point=leap(a.home,a.book,p/.23,70);
   else if(p<.31)point={...a.book,sx:1,sy:1};
   else if(p<.405)point=leap(a.book,a.door,(p-.31)/.095,28);
   else if(p<.81)point={...a.door,sx:1,sy:1};
   else point=leap(a.door,a.end,(p-.81)/.19,45);
   // The leaf opens only after the first landing, before the guide crosses it.
   const opened=clamp((p-.23)/.08);leaf.style.transform=`scaleX(${-2.15+3.15*opened}) skewY(${-5*(1-opened)}deg)`;
  }
  const quoteStart=small.matches?190:280,quoteFull=small.matches?220:310,quoteEnd=small.matches?300:430,quoteGone=small.matches?330:465;
  const quoteOpacity=clamp((y-quoteStart)/(quoteFull-quoteStart))*(1-clamp((y-quoteEnd)/(quoteGone-quoteEnd)));
  storyCaption.style.opacity=String(quoteOpacity);
  if(guideDot.parentElement!==document.body)document.body.append(guideDot);
  guideDot.classList.add('is-travelling');
  guideDot.style.transform=`translate3d(${point.x-9}px,${point.y-y-9}px,0) scale(${point.sx},${point.sy})`;
  document.querySelector('.lens-wrap').style.setProperty('--lens-shadow-opacity',String(.06+.04*(1-Math.sin(Math.PI*p))));
  document.querySelector('.lens-wrap').style.setProperty('--lens-shadow-scale',String(.72+.18*(1-Math.sin(Math.PI*p))));
 }
 addEventListener('hashchange',()=>{
  if(location.hash&&location.hash!=='#top'){storyEnabled=false;entrance.forEach(a=>a?.cancel());if(!guideBusy)dockGuide(location.hash==='#recommendation'?guideDock:guideHome);requestPaint()}
  else if(location.hash==='#top'){storyEnabled=true;requestPaint()}
 });

 function paint(){
  raf=0;if(document.hidden)return;
  const y=Math.max(0,window.scrollY),mobile=small.matches;
  const viewport=window.innerHeight||860;
  // Begin when 78% of the first screen remains; finish opening by 66%.
  const start=Math.min(roomHeight*.16,viewport*.22);
  const progress=clamp((y-start)/Math.min(110,viewport*.12));
  const eased=progress*progress*(3-2*progress);
  const release=clamp((y-start-Math.min(110,viewport*.12))/Math.min(90,viewport*.1));
  const focusMotion=storyEnabled&&y>10&&y<storyDistance ? .12 : 1;
  if(progress>0&&release<1){clearTimeout(pageTimer);clearTimeout(lensTimer);restPage();lensAnimation?.cancel()}
  layers.forEach(el=>{
   const amplitude=el.classList.contains('lens-wrap')?16:el.classList.contains('door-wrap')?8:el.classList.contains('book-wrap')?4:0;
   const px=motion.matches||!fine.matches?0:mx*amplitude*focusMotion;
   const py=motion.matches||!fine.matches?0:my*amplitude*focusMotion;
   const exitStart=mobile?(el.classList.contains('lens-wrap')?105:el.classList.contains('door-wrap')?125:135):(el.classList.contains('lens-wrap')?185:el.classList.contains('door-wrap')?225:230);
   const phase=storyEnabled&&!motion.matches?clamp((y-exitStart)/40):0;
   el.style.opacity=String(1-phase);
   el.style.transform=motion.matches?'':`translate3d(${px+phase*20}px,${-Math.min(y,roomHeight)*Number(el.dataset.parallax)*(mobile ? 0.2 : 1)+py-phase*12}px,0)`;
  });
  // Floor and both bottom notes leave with the book, before the quote begins.
  const floorExit=storyEnabled&&!motion.matches?clamp((y-(mobile?135:230))/40):0;
  document.querySelectorAll('.floor,.room-note').forEach(el=>{el.style.opacity=String(1-floorExit);el.style.transform=motion.matches?'':`translateY(${floorExit*12}px)`});
  // Opening is driven only by bounded scroll progress, so scrolling up reverses it.
  leaf.style.transform=motion.matches?'':`scaleX(${-2.15+3.15*eased}) skewY(${-5*(1-eased)}deg)`;
  glow.style.opacity=motion.matches?'0':String(.6*eased);
  paintStory(y);
  const now=Date.now();
  const reached=release>0;
  if(y<start*.6){noteSeenAt=0;noteDismissed=false;clearTimeout(noteTimer);clearTimeout(noteRevealTimer);setNote(false)}
  else if(reached&&canShowNote()){
   if(!noteSeenAt){noteSeenAt=now;noteRevealTimer=setTimeout(()=>{if(noteActive){slip.style.setProperty('--title-reveal','1');slip.style.setProperty('--slip-enter','1');slip.style.setProperty('--slip-x','0px');slip.style.setProperty('--slip-y','0px')}},450)}
   // The primary recommendation always wins over any minimum reading hold.
   const inStory=y<roomHeight,holding=!mobile&&now-noteSeenAt<2200;
   setNote(inStory||holding);
   const reveal=motion.matches?1:Math.max(clamp(release*1.8),clamp((now-noteSeenAt)/450));
   slip.style.setProperty('--slip-enter',String(reveal));
   slip.style.setProperty('--slip-x',((1-reveal)*(doorAnchor.left+doorAnchor.width*.5-((window.innerWidth||roomWidth)-(mobile?16:28)-(mobile?228:248)/2)))+'px');
   slip.style.setProperty('--slip-y',((1-reveal)*(doorAnchor.top+doorAnchor.height*.55-y-((window.innerHeight||860)-(mobile?16:28)-90)))+'px');
   slip.style.setProperty('--title-reveal',String(motion.matches?1:Math.max(clamp((release-.42)/.4),clamp((now-noteSeenAt-160)/290))));
   clearTimeout(noteTimer);
   if(holding&&noteActive)noteTimer=setTimeout(()=>{if(window.scrollY>=roomHeight+100&&!slip.contains(document.activeElement))setNote(false)},2250-(now-noteSeenAt));
  }else setNote(false);

 }
 function requestPaint(){if(!raf&&!document.hidden)raf=requestAnimationFrame(paint)}
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
 const sectionEntrance=[],revealedSections=new WeakSet();
 const sectionObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||revealedSections.has(entry.target))continue;
   revealedSections.add(entry.target);
   sectionObserver?.unobserve(entry.target);
   if(motion.matches)continue;
   sectionEntrance.push(animate(entry.target.querySelector('.selection-side h2'),[{opacity:.5,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:220}));
   sectionEntrance.push(animate(pick,[{opacity:.65,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:240,delay:70}));
  }
 },{threshold:.12}):null;
 sectionObserver?.observe(document.querySelector('.selection'));

 const recommendationObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  recommendationVisible=entries[0].isIntersecting;
  if(recommendationVisible){clearTimeout(noteTimer);clearTimeout(noteRevealTimer);setNote(false)}else requestPaint();
 },{threshold:0}):null;
 recommendationObserver?.observe(pick);
 slip.addEventListener('focusin',()=>{clearTimeout(noteTimer);slip.style.setProperty('--title-reveal','1')});
 addEventListener('scroll',requestPaint,{passive:true});
 addEventListener('resize',()=>{placeNote();roomHeight=room.offsetHeight;roomWidth=room.offsetWidth;doorAnchor=document.querySelector('.door-wrap').getBoundingClientRect();doorAnchor={...doorAnchor,top:doorAnchor.top+window.scrollY,left:doorAnchor.left,width:doorAnchor.width,height:doorAnchor.height};refreshStoryAnchors();magnify(false);requestPaint()},{passive:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(raf);raf=0;mx=my=0;clearTimeout(pageTimer);clearTimeout(lensTimer);clearTimeout(noteTimer);clearTimeout(insightTimer);lensMessage.classList.remove('is-visible');setNote(false);restPage();lensAnimation?.cancel();entrance.forEach(a=>a?.cancel())}
  else requestPaint();
 });
 motion.addEventListener('change',()=>{
  if(motion.matches){positionReaderDot(beat,beat);readerOrbAnimation?.cancel();sectionEntrance.forEach(a=>a?.cancel());stopScene();restPage();filterAnimation?.cancel();dialogAnimation?.cancel();entrance.forEach(a=>a?.cancel());clearTimeout(lensTimer);lensAnimation?.cancel()}
  requestPaint();
 });
 requestPaint();
})();
