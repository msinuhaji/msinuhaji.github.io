const els = [...document.querySelectorAll('[data-parallax]')];

// Store base transforms
els.forEach(el => {
  el.dataset.baseTransform = el.style.transform || '';
});

let targetScrollY = 0;
let smoothScrollY = 0;

const lerp = (start, end, factor) => start + (end - start) * factor;

const update = () => {
  smoothScrollY = lerp(smoothScrollY, targetScrollY, 0.05);
  window.scrollTo(0, smoothScrollY);
  
  els.forEach(el => {
    const speed = el.dataset.parallax || 0.5;
    const parallaxY = smoothScrollY * speed;
    
    // Get base transform and remove any existing translateY
    let transform = el.dataset.baseTransform;
    transform = transform.replace(/translateY\([^)]*\)\s*/g, '');
    
    // Add parallax translateY
    transform = `translateY(${parallaxY}px) ${transform}`.trim();
    
    el.style.transform = transform;
  });
  
  requestAnimationFrame(update);
};

let isScrolling = false;

document.addEventListener('wheel', (e) => {
  e.preventDefault();
  targetScrollY += e.deltaY;
  targetScrollY = Math.max(0, Math.min(targetScrollY, document.documentElement.scrollHeight - window.innerHeight));
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

requestAnimationFrame(update);