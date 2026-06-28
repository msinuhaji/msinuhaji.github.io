const els = [...document.querySelectorAll('[data-parallax]')];

els.forEach(el => {
  const computed = getComputedStyle(el).transform;
  el._base = computed === 'none' ? '' : computed;
  el._speed = parseFloat(el.dataset.parallax) || 0.5;
  el._offsetTop = el.getBoundingClientRect().top + window.scrollY;
});

let target = 0, current = 0;

document.addEventListener('wheel', e => {
  e.preventDefault();
  target = Math.max(0, Math.min(
    target + e.deltaY,
    document.documentElement.scrollHeight - innerHeight
  ));
}, { passive: false });

(function tick() {
  current += (target - current) * 0.1;
  window.scrollTo(0, current);

  els.forEach(({ style, _base, _speed, _offsetTop }) => {
    const relativeScroll = current - _offsetTop;
    style.transform = `translateY(${relativeScroll * _speed}px) ${_base}`;
  });

  requestAnimationFrame(tick);
})();