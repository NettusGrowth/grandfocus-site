(()=>{"use strict";
const first=document.querySelector(".offer > img.spectacle-cover"),slides=window.GF_SPECTACLE_IMAGES;
if(!first||!Array.isArray(slides)||slides.length<2||slides[0].src!==first.getAttribute("src"))return;
const reduce=matchMedia("(prefers-reduced-motion: reduce)"),N=slides.length;
let index=0,timer=0,settle=0,raf=0,visible=true,drag=null,touching=false,focused=false;
const make=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n};
const wrap=make("div","gf-hero-carousel"),track=make("div","gf-hero-track");
wrap.setAttribute("role","region");wrap.setAttribute("aria-roledescription","carrossel");wrap.setAttribute("aria-label","Fotografias da Grand Focus");
track.tabIndex=0;track.setAttribute("aria-label","Arraste ou use as setas do teclado para navegar pelas fotos");
first.before(wrap);wrap.append(track);
const images=slides.map((data,i)=>{const panel=make("div","gf-hero-slide");if(data.height>data.width)panel.classList.add("gf-portrait");panel.setAttribute("role","group");panel.setAttribute("aria-label",(i+1)+" de "+N);const img=i===0?first:make("img");img.alt=data.alt;img.width=data.width;img.height=data.height;img.decoding="async";img.draggable=false;if(i>0){img.dataset.src=data.src;img.fetchPriority="low"}panel.append(img);track.append(panel);return img});
function load(i){const img=images[(i+N)%N];if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src}}
function draw(i){index=Math.min(N-1,Math.max(0,i));load(index);load(index+1);load(index-1)}
function nearest(){return Math.min(N-1,Math.max(0,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))))}
function stop(){clearTimeout(timer)}
function schedule(){stop();if(reduce.matches||document.hidden||!visible||drag||touching||focused)return;timer=setTimeout(()=>move(index+1),4800)}
function move(target){stop();const next=(target+N)%N;draw(next);track.scrollTo({left:next*track.clientWidth,behavior:reduce.matches||target!==next?"auto":"smooth"});schedule()}
track.addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw(nearest())});clearTimeout(settle);settle=setTimeout(()=>{if(!drag&&!touching){draw(nearest());schedule()}},180)},{passive:true});
track.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")return;if(e.button!==0)return;stop();drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,active:false}});
track.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;if(!drag.active&&Math.abs(dx)>5){drag.active=true;track.classList.add("gf-dragging");track.setPointerCapture(e.pointerId)}if(drag.active){track.scrollLeft=drag.left-dx;e.preventDefault()}});
function release(e){if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,start=Math.round(drag.left/Math.max(1,track.clientWidth)),target=Math.abs(dx)>Math.min(65,track.clientWidth*.17)?start+(dx<0?1:-1):nearest();track.classList.remove("gf-dragging");drag=null;move(Math.max(0,Math.min(N-1,target)))}
window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);
track.addEventListener("touchstart",()=>{touching=true;stop()},{passive:true});
const endTouch=()=>{touching=false;clearTimeout(settle);settle=setTimeout(()=>{draw(nearest());schedule()},250)};
track.addEventListener("touchend",endTouch,{passive:true});track.addEventListener("touchcancel",endTouch,{passive:true});
track.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){focused=true;e.preventDefault();move(index+(e.key==="ArrowRight"?1:-1))}});
track.addEventListener("blur",()=>{focused=false;schedule()});document.addEventListener("visibilitychange",schedule);
reduce.addEventListener?.("change",schedule);
if("IntersectionObserver" in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule()},{threshold:.15}).observe(wrap);
let previousWidth=track.clientWidth;if("ResizeObserver" in window)new ResizeObserver(()=>{if(track.clientWidth!==previousWidth){previousWidth=track.clientWidth;track.scrollLeft=index*previousWidth}}).observe(track);
const start=()=>{load(1);schedule()};if(first.complete)start();else first.addEventListener("load",start,{once:true});first.addEventListener("error",start,{once:true});
})();