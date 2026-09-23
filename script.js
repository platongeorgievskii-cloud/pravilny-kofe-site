/* ============ ПРАВИЛЬНЫЙ КОФЕ — motion ============ */
(function(){
'use strict';

if(typeof gsap==='undefined'||typeof ScrollTrigger==='undefined'){document.getElementById('loader')?.remove();return}
gsap.registerPlugin(ScrollTrigger);

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch=matchMedia('(hover:none)').matches;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

/* ---------- Lenis: быстрый отклик + мягкий снэп ----------
   Короткая duration и резкий easing = скролл ощущается 1:1,
   никакой «задержки больше секунды». */
let lenis=null;
if(!reduce&&typeof Lenis!=='undefined'){
  lenis=new Lenis({
    duration:.5,
    easing:t=>Math.min(1,1.001-Math.pow(2,-9*t)),
    smoothWheel:!isTouch,
    wheelMultiplier:1,
    touchMultiplier:1.6
  });
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- якоря, бургер, активная секция, is-stuck ---------- */
function gotoEl(el){if(lenis)lenis.scrollTo(el,{offset:-70});else el.scrollIntoView({behavior:reduce?'auto':'smooth'})}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');
  if(!a)return;
  const el=document.querySelector(a.getAttribute('href'));
  if(!el)return;
  e.preventDefault();
  closeMenu();
  gotoEl(el);
});
function closeMenu(){
  document.body.classList.remove('menu-open');
  $('#burger')?.setAttribute('aria-expanded','false');
  $('#mobileMenu')?.setAttribute('aria-hidden','true');
}
const burger=$('#burger');
burger?.addEventListener('click',()=>{
  const open=document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded',String(open));
  $('#mobileMenu')?.setAttribute('aria-hidden',String(!open));
});
addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

const nav=$('#nav');
const navLinks=$$('.nav nav a');
const navSections=navLinks.map(a=>$(a.getAttribute('href'))).filter(Boolean);
ScrollTrigger.create({
  start:0,end:'max',
  onUpdate:self=>{
    nav?.classList.toggle('is-stuck',self.scroll()>40);
    nav?.classList.toggle('is-hidden',self.direction===1&&self.scroll()>560&&!document.body.classList.contains('menu-open'));
    const y=self.scroll()+innerHeight*.35;
    let idx=-1;
    navSections.forEach((s,i)=>{if(s.offsetTop<=y)idx=i});
    navLinks.forEach((a,i)=>a.classList.toggle('active',i===idx));
  }
});

/* ---------- прогресс-бар ---------- */
if(!reduce)gsap.to('#scrollProgress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});

/* ---------- лоадер ---------- */
const loader=$('#loader');
const killLoader=()=>{if(loader&&loader.parentNode)loader.remove();ScrollTrigger.refresh()};
if(reduce){killLoader()}
else{
  const pct=$('#loaderPct');
  const intro=gsap.timeline({onComplete:killLoader});
  intro
    .fromTo('.loader-box>b',{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:.7,stagger:.12,ease:'power4.out'},0)
    .to('.loader-bar i',{width:'100%',duration:1.6,ease:'power2.inOut'},0)
    .to(pct,{textContent:100,duration:1.6,snap:{textContent:1},ease:'power2.inOut'},0)
    .to('.loader-box',{yPercent:-30,autoAlpha:0,duration:.45,ease:'power2.in'},'+=.05')
    .to(loader,{yPercent:-100,duration:.85,ease:'expo.inOut'},'-=.1')
    .from('.nav',{y:-30,autoAlpha:0,duration:.6,clearProps:'all'},'-=.5')
    .from('.hero h1 span,.hero h1 em',{y:70,autoAlpha:0,duration:.9,stagger:.09,ease:'expo.out'},'-=.5')
    .from('.hero-sub,.hero-actions,.hero-chips,.hero .label',{y:44,autoAlpha:0,duration:.8,stagger:.07,ease:'power3.out'},'-=.6')
    .from('.hero-scroll',{autoAlpha:0,duration:.6},'-=.4');
}

/* ---------- универсальные скролл-анимации по data-anim ---------- */
function wordSplit(el){
  if(el.dataset.split)return;
  el.dataset.split='1';
  const walk=node=>{
    Array.from(node.childNodes).forEach(ch=>{
      if(ch.nodeType===3){
        const frag=document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(t=>{
          if(!t.trim()){if(t)frag.appendChild(document.createTextNode(t));return}
          const w=document.createElement('span');w.className='word';
          const i=document.createElement('span');i.className='word-i';i.textContent=t;
          w.appendChild(i);frag.appendChild(w);
        });
        ch.replaceWith(frag);
      }else if(ch.nodeType===1)walk(ch);
    });
  };
  walk(el);
}

if(!reduce){
  $$('[data-anim]').forEach(el=>{
    const type=el.dataset.anim;
    const delay=parseFloat(el.dataset.delay||0);
    const st={trigger:el,start:'top 88%',once:true};
    // clearProps: GSAP не должен оставлять inline-transform и ломать CSS-hover
    const clear={clearProps:'transform,opacity,visibility,clip-path'};
    if(type==='words'){
      wordSplit(el);
      gsap.from(el.querySelectorAll('.word-i'),{yPercent:112,autoAlpha:0,duration:.95,stagger:.045,ease:'expo.out',delay,...clear,scrollTrigger:st});
    }else if(type==='up'){
      gsap.from(el,{y:54,autoAlpha:0,duration:.95,ease:'power3.out',delay,...clear,scrollTrigger:st});
    }else if(type==='pop'){
      gsap.from(el,{scale:.72,autoAlpha:0,duration:.85,ease:'back.out(1.7)',delay,...clear,scrollTrigger:st});
    }else if(type==='mask'){
      gsap.fromTo(el,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1.15,ease:'expo.inOut',delay,clearProps:'clip-path',scrollTrigger:st});
      const img=el.querySelector('img');
      if(img)gsap.from(img,{scale:1.28,duration:1.5,ease:'expo.out',delay,clearProps:'transform',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    }else if(type==='stagger'){
      const sel=el.dataset.sel||'> *';
      const items=sel==='> *'?Array.from(el.children):Array.from(el.querySelectorAll(sel));
      if(items.length)gsap.from(items,{y:64,autoAlpha:0,duration:.85,stagger:.09,ease:'power3.out',delay,...clear,scrollTrigger:st});
    }
  });
}

/* ---------- hero-параллакс ---------- */
if(!reduce){
  const hero={trigger:'.hero',start:'top top',end:'bottom top',scrub:.4};
  gsap.to('.hero-bg',{yPercent:20,ease:'none',scrollTrigger:hero});
  gsap.to('.hero-copy',{yPercent:-12,autoAlpha:0,ease:'none',scrollTrigger:{...hero,end:'85% top'}});
}

/* ---------- бегущие строки: бесшовный цикл + дрейф от скролла ---------- */
if(!reduce){
  $$('.marquee-inner,.bigword-inner').forEach((m,i)=>{
    // контент продублирован дважды → xPercent:-50 бесшовен
    gsap.fromTo(m,{xPercent:i%2?-50:0},{xPercent:i%2?0:-50,ease:'none',duration:i%2?34:22,repeat:-1});
    gsap.fromTo(m,{x:70},{x:-70,ease:'none',scrollTrigger:{trigger:m,start:'top bottom',end:'bottom top',scrub:.6}});
  });
}

/* ---------- счётчики статистики ---------- */
$$('.stat b[data-count]').forEach(b=>{
  const target=parseFloat(b.dataset.count);
  const dec=parseInt(b.dataset.dec||'0',10);
  if(reduce){b.textContent=target.toFixed(dec);return}
  const obj={v:0};
  ScrollTrigger.create({
    trigger:b,start:'top 92%',once:true,
    onEnter:()=>gsap.to(obj,{v:target,duration:1.6,ease:'power2.out',onUpdate:()=>{b.textContent=obj.v.toFixed(dec)}})
  });
});

/* ---------- story: sticky-медиа сменяет кадры ---------- */
if(!reduce){
  const frames=$$('.story-frame');
  const steps=$$('.story-step');
  const badge=$('#storyNum');
  if(frames.length&&steps.length){
    gsap.set(frames[0],{autoAlpha:1,scale:1});
    frames.slice(1).forEach(f=>gsap.set(f,{autoAlpha:0,scale:1.12}));
    steps[0].classList.add('is-active');
    steps.forEach((s,i)=>{
      ScrollTrigger.create({
        trigger:s,start:'top 62%',end:'bottom 62%',
        onToggle:self=>{
          if(!self.isActive)return;
          frames.forEach((f,j)=>{
            gsap.to(f,j===i?{autoAlpha:1,scale:1,duration:.7,ease:'power3.out'}:{autoAlpha:0,scale:1.1,duration:.45,ease:'power2.in'});
          });
          steps.forEach((st,j)=>st.classList.toggle('is-active',j===i));
          if(badge)badge.textContent=String(i+1).padStart(2,'0');
        }
      });
    });
  }
}

/* ---------- origins: горизонтальный скролл-трек (desktop) ---------- */
if(!reduce){
  const mm=gsap.matchMedia();
  mm.add('(min-width:861px)',()=>{
    const track=$('#originsTrack');
    if(!track)return;
    const dist=()=>Math.max(0,track.scrollWidth-innerWidth+60);
    gsap.to(track,{
      x:()=>-dist(),ease:'none',
      scrollTrigger:{trigger:'.origins',start:'top top',end:()=>'+='+(dist()+innerHeight*.5),pin:true,scrub:.55,invalidateOnRefresh:true,anticipatePin:1}
    });
  });
}

/* ---------- roast: pin + прогресс обжарки ---------- */
if(!reduce){
  const stageEls=$$('.stages div');
  const tl=gsap.timeline({scrollTrigger:{trigger:'.roast',start:'top top',end:'+=190%',pin:'.roast-pin',scrub:.5,anticipatePin:1}});
  tl.from('.roast .section-label,.roast h2 span,.roast h2 em',{y:50,autoAlpha:0,stagger:.07,duration:.45,ease:'none'})
    .from('.roast-text',{y:34,autoAlpha:0,duration:.4,ease:'none'},.4)
    .from(stageEls,{x:-45,duration:.45,stagger:.15,ease:'none'},.45)
    .to('.roast-line i',{width:'100%',ease:'none',duration:1.5},.45)
    .to('#roastBeanImg',{rotate:340,scale:1.12,ease:'none',duration:1.9},.2)
    .fromTo('#roastBeanImg',{filter:'grayscale(1) sepia(.4) hue-rotate(50deg) brightness(1.12)'},{filter:'grayscale(0) sepia(0) hue-rotate(0deg) brightness(1)',ease:'none',duration:1.9},.2)
    .to('.roast-glow',{autoAlpha:.9,duration:.9},.5)
    .to('.roast-glow',{autoAlpha:.25,duration:1},1.4);
  // подсветка этапов строго от позиции скролла (детерминированно при scrub)
  stageEls.forEach((s,i)=>{
    const at=.62+i*.42;
    tl.to(s,{opacity:1,duration:.3,ease:'none'},at);
    if(i<stageEls.length-1)tl.to(s,{opacity:.28,duration:.3,ease:'none'},at+.42);
  });
  const tempEl=$('#roastTemp');
  if(tempEl){
    const t={v:180};
    gsap.to(t,{v:228,ease:'none',scrollTrigger:{trigger:'.roast',start:'top top',end:'+=190%',scrub:.5,onUpdate:()=>{tempEl.textContent=Math.round(t.v)+'°C'}}});
  }
}

/* ---------- галерея: фото разъезжаются при скролле ---------- */
if(!reduce){
  const gal={trigger:'.gallery-section',start:'top bottom',end:'center center',scrub:.7};
  gsap.from('.photo-beans',{x:-90,ease:'none',scrollTrigger:gal});
  gsap.from('.photo-bag',{x:120,ease:'none',scrollTrigger:gal});
  gsap.from('.photo-croissant',{y:130,ease:'none',scrollTrigger:gal});
  gsap.from('.photo-tart',{y:160,x:-40,ease:'none',scrollTrigger:gal});
}

/* ---------- bigword и quote ---------- */
if(!reduce){
  gsap.from('.bigword-inner',{scale:.84,ease:'none',scrollTrigger:{trigger:'.bigword',start:'top bottom',end:'center center',scrub:.6}});
  gsap.to('.quote blockquote',{scale:.94,autoAlpha:.2,ease:'none',scrollTrigger:{trigger:'.quote',start:'center center',end:'bottom top',scrub:.6}});
}

/* ---------- FAQ-аккордеон ---------- */
$$('.faq-item').forEach(item=>{
  const q=item.querySelector('.faq-q');
  const a=item.querySelector('.faq-a');
  q?.addEventListener('click',()=>{
    const open=item.classList.toggle('open');
    q.setAttribute('aria-expanded',String(open));
    gsap.to(a,{height:open?a.firstElementChild.offsetHeight:0,duration:.5,ease:'power3.inOut',onComplete:()=>ScrollTrigger.refresh()});
  });
});

/* ---------- 3D-tilt карточек команды ---------- */
if(!reduce&&!isTouch){
  $$('.tilt').forEach(card=>{
    const rx=gsap.quickTo(card,'rotationX',{duration:.5,ease:'power3'});
    const ry=gsap.quickTo(card,'rotationY',{duration:.5,ease:'power3'});
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      ry(((e.clientX-r.left)/r.width-.5)*13);
      rx(-((e.clientY-r.top)/r.height-.5)*11);
    });
    card.addEventListener('mouseleave',()=>{rx(0);ry(0)});
  });
}

/* ---------- магнитные кнопки ---------- */
if(!reduce&&!isTouch){
  $$('.magnetic').forEach(el=>{
    const x=gsap.quickTo(el,'x',{duration:.5,ease:'elastic.out(1,.4)'});
    const y=gsap.quickTo(el,'y',{duration:.5,ease:'elastic.out(1,.4)'});
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      x((e.clientX-(r.left+r.width/2))*.25);
      y((e.clientY-(r.top+r.height/2))*.25);
    });
    el.addEventListener('mouseleave',()=>{x(0);y(0)});
  });
}

/* ---------- кастомный курсор ---------- */
if(!reduce&&!isTouch){
  const cursor=$('#cursor');
  if(cursor){
    const x=gsap.quickTo(cursor,'x',{duration:.3,ease:'power3'});
    const y=gsap.quickTo(cursor,'y',{duration:.3,ease:'power3'});
    let shown=false;
    addEventListener('mousemove',e=>{
      if(!shown){shown=true;gsap.to(cursor,{autoAlpha:1,duration:.3})}
      x(e.clientX);y(e.clientY);
    },{passive:true});
    document.addEventListener('mouseover',e=>{
      cursor.classList.toggle('is-link',!!e.target.closest('a,button,.board,.team-card,.review-card,.event-card,.faq-q'));
    });
  }
}

/* ---------- физика зёрен в герое (matter-js, в духе doubledouble.ru) ----------
   Зёрна падают сверху, сталкиваются, скапливаются внизу и реагируют на мышь
   (невидимое тело-лопатка) и на резкий скролл. enableSleeping — resting-тела
   не считаются, CPU почти нулевой. */
if(typeof Matter!=='undefined'){
  const host=$('#heroPhysics');
  if(host){
    const SOURCES=['bean-1','bean-2','bean-3','bean-4','bean-5','bean-6'].map(n=>'assets/web/'+n+'.webp');
    const imgs=SOURCES.map(s=>{const im=new Image();im.decoding='async';im.src=s;return im});
    const dpr=Math.min(devicePixelRatio||1,1.8);
    const canvas=document.createElement('canvas');
    host.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    let W=0,H=0;

    const drawBean=(im,x,y,r,angle)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.drawImage(im,-r*.81,-r*1.06,r*1.62,r*2.12);
      ctx.restore();
    };

    const layoutCanvas=()=>{
      W=host.clientWidth;H=host.clientHeight;
      if(!W||!H)return false;
      canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
      canvas.style.width=W+'px';canvas.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      return true;
    };

    if(reduce){
      // без движения — статичная композиция в углу героя
      const place=()=>{
        if(!layoutCanvas())return;
        ctx.clearRect(0,0,W,H);
        const spots=[[.62,.82,26],[.71,.87,21],[.79,.83,24],[.87,.88,19],[.55,.9,17],[.94,.85,22]];
        spots.forEach((s,i)=>{
          const im=imgs[i%imgs.length];
          if(im.complete&&im.naturalWidth)drawBean(im,W*s[0],H*s[1],s[2]*(W<600?.8:1),-.4+i*.55);
        });
      };
      imgs.forEach(im=>im.addEventListener('load',place,{once:true}));
      addEventListener('resize',place);
      place();
    }else{
      const engine=Matter.Engine.create({enableSleeping:true});
      const world=engine.world;
      let bodies=[],statics=[],spawned=0,spawnTimer=0;
      let heroVisible=true;
      const heroCopy=$('.hero-copy');

      // Зона для кучи зёрен выбирается по реальному свободному месту:
      //  right  — справа от текста (широкие экраны), стена не пускает зёрна под hero-copy;
      //  bottom — полоса под текстом (узкие), размер зёрен уменьшается, если мало высоты;
      //  hidden — места нет совсем, физику не показываем.
      let zone={mode:'right',left:W*.6,base:30,max:22,hidden:false};
      const computeZone=()=>{
        const def=Math.min(W,H)*.052;
        if(!heroCopy){zone={mode:'right',left:W*.55,base:def,max:isTouch?10:22,hidden:false};return}
        const hr=host.getBoundingClientRect();
        const cr=heroCopy.getBoundingClientRect();
        const copyRight=cr.right-hr.left;
        const copyBottom=cr.bottom-hr.top;
        const rightRoom=W-(copyRight+34);
        if(W>=1100&&rightRoom>=230){
          zone={mode:'right',left:copyRight+34,base:def,max:isTouch?10:22,hidden:false};
          return;
        }
        const clearH=Math.max(0,H-copyBottom);
        // зёрна мельчают, пока слой помещается под текстом
        let base=Math.min(def,clearH*.42);
        if(clearH<26||base<7){zone={mode:'bottom',left:0,base:def,max:0,hidden:true};return}
        const d=base*2.05;
        const perLayer=Math.max(1,Math.floor((W-20)/d));
        const layers=Math.max(1,Math.floor(clearH*.8/(d*.85)));
        const max=Math.max(4,Math.min(perLayer*layers,isTouch?10:14));
        zone={mode:'bottom',left:0,base,max,hidden:false};
      };

      const buildWalls=()=>{
        const t=240;
        Matter.Composite.remove(world,statics);
        statics=[
          Matter.Bodies.rectangle(W/2,H+t/2,W*3,t,{isStatic:true,friction:.6,restitution:.08}),
          Matter.Bodies.rectangle(-t/2,H/2,t,H*4,{isStatic:true}),
          Matter.Bodies.rectangle(W+t/2,H/2,t,H*4,{isStatic:true})
        ];
        if(zone.mode==='right'){
          statics.push(Matter.Bodies.rectangle(zone.left-t/2,H/2,t,H*3,{isStatic:true,friction:.08,restitution:.3}));
        }
        Matter.Composite.add(world,statics);
      };
      const layout=()=>{if(layoutCanvas()){computeZone();buildWalls();host.style.display=zone.hidden?'none':''}};
      layout();

      const spawn=()=>{
        if(spawned>=zone.max||!W||zone.hidden)return;
        const idx=spawned%imgs.length;spawned++;
        const r=zone.base*(.8+Math.random()*.45);
        const lo=zone.mode==='right'?zone.left+r+6:r+10;
        const hi=zone.mode==='right'?W-r-6:W-r-10;
        const x=lo+Math.random()*Math.max(1,hi-lo);
        const y=-r*2-Math.random()*H*.2;
        const b=Matter.Bodies.circle(x,y,r,{restitution:.45,friction:.05,frictionAir:.006,density:.0018,angle:Math.random()*Math.PI*2});
        b.__img=idx;b.__r=r;
        Matter.Composite.add(world,b);
        bodies.push(b);
      };

      // мышь — невидимое статичное тело, двигаем вручную; толкает зёрна
      let paddle=null;
      if(!isTouch){
        paddle=Matter.Bodies.circle(-999,-999,Math.max(50,W*.04),{isStatic:true,label:'paddle'});
        Matter.Composite.add(world,paddle);
        addEventListener('mousemove',e=>{
          const r=host.getBoundingClientRect();
          const x=e.clientX-r.left,y=e.clientY-r.top;
          if(x<-160||y<-160||x>r.width+160||y>r.height+160)return;
          Matter.Body.setPosition(paddle,{x,y});
          bodies.forEach(b=>{
            const dx=b.position.x-x,dy=b.position.y-y;
            if(dx*dx+dy*dy<160*160)Matter.Sleeping.set(b,false);
          });
        },{passive:true});
      }

      // резкий скролл встряхивает кучу
      if(lenis){
        lenis.on('scroll',e=>{
          const v=e.velocity?.y||0;
          if(Math.abs(v)<9||!heroVisible)return;
          const k=Math.min(Math.abs(v)/60,1)*.0016;
          bodies.forEach(b=>{
            Matter.Sleeping.set(b,false);
            Matter.Body.applyForce(b,b.position,{x:(Math.random()-.5)*b.mass*k*8,y:-b.mass*k*Math.sign(v)*3});
          });
        });
      }

      ScrollTrigger.create({trigger:'.hero',start:'top bottom',end:'bottom top',onToggle:s=>{heroVisible=s.isActive}});

      gsap.ticker.add((time,delta)=>{
        if(!heroVisible||document.hidden||!W)return;
        const d=Math.min(delta||16,33);
        if(time>1.7&&spawned<zone.max&&!zone.hidden){spawnTimer+=d;if(spawnTimer>105){spawn();spawnTimer=0}}
        Matter.Engine.update(engine,d);
        ctx.clearRect(0,0,W,H);
        for(const b of bodies){
          const im=imgs[b.__img];
          if(im.complete&&im.naturalWidth)drawBean(im,b.position.x,b.position.y,b.__r,b.angle);
        }
      });

      let rz;
      addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{
        layout();
        if(paddle)Matter.Body.setPosition(paddle,{x:-999,y:-999});
        bodies.forEach(b=>{
          const out=b.position.y>H+300||b.position.x<-100||b.position.x>W+100||
                    (zone.mode==='right'&&b.position.x<zone.left);
          if(out){
            const lo=zone.mode==='right'?zone.left+b.__r+6:b.__r+10;
            const hi=zone.mode==='right'?W-b.__r-6:W-b.__r-10;
            Matter.Body.setPosition(b,{x:lo+Math.random()*Math.max(1,hi-lo),y:-40-Math.random()*80});
            Matter.Body.setVelocity(b,{x:0,y:0});
          }
          Matter.Sleeping.set(b,false);
        });
      },220)});
    }
  }
}

/* ════════════════ СЛОЙ 2: дополнительная динамика ════════════════ */

/* ---------- 1. кофейная пыль: частицы плывут по всей странице ----------
   Рендерим в половину разрешения (точки мягкие — не заметно) и с
   ограничением ~30fps: полноэкранный canvas не должен грузить кадр. */
if(!reduce&&!isTouch){
  const dc=$('#dustCanvas');
  if(dc){
    const dctx=dc.getContext('2d',{alpha:true});
    const SCALE=.5; // внутреннее разрешение относительно CSS-пикселей
    let dw=0,dh=0,motes=[];
    const MOTES=innerWidth<900?22:42;
    const sizeDust=()=>{
      dw=innerWidth;dh=innerHeight;
      dc.width=Math.round(dw*SCALE);dc.height=Math.round(dh*SCALE);
      dc.style.width=dw+'px';dc.style.height=dh+'px';
      dctx.setTransform(SCALE,0,0,SCALE,0,0);
    };
    const make=()=>({x:Math.random()*dw,y:Math.random()*dh,r:.6+Math.random()*1.9,
      vx:(Math.random()-.5)*.14,vy:-(.04+Math.random()*.16),
      a:.12+Math.random()*.3,ph:Math.random()*Math.PI*2,sw:.002+Math.random()*.004});
    sizeDust();
    for(let i=0;i<MOTES;i++)motes.push(make());
    let lastDraw=0;
    gsap.ticker.add(t=>{
      if(document.hidden)return;
      const now=performance.now();
      if(now-lastDraw<30)return; // ~33fps потолок
      lastDraw=now;
      dctx.clearRect(0,0,dw,dh);
      for(const m of motes){
        m.ph+=m.sw*16;
        m.x+=m.vx+Math.sin(m.ph)*.22;
        m.y+=m.vy;
        if(m.y<-6){m.y=dh+6;m.x=Math.random()*dw}
        if(m.x<-6)m.x=dw+6; else if(m.x>dw+6)m.x=-6;
        dctx.globalAlpha=m.a;
        dctx.beginPath();
        dctx.arc(m.x,m.y,m.r,0,6.283);
        dctx.fill();
      }
      dctx.globalAlpha=1;
    });
    dctx.fillStyle='rgba(224,160,96,1)';
    addEventListener('resize',()=>{sizeDust();motes=Array.from({length:MOTES},make)});
  }
}

/* ---------- 2. хвост курсора: 5 догоняющих точек ---------- */
if(!reduce&&!isTouch){
  const trail=$('#cursorTrail');
  if(trail){
    const dots=Array.from(trail.children);
    const quick=dots.map((d,i)=>({x:gsap.quickTo(d,'x',{duration:.28+i*.085,ease:'power2.out'}),
                                   y:gsap.quickTo(d,'y',{duration:.28+i*.085,ease:'power2.out'})}));
    let trailOn=false;
    addEventListener('mousemove',e=>{
      if(!trailOn){trailOn=true;gsap.to(trail,{opacity:1,duration:.4})}
      quick.forEach(q=>{q.x(e.clientX);q.y(e.clientY)});
    },{passive:true});
  }
}

/* ---------- 3. тёплое пятно под курсором в hero ---------- */
if(!reduce&&!isTouch){
  const hero=$('.hero'),glow=$('#heroGlow');
  if(hero&&glow){
    hero.addEventListener('mousemove',e=>{
      const r=hero.getBoundingClientRect();
      glow.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');
      glow.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%');
    },{passive:true});
  }
}

/* ---------- 4. превью доски при наведении на категорию меню ---------- */
if(!reduce&&!isTouch&&innerWidth>900){
  const peek=$('#menuPeek'),peekImg=peek?peek.querySelector('img'):null;
  if(peek&&peekImg){
    gsap.set(peek,{xPercent:-50,yPercent:-50,scale:.7,rotate:-6,autoAlpha:0});
    const px=gsap.quickTo(peek,'x',{duration:.28,ease:'power3'});
    const py=gsap.quickTo(peek,'y',{duration:.28,ease:'power3'});
    let current='',lastX=-1,lastY=-1,activeRow=null,queued=false;
    const HALF=95; // половина ширины/высоты превью (190px)

    // цель по X: справа от курсора с зазором; если справа не влезает — слева
    const targetX=mx=>{
      const right=mx+28+HALF;
      return right<=innerWidth-12 ? right : Math.max(mx-28-HALF,HALF+12);
    };
    const targetY=my=>Math.min(Math.max(my,HALF+12),innerHeight-HALF-12);

    // какой доске соответствует категория меню
    const boardFor=h=>{
      if(/раф|латте со взбит|не кофе|дополни/i.test(h))return 'assets/web/menu-board-coffee-tea.webp';
      if(/авторск|чай/i.test(h))return 'assets/web/menu-board-coffee-tea.webp';
      if(/холодн/i.test(h))return 'assets/web/menu-board-cold.webp';
      if(/сезон/i.test(h))return 'assets/web/menu-board-seasonal.webp';
      if(/макарон/i.test(h))return 'assets/web/macarons-1.webp';
      return 'assets/web/menu-board-coffee-tea.webp';
    };

    const show=row=>{
      if(activeRow&&activeRow!==row)activeRow.classList.remove('hot');
      activeRow=row;
      row.classList.add('hot');
      const col=row.closest('.nav-cat');
      const h4=col?col.querySelector('h4').textContent.trim():'';
      const src=boardFor(h4);
      if(src!==current){current=src;peekImg.src=src}
      // ставим рядом с курсором сразу, без перелёта с прошлой позиции
      if(lastX>=0){gsap.set(peek,{x:targetX(lastX),y:targetY(lastY)})}
      gsap.to(peek,{scale:1,rotate:4,autoAlpha:1,duration:.45,ease:'expo.out',overwrite:'auto'});
    };
    const hide=()=>{
      if(activeRow){activeRow.classList.remove('hot');activeRow=null}
      gsap.to(peek,{scale:.7,rotate:-6,autoAlpha:0,duration:.3,ease:'power2.in',overwrite:'auto'});
    };

    $$('.nav-cat').forEach(row=>{
      row.addEventListener('mouseenter',()=>show(row));
      row.addEventListener('mouseleave',hide);
    });
    addEventListener('mousemove',e=>{
      lastX=e.clientX;lastY=e.clientY;
      px(targetX(e.clientX));
      py(targetY(e.clientY));
    },{passive:true});

    // При скролле колесом курсор стоит на месте: блок уезжает из-под него,
    // а mouseleave может не прийти (плюс skew-трансформ контейнера меняет
    // hit-test). Проверяем сами, что реально под курсором, и прячем превью.
    const recheck=()=>{
      queued=false;
      if(lastX<0)return;
      const under=document.elementFromPoint(lastX,lastY);
      if(!under||!under.closest('.nav-cat'))hide();
    };
    addEventListener('scroll',()=>{
      if(!activeRow||queued)return;
      queued=true;requestAnimationFrame(recheck);
    },{passive:true});
    const lists=$('.menu-nav');
    if(lists)lists.addEventListener('mouseleave',hide);
    addEventListener('resize',hide);
  }
}

/* ---------- 5. skew-искажение лент от скорости скролла ----------
   Наклоняем контейнеры (не карточки) через quickTo — hover-трансформы
   дочерних карточек остаются живы. */
if(!reduce&&lenis){
  const skewBoxes=$$('.boards,.menu-nav,.event-grid,.faq-list,.team-grid,.day-rail');
  const setSkew=skewBoxes.map(el=>gsap.quickTo(el,'skewY',{duration:.6,ease:'power3.out'}));
  let last=0;
  lenis.on('scroll',e=>{
    const v=e.velocity||0;
    const target=gsap.utils.clamp(-4,4,-v*.038);
    if(Math.abs(target-last)>.04){setSkew.forEach(fn=>fn(target));last=target}
    if(Math.abs(v)<8&&last!==0){setSkew.forEach(fn=>fn(0));last=0}
  });
}

/* ---------- 6. бесконечные ленты отзывов в две стороны + drag ---------- */
if(!reduce){
  [['#reviewTrackA',-1,44],['#reviewTrackB',1,54]].forEach(([sel,dir,dur])=>{
    const t=$(sel);
    if(!t)return;
    // дублируем контент для бесшовности
    t.innerHTML+=t.innerHTML;
    const halfW=()=>Math.max(1,t.scrollWidth/2);
    const tw=gsap.fromTo(t,{x:dir<0?0:-halfW()},{x:dir<0?-halfW():0,ease:'none',duration:dur,repeat:-1});
    t.addEventListener('dragstart',e=>e.preventDefault());
    // drag мышью: пауза твина, прогресс от движения, resume
    let down=false,sx=0,p0=0;
    t.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse')return; // тач: вертикальный скролл страницы важнее
      down=true;sx=e.clientX;p0=tw.progress();
      tw.pause();t.classList.add('is-dragging');
      try{t.setPointerCapture(e.pointerId)}catch(_){}
    });
    t.addEventListener('pointermove',e=>{
      if(!down)return;
      const d=(e.clientX-sx)/halfW();
      tw.progress(((p0+dir*-d)%1+1)%1);
    });
    const up=()=>{if(!down)return;down=false;t.classList.remove('is-dragging');tw.resume()};
    t.addEventListener('pointerup',up);t.addEventListener('pointercancel',up);
  });
}

/* ---------- 7. стопка карточек: предыдущая чуть уходит вглубь ----------
   Намеренно БЕЗ затемнения: следующая карта всё равно накрывает предыдущую,
   а видимая сверху кромка не должна «гаснуть» — это читалось как баг. */
if(!reduce&&innerWidth>860){
  const cards=$$('.stack-card');
  cards.forEach((c,i)=>c.style.setProperty('--i',i));
  cards.forEach((c,i)=>{
    if(i===cards.length-1)return;
    gsap.to(c,{scale:.96,ease:'none',
      scrollTrigger:{trigger:cards[i+1],start:'top bottom',end:'top 20%',scrub:.4}});
  });
  gsap.from(cards,{y:90,autoAlpha:0,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'.stack-cards',start:'top 82%',once:true}});
}

/* ---------- 8. буквы bigword подсвечиваются волной при скролле ---------- */
if(!reduce){
  const bw=$('#bigwordInner');
  if(bw){
    // обернём слова в <b>, чтобы красить их по одному
    bw.querySelectorAll('span').forEach(sp=>{
      const parts=sp.textContent.split(/(✦|\s+)/);
      sp.textContent='';
      parts.forEach(w=>{
        if(!w)return;
        if(w==='✦'||/^\s+$/.test(w)){sp.appendChild(document.createTextNode(w));return}
        const b=document.createElement('b');b.textContent=w;sp.appendChild(b);
      });
    });
    const bs=Array.from(bw.querySelectorAll('b'));
    bs.forEach(b=>b.style.color='#f3e9dd2e');
    // одна общая волна: подсвечиваем буквы, попавшие в «окно» прогресса скролла
    ScrollTrigger.create({
      trigger:'.bigword',start:'top 95%',end:'bottom 5%',
      onUpdate:self=>{
        const p=self.progress;
        const center=-2+p*(bs.length+4);
        bs.forEach((b,i)=>{
          const d=Math.abs(i-center);
          b.style.color=d<1.4?'#e0a060':'#f3e9dd2e';
        });
      }
    });
  }
}

/* ---------- 9. drag горизонтального трека origins (пиннутый скролл) ---------- */
if(!reduce){
  const t=$('#originsTrack');
  if(t&&innerWidth>860){
    let down=false,sx=0;
    t.addEventListener('dragstart',e=>e.preventDefault());
    t.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.target.closest('a,button'))return;
      down=true;sx=e.clientX;t.classList.add('is-dragging');
      try{t.setPointerCapture(e.pointerId)}catch(_){}
    });
    t.addEventListener('pointermove',e=>{
      if(!down)return;
      const dx=sx-e.clientX;
      if(Math.abs(dx)>2){sx=e.clientX;scrollBy({left:0,top:dx*.9})}
    });
    const up=()=>{down=false;t.classList.remove('is-dragging')};
    t.addEventListener('pointerup',up);t.addEventListener('pointercancel',up);
  }
}

/* ---------- 10. параллакс фото в галерее от движения мыши ----------
   Мышь управляет xPercent/yPercent, скролл-scrub — x/y: разные свойства
   GSAP комбинирует, конфликта нет. */
if(!reduce&&!isTouch){
  $$('.gallery-photo').forEach((ph,i)=>{
    const dx=gsap.quickTo(ph,'xPercent',{duration:.9,ease:'power3'});
    const dy=gsap.quickTo(ph,'yPercent',{duration:.9,ease:'power3'});
    const depth=(i%3+1)*2.4;
    addEventListener('mousemove',e=>{
      dx(((e.clientX/innerWidth)-.5)*depth*-1);
      dy(((e.clientY/innerHeight)-.5)*depth*-1);
    },{passive:true});
  });
}

/* ---------- 12. hero-заголовок: мягкий 3D-наклон за мышью ---------- */
if(!reduce&&!isTouch){
  const h1=$('.hero h1');
  if(h1){
    const rx=gsap.quickTo(h1,'rotateX',{duration:.9,ease:'power3'});
    const ry=gsap.quickTo(h1,'rotateY',{duration:.9,ease:'power3'});
    h1.style.transformStyle='preserve-3d';
    addEventListener('mousemove',e=>{
      ry(((e.clientX/innerWidth)-.5)*7);
      rx(-((e.clientY/innerHeight)-.5)*5);
    },{passive:true});
  }
}

/* ---------- 13. лайтбокс досок меню ---------- */
{
  const lb=$('#lightbox'),lbImg=$('#lbImg'),lbCap=$('#lbCap'),lbClose=$('#lbClose');
  if(lb&&lbImg){
    const open=src=>{
      lbImg.src=src.dataset.full;
      lbImg.alt=src.querySelector('img')?.alt||'Меню';
      lbCap.textContent=src.dataset.cap||'';
      lb.hidden=false;
      requestAnimationFrame(()=>lb.classList.add('is-open'));
      document.body.classList.add('lb-open');
      lbClose.focus({preventScroll:true});
    };
    const close=()=>{
      lb.classList.remove('is-open');
      document.body.classList.remove('lb-open');
      setTimeout(()=>{lb.hidden=true;lbImg.src=''},420);
    };
    $$('.board').forEach(b=>b.addEventListener('click',()=>open(b)));
    lbClose.addEventListener('click',close);
    lb.addEventListener('click',e=>{if(e.target===lb)close()});
    addEventListener('keydown',e=>{if(e.key==='Escape'&&!lb.hidden)close()});
  }
}

/* ---------- refresh ---------- */
addEventListener('load',()=>ScrollTrigger.refresh());
let rT;addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>ScrollTrigger.refresh(),300)});
})();
