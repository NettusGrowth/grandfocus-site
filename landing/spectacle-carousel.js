(()=>{"use strict";
const first=document.querySelector(".offer > img.spectacle-cover"),slides=window.GF_SPECTACLE_IMAGES;
if(!first||!Array.isArray(slides)||slides.length<2||slides[0].src!==first.getAttribute("src"))return;
const reduce=matchMedia("(prefers-reduced-motion: reduce)"),N=slides.length;
let index=0,timer=0,settle=0,raf=0,paused=reduce.matches,visible=true,hovered=false,focused=false,drag=null,interacting=false;
const make=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n};
const wrap=make("div","gf-hero-carousel"),track=make("div","gf-hero-track"),controls=make("div","gf-hero-controls"),footer=make("div","gf-hero-footer"),count=make("span","gf-hero-count");
wrap.setAttribute("role","region");wrap.setAttribute("aria-roledescription","carrossel");wrap.setAttribute("aria-label","Fotografias de espetáculos e ensaios da Grand Focus");
track.tabIndex=0;track.setAttribute("aria-label","Arraste para navegar pelas fotos");first.before(wrap);wrap.append(track,controls);
const images=slides.map((data,i)=>{const panel=make("div","gf-hero-slide");panel.setAttribute("role","group");panel.setAttribute("aria-label",(i+1)+" de "+N);const img=i===0?first:make("img");img.alt=data.alt;img.width=data.width;img.height=data.height;img.decoding="async";img.draggable=false;if(i>0){img.dataset.src=data.src;img.fetchPriority="low"}panel.append(img);track.append(panel);return img});
function button(cls,txt,label,fn){const b=make("button",cls);b.type="button";b.textContent=txt;b.setAttribute("aria-label",label);b.addEventListener("click",fn);return b}
const prev=button("gf-hero-prev","‹","Fotografia anterior",()=>move(index-1)),next=button("gf-hero-next","›","Próxima fotografia",()=>move(index+1));
const pause=button("gf-hero-pause","Ⅱ","Pausar carrossel",()=>{paused=!paused;updatePause();schedule()});
controls.append(prev,next,footer);footer.append(count,pause);
function updatePause(){pause.textContent=paused?"▶":"Ⅱ";pause.setAttribute("aria-label",paused?"Reproduzir carrossel":"Pausar carrossel");pause.setAttribute("aria-pressed",String(paused))}
function load(i){const img=images[(i+N)%N];if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src}}
function draw(i){index=Math.min(N-1,Math.max(0,i));count.textContent=(index+1)+" / "+N;load(index);load(index+1);load(index-1)}
function nearest(){return Math.min(N-1,Math.max(0,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))))}
function stop(){clearTimeout(timer);timer=0}
function schedule(){stop();if(paused||document.hidden||!visible||hovered||focused||drag||interacting)return;timer=setTimeout(()=>move(index+1),4800)}
function move(target){stop();const wrapped=(target+N)%N;draw(wrapped);track.scrollTo({left:wrapped*track.clientWidth,behavior:reduce.matches||Math.abs(target-wrapped)>0?"instant":"smooth"});schedule()}
track.addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw(nearest())});clearTimeout(settle);settle=setTimeout(()=>{if(!drag){draw(nearest());interacting=false;schedule()}},170)},{passive:true});
track.addEventListener("pointerdown",e=>{stop();interacting=true;if(e.pointerType!=="mouse"||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,active:false}});
track.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;const delta=e.clientX-drag.x;if(!drag.active&&Math.abs(delta)>5){drag.active=true;track.classList.add("gf-dragging");track.setPointerCapture(e.pointerId)}if(drag.active){track.scrollLeft=drag.left-delta;e.preventDefault()}});
function release(e){if(drag&&e.pointerId!==drag.id)return;if(drag){const delta=e.clientX-drag.x,start=Math.round(drag.left/Math.max(1,track.clientWidth));const target=Math.abs(delta)>Math.min(65,track.clientWidth*.17)?start+(delta<0?1:-1):nearest();track.classList.remove("gf-dragging");drag=null;interacting=false;move(Math.max(0,Math.min(N-1,target)))}else{clearTimeout(settle);settle=setTimeout(()=>{interacting=false;draw(nearest());schedule()},220)}}
window.addEventListener("pointerup",release,{passive:true});window.addEventListener("pointercancel",release,{passive:true});
wrap.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse"){hovered=true;stop()}});
wrap.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse"){hovered=false;schedule()}});
wrap.addEventListener("focusin",()=>{focused=true;stop()});wrap.addEventListener("focusout",e=>{if(!wrap.contains(e.relatedTarget)){focused=false;schedule()}});
track.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(index+(e.key==="ArrowRight"?1:-1))}});
document.addEventListener("visibilitychange",schedule);
reduce.addEventListener?.("change",()=>{if(reduce.matches)paused=true;updatePause();schedule()});
if("IntersectionObserver" in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule()},{threshold:.15}).observe(wrap);
if("ResizeObserver" in window)new ResizeObserver(()=>{track.scrollLeft=index*track.clientWidth}).observe(track);
count.textContent="1 / "+N;updatePause();
const start=()=>{if(!document.hidden){load(1);schedule()}};if(first.complete)start();else first.addEventListener("load",start,{once:true});first.addEventListener("error",start,{once:true});
})();