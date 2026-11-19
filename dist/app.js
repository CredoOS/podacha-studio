import {projects} from './projects.js';

const $ = id => document.getElementById(id);
const track=$('track'), stage=$('stage'), dialog=$('case');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const pad=n=>String(n).padStart(2,'0');
const source=(p,suffix='-cover')=>`assets/${p.id}${suffix}.webp`;
let active=0, mode='showcase', busy=false, shown=-1, motionVersion=0, galleryOrigin=null, closeRequested=false;
const projectIndex=new Map(projects.map((p,i)=>[p.id,i]));
const caseHash=i=>`#case-${projects[i].id}`;
const hashIndex=()=>projectIndex.get(location.hash.slice(6));
const frames=projects.map((p,i)=>{
  const button=document.createElement('button');button.className='frame';button.type='button';button.setAttribute('aria-label',`${p.name} — ${p.category}`);button.dataset.index=i;
  const img=document.createElement('img');img.src=source(p);img.alt=p.alt;img.width=960;img.height=804;img.draggable=false;img.decoding='async';img.loading=i===0||i===1||i===projects.length-1?'eager':'lazy';if(i===0)img.fetchPriority='high';button.append(img);track.append(button);
  button.addEventListener('click',()=>{if(suppressClick)return;if(i===active)openCase(i,button);else select(i);});
  return button;
});
const listRows=projects.map((p,i)=>{
  const button=document.createElement('button');button.className='list-row';button.innerHTML=`<span>${pad(i+1)}</span><b></b><span class="list-cat"></span><img loading="lazy">`;
  button.querySelector('b').textContent=p.name;button.querySelector('.list-cat').textContent=p.category;const img=button.querySelector('img');img.src=source(p);img.alt=p.alt;
  button.addEventListener('click',()=>{select(i);openCase(i,img);});$('list-panel').append(button);return button;
});
function select(index){
  active=(index+projects.length)%projects.length;
  const p=projects[active];
  frames.forEach((el,i)=>{let offset=i-active; if(offset>projects.length/2)offset-=projects.length;if(offset< -projects.length/2)offset+=projects.length;
    const distance=Math.abs(offset);el.style.setProperty('--offset',offset);el.style.setProperty('--angle',offset===0?'0deg':offset>0?'-8deg':'8deg');el.style.setProperty('--scale',distance===0?1:distance===1?.77:.64);el.style.setProperty('--opacity',distance<=1?1:distance===2?.36:0);el.style.setProperty('--z',10-distance);el.style.setProperty('--pointer',distance<=1?'auto':'none');el.dataset.active=String(i===active);el.tabIndex=distance<=1?0:-1;el.setAttribute('aria-hidden',String(distance>1));if(distance<=1)el.firstElementChild.loading='eager';
  });
  $('project-name').textContent=p.name;$('project-category').textContent=p.category;
  $('counter').textContent=$('stage-index').textContent=`${pad(active+1)} / ${pad(projects.length)}`;$('progress-bar').style.setProperty('--progress',(active+1)/projects.length);
  if(!reduce.matches){$('caption').getAnimations().forEach(a=>a.cancel());$('caption').animate([{opacity:.65,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:440,easing:'cubic-bezier(.25,.72,.22,1)'});}
}
select(0);
$('prev').onclick=()=>select(active-1);$('next').onclick=()=>select(active+1);$('open-project').onclick=()=>openCase(active,frames[active]);
function switchMode(next){mode=next;const isList=mode==='list';$('showcase-panel').hidden=isList;$('list-panel').hidden=!isList;$('showcase').setAttribute('aria-pressed',String(!isList));$('listmode').setAttribute('aria-pressed',String(isList));}
$('showcase').onclick=()=>switchMode('showcase');$('listmode').onclick=()=>switchMode('list');
let start=null,suppressClick=false,dragging=false;
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};suppressClick=false;dragging=false;});
stage.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!dragging&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)*1.4){dragging=true;stage.setPointerCapture(e.pointerId);track.classList.add('dragging')}if(dragging){const pull=Math.sign(dx)*Math.min(220,Math.abs(dx)*.78);track.style.setProperty('--drag',`${pull}px`);}});
function endDrag(){track.classList.remove('dragging');track.style.setProperty('--drag','0px');dragging=false;start=null;}
stage.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(dragging){suppressClick=true;setTimeout(()=>{suppressClick=false},180)}if(Math.abs(dx)>32&&Math.abs(dx)>Math.abs(dy)*1.25)select(active+(dx<0?1:-1));endDrag()});
stage.addEventListener('pointercancel',()=>{endDrag();suppressClick=false});
stage.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!dragging)endDrag();});
document.addEventListener('keydown',e=>{if(dialog.open)return;if(!e.target.closest('#works'))return;if(e.key==='ArrowRight'){e.preventDefault();select(active+1)}if(e.key==='ArrowLeft'){e.preventDefault();select(active-1)}});
const menu=document.querySelector('.menu'),nav=$('nav');
function menuOpen(open){menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.firstChild.textContent=open?'Закрыть':'Меню';}
menu.onclick=()=>menuOpen(menu.getAttribute('aria-expanded')!=='true');nav.querySelectorAll('a').forEach(a=>a.onclick=()=>menuOpen(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open&&menu.getAttribute('aria-expanded')==='true'){menuOpen(false);menu.focus()}});
function fillCase(i){const p=projects[i];$('case-index').textContent=`${pad(i+1)} / ${pad(projects.length)}`;$('case-category').textContent=p.category;$('case-title').textContent=p.name;$('case-tagline').textContent=p.title;$('case-brief').textContent=`Задача авторской концепции: ${p.brief.charAt(0).toLocaleLowerCase('ru')}${p.brief.slice(1)}`;$('case-solution').textContent=p.solution;$('case-output').textContent=p.output;for(const [id,suffix,alt] of [['case-image','-cover',p.alt],['case-detail','-detail',p.detailAlt],['case-full','',p.alt]]){const img=$(id);img.src=source(p,suffix);img.alt=alt;}$('share-status').textContent='';$('share-fallback').hidden=true;}
function fly(from,to,src,duration,parent=dialog){
  if(reduce.matches||!from||!to||from.width<1||to.width<1)return Promise.resolve();
  const layer=document.createElement('img');layer.src=src;layer.className='flying-image';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{left:`${to.left}px`,top:`${to.top}px`,width:`${to.width}px`,height:`${to.height}px`});parent.append(layer);
  const dx=from.left+from.width/2-to.left-to.width/2,dy=from.top+from.height/2-to.top-to.height/2;
  const anim=layer.animate([{transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`},{transform:'none'}],{duration,easing:'cubic-bezier(.22,.75,.16,1)',fill:'both'});
  return anim.finished.catch(()=>{}).finally(()=>layer.remove());
}
function stopMotion(){motionVersion++;for(const el of document.querySelectorAll('.flying-image')){el.getAnimations().forEach(a=>a.cancel());el.remove()}for(const el of [$('case-visual'),dialog.querySelector('.case-text')])el.getAnimations().forEach(a=>a.cancel());busy=false;dialog.classList.remove('opening','pulling');caseShell.classList.remove('pulling');caseShell.style.removeProperty('--pull');pull=null;}
function rememberOrigin(index,origin){galleryOrigin={index,mode,focus:document.activeElement,origin,scrollY:window.scrollY};}
function openCase(index,origin){if(dialog.open)return;rememberOrigin(index,origin);history.pushState({podachaCase:true,depth:1},'',caseHash(index));syncRoute(origin);}
function showCase(index,origin){
  if(dialog.open&&shown===index)return;closeRequested=false;stopMotion();const first=!dialog.open;const from=origin?.getBoundingClientRect();select(index);shown=index;fillCase(index);
  if(first){if(!galleryOrigin){document.getElementById('works').scrollIntoView({behavior:'instant'});rememberOrigin(index,mode==='list'?listRows[index]:frames[index]);}dialog.showModal();document.body.style.overflow='hidden';}
  dialog.scrollTop=0;$('case-title').focus({preventScroll:true});
  const version=motionVersion;if(first&&from&&!reduce.matches){busy=true;dialog.classList.add('opening');fly(from,$('case-visual').getBoundingClientRect(),$('case-image').src,660).finally(()=>{if(version===motionVersion){dialog.classList.remove('opening');busy=false;}})}else if(!reduce.matches){$('case-visual').animate([{opacity:.55,transform:'translateY(7px) scale(.985)'},{opacity:1,transform:'none'}],{duration:560,easing:'cubic-bezier(.22,.68,.22,1)'});dialog.querySelector('.case-text').animate([{opacity:.6,transform:'translateY(9px)'},{opacity:1,transform:'none'}],{duration:650,easing:'cubic-bezier(.22,.68,.22,1)'});}
}
function hideCase(){
  if(!dialog.open)return;const image=$('case-image'),visible=$('case-visual').getBoundingClientRect(),src=image.src,previous=shown;const origin=galleryOrigin;stopMotion();dialog.close();document.body.style.overflow='';shown=-1;closeRequested=false;
  if(origin){switchMode(origin.mode);select(origin.index);window.scrollTo({top:origin.scrollY,behavior:'instant'});const target=origin.mode==='list'?listRows[origin.index]:frames[origin.index];const focus=origin.focus instanceof HTMLElement&&origin.focus!==document.body&&origin.focus.getClientRects().length?origin.focus:target;focus.focus({preventScroll:true});if(visible.bottom>0&&visible.top<innerHeight&&origin.index===previous)fly(visible,target.getBoundingClientRect(),src,420,document.body);}
  galleryOrigin=null;
}
function syncRoute(origin){
  if(!location.hash.startsWith('#case-')){hideCase();return;}
  const index=hashIndex();if(index===undefined){history.replaceState(null,'','#works');hideCase();$('works').scrollIntoView({behavior:'instant'});return;}
  showCase(index,origin instanceof Element?origin:null);
}
function closeCase(){
  if(!dialog.open||closeRequested)return;closeRequested=true;
  const depth=history.state?.podachaCase&&history.state.depth;
  if(Number.isInteger(depth)&&depth>0){history.go(-depth);}else{history.replaceState(null,'','#works');syncRoute();}
}
$('close-case').onclick=closeCase;dialog.addEventListener('cancel',e=>{e.preventDefault();closeCase()});
$('case-next').onclick=()=>{if(!dialog.open||closeRequested)return;const next=(shown+1)%projects.length,depth=history.state?.podachaCase?history.state.depth:0;history.pushState({podachaCase:true,depth:Number.isInteger(depth)&&depth>0?depth+1:0},'',caseHash(next));syncRoute();};
window.addEventListener('popstate',()=>syncRoute());window.addEventListener('hashchange',()=>syncRoute());
$('share-case').onclick=async()=>{const url=new URL(location.href);url.hash=caseHash(shown);try{await navigator.clipboard.writeText(url.href);$('share-status').textContent='Ссылка скопирована.';}catch{$('share-fallback').value=url.href;$('share-fallback').hidden=false;$('share-fallback').focus();$('share-fallback').select();$('share-status').textContent='Скопируйте ссылку из поля.';}};
// Pull down from the top to dismiss. Scrolling through a case remains native.
const caseShell=dialog.querySelector('.case-shell'),caseHead=dialog.querySelector('.case-head');
let pull=null;
function beginPull(x,y){if(!busy&&dialog.scrollTop<=2)pull={x,y,time:performance.now(),dy:0,started:false};}
function movePull(x,y,event){if(!pull||busy)return;const dx=x-pull.x,dy=y-pull.y;if(!pull.started){if(dy<-8||Math.abs(dx)>Math.max(10,dy*1.1)){pull=null;return;}if(dy<9)return;pull.started=true;caseShell.classList.add('pulling');dialog.classList.add('pulling')};if(event.cancelable)event.preventDefault();pull.dy=Math.max(0,dy);if(!reduce.matches)caseShell.style.setProperty('--pull',`${Math.min(240,pull.dy*.7)}px`);}
function endPull(cancel=false){if(!pull)return;const {dy,time,started}=pull;pull=null;caseShell.classList.remove('pulling');const dismiss=!cancel&&started&&(dy>100||(dy>55&&performance.now()-time<230));if(dismiss){closeCase()}else{dialog.classList.remove('pulling');caseShell.style.setProperty('--pull','0px');}}
dialog.addEventListener('touchstart',e=>{if(e.touches.length===1)beginPull(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
dialog.addEventListener('touchmove',e=>{if(e.touches.length===1)movePull(e.touches[0].clientX,e.touches[0].clientY,e)},{passive:false});
dialog.addEventListener('touchend',()=>endPull(),{passive:true});dialog.addEventListener('touchcancel',()=>endPull(true),{passive:true});
caseHead.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;beginPull(e.clientX,e.clientY);if(pull)caseHead.setPointerCapture(e.pointerId)});
caseHead.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')movePull(e.clientX,e.clientY,e)});caseHead.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')endPull()});caseHead.addEventListener('pointercancel',()=>endPull(true));
syncRoute();

// One shared motion language. No scroll hijacking; all content stays visible without JS.
const hoverFine=matchMedia('(hover: hover) and (pointer: fine)');
let cameraFrame=0,cameraX=0,cameraY=0;
function resetCamera(){if(cameraFrame)cancelAnimationFrame(cameraFrame);cameraFrame=0;track.style.removeProperty('--camera-x');track.style.removeProperty('--camera-y');}
stage.addEventListener('pointermove',e=>{if(reduce.matches||!hoverFine.matches||e.pointerType!=='mouse'||start||dialog.open)return;const r=stage.getBoundingClientRect();cameraX=((e.clientX-r.left)/r.width-.5)*12;cameraY=((e.clientY-r.top)/r.height-.5)*7;if(!cameraFrame)cameraFrame=requestAnimationFrame(()=>{cameraFrame=0;track.style.setProperty('--camera-x',`${cameraX.toFixed(2)}px`);track.style.setProperty('--camera-y',`${cameraY.toFixed(2)}px`);});});
stage.addEventListener('pointerleave',resetCamera);stage.addEventListener('pointerdown',resetCamera);stage.addEventListener('pointercancel',resetCamera);reduce.addEventListener('change',resetCamera);hoverFine.addEventListener('change',resetCamera);
if('IntersectionObserver' in window){
  const entryMotion=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;entryMotion.unobserve(e.target);if(reduce.matches)continue;e.target.animate([{opacity:.7,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.22,.68,.22,1)'});}}, {threshold:.14});
  document.querySelectorAll('.work-head,.work-info,.studio-top,.studio .service,.process,.contact-main,.contact-details').forEach(el=>entryMotion.observe(el));
  const links=[...nav.querySelectorAll('a')], sections=links.map(a=>document.querySelector(a.hash));
  const updateNav=()=>{let current=null;for(const section of sections){if(section.getBoundingClientRect().top<=innerHeight*.48)current=section.id;}for(const a of links){if(a.hash===`#${current}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}};
  const sectionObserver=new IntersectionObserver(updateNav,{rootMargin:'-48% 0px -51% 0px'});sections.forEach(el=>sectionObserver.observe(el));updateNav();
}
