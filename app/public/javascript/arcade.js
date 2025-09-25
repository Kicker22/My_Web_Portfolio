// Background Arcade (proper hit test; connecting lines; global click-to-hit)
(() => {
  const cvs = document.getElementById('bg-arcade');
  const ctx = cvs.getContext('2d');
  let dpr = window.devicePixelRatio || 1, W = 0, H = 0;
  let dots = [], running = true, last = 0, fpsAvg = 60;
  let score = 0, high = parseInt(localStorage.getItem('bgHigh') || '0', 10);
  const scoreEl = document.getElementById('bgScore'),
        highEl  = document.getElementById('bgHigh'),
        toggleBtn = document.getElementById('bgToggle');
  highEl.textContent = String(high);
  const motionReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    dpr = window.devicePixelRatio || 1;
    W = cvs.width  = Math.floor(window.innerWidth  * dpr);
    H = cvs.height = Math.floor(window.innerHeight * dpr);
    cvs.style.width  = window.innerWidth  + 'px';
    cvs.style.height = window.innerHeight + 'px';
    adjustDensity(density());
  }
  function density(){
    const area = (W/dpr) * (H/dpr);
    const base = motionReduce ? 12 : 28;
    const max  = motionReduce ? 36 : 80;
    return Math.min(max, Math.round(base + area/40000));
  }
  function adjustDensity(target){
    while (dots.length < target) dots.push(spawn());
    if (dots.length > target) dots.length = target;
  }
  function rand(a,b){ return a + Math.random()*(b-a); }
  function spawn(x = rand(0,W), y = rand(0,H)){
    const sp = motionReduce ? rand(.03,.08) : rand(.05,.14);
    const ang = rand(0, Math.PI*2), r = rand(10,22)*dpr;
    return { x, y, vx: Math.cos(ang)*sp*W, vy: Math.sin(ang)*sp*H, r, pulse: rand(0, Math.PI*2), life: rand(5,12), age: 0 };
  }

  function drawLinks(){
    const max = (motionReduce ? 90 : 140)*dpr, max2 = max*max;
    ctx.lineWidth = 1.25 * dpr;
    for (let i=0;i<dots.length;i++){
      const a = dots[i];
      for (let j=i+1;j<dots.length;j++){
        const b = dots[j], dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
        if (d2 < max2){
          const t = 1 - d2/max2;
          ctx.strokeStyle = `rgba(0,180,255,${0.20 * t})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
  }
  function drawDots(dt){
    for (const d of dots){
      d.pulse += dt * (motionReduce ? 3 : 6);
      const r = d.r*(1+Math.sin(d.pulse)*0.06);
      const g = ctx.createRadialGradient(d.x,d.y,r*0.25,d.x,d.y,r);
      g.addColorStop(0,'rgba(0,200,255,0.9)');
      g.addColorStop(1,'rgba(0,110,255,0.05)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x,d.y,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(d.x,d.y,Math.max(1.5*dpr,r*0.18),0,Math.PI*2); ctx.fill();
    }
  }
  function update(dt){
    adjustDensity(density());
    for (let i=dots.length-1;i>=0;i--){
      const d = dots[i]; d.age+=dt; d.x+=d.vx*dt; d.y+=d.vy*dt;
      if (d.x<d.r&&d.vx<0) d.vx*=-1; if (d.x>W-d.r&&d.vx>0) d.vx*=-1;
      if (d.y<d.r&&d.vy<0) d.vy*=-1; if (d.y>H-d.r&&d.vy>0) d.vy*=-1;
      if (d.age>d.life) dots[i]=spawn();
    }
  }
  function loop(ts){
    if (!running){ requestAnimationFrame(loop); return; }
    if (!last) last = ts;
    const dt = Math.min(0.05,(ts-last)/1000); last=ts;
    fpsAvg = fpsAvg*0.9 + (1/dt)*0.1;

    ctx.clearRect(0,0,W,H);
    drawLinks();
    drawDots(dt);
    update(dt);

    if (fpsAvg<30 && dots.length>20) dots.length = Math.floor(dots.length*0.85);
    requestAnimationFrame(loop);
  }

  // ----- Hit testing -----
  function toCanvasXY(clientX, clientY){
    const rect = cvs.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W/rect.width),
      y: (clientY - rect.top)  * (H/rect.height)
    };
  }
  function nearest(px,py){
    let best=-1, bestD2=Infinity;
    for (let i=0;i<dots.length;i++){
      const d=dots[i], dx=d.x-px, dy=d.y-py, d2=dx*dx+dy*dy;
      if (d2<bestD2){ bestD2=d2; best=i; }
    }
    return { index: best, dist2: bestD2 };
  }
  function rippleMiss(x,y){
    const start = performance.now(), dur = 250;
    const anim = (t)=>{
      const k = Math.min(1, (t-start)/dur);
      const r = 24*dpr + 80*dpr*k;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.strokeStyle = `rgba(255,255,255,${0.25*(1-k)})`;
      ctx.lineWidth = 2*dpr;
      ctx.stroke();
      if (k<1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }
function burstHit(x, y) {
  const N = 20; // number of motes per burst
  const parts = [];
  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(60, 220) * dpr;
    parts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.6, 1.2), // seconds to live
      age: 0,
      size: rand(2, 5) * dpr
    });
  }

  const start = performance.now();
  function animate(t) {
    const dt = Math.min(0.05, (t - (animate.last || start)) / 1000);
    animate.last = t;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // makes motes glow

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) {
        parts.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96; // friction
      p.vy *= 0.96;

      const alpha = 1 - (p.age / p.life);
      const r = p.size * (1 + alpha * 0.8); // shrink slightly
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(0, 200, 255, ${0.9 * alpha})`);
      g.addColorStop(1, `rgba(0, 110, 255, 0)`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (parts.length) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

  function tryHit(clientX, clientY){
    const {x, y} = toCanvasXY(clientX, clientY);
    const {index, dist2} = nearest(x,y);
    if (index < 0) return;

    const d = dots[index];
    const hitRadius = d.r * 1.05;
    const isHit = dist2 <= hitRadius*hitRadius;

    if (!isHit){ rippleMiss(x,y); return; }

    dots[index] = spawn(x,y);
    score += 5;
    scoreEl.textContent = String(score);
    if (score > high){
      high = score;
      localStorage.setItem('bgHigh', String(high));
      highEl.textContent = String(high);
    }
    burstHit(x,y);
  }

  function isInteractive(el){
    return el.closest('a, button, [role="button"], input, textarea, select, label, .cmdk, .hud, .navbar');
  }

  // Global click/touch (don’t hijack UI)
  document.addEventListener('click', (e)=>{
    if (isInteractive(e.target)) return;
    tryHit(e.clientX, e.clientY);
  }, { passive: true });
  document.addEventListener('touchstart', (e)=>{
    const t = e.touches && e.touches[0]; if (!t) return;
    if (isInteractive(e.target)) return;
    tryHit(t.clientX, t.clientY);
  }, { passive: true });

  // Canvas direct handlers (also fine)
  cvs.addEventListener('click', e => tryHit(e.clientX, e.clientY), { passive:true });
  cvs.addEventListener('touchstart', e => { if(e.touches[0]) tryHit(e.touches[0].clientX, e.touches[0].clientY); }, { passive:true });

  // Lifecycle
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden && !motionReduce;
    toggleBtn.textContent = running ? 'Pause' : 'Play';
  });
  toggleBtn.addEventListener('click', () => {
    running = !running; toggleBtn.textContent = running ? 'Pause' : 'Play';
  });

  // Init
  resize(); if (motionReduce) running = false; requestAnimationFrame(loop);
})();
