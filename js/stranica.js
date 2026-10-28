(() => {
  // Izbornik na telefonu: ☰ otvara listu linkova, klik van nje ili Esc je zatvara
  const top = document.querySelector('.top'), menuBtn = top && top.querySelector('.menu-btn');
  if (menuBtn) {
    const setMenu = open => { top.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
    menuBtn.addEventListener('click', () => setMenu(!top.classList.contains('open')));
    document.addEventListener('click', e => { if (!top.contains(e.target) || e.target.closest('nav a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  // Laserska linija prelazi cijelu širinu svoje slike
  const lasers = [...document.querySelectorAll('.laser')];
  const fit = () => lasers.forEach(l => l.style.setProperty('--w', l.parentElement.clientWidth + 'px'));
  fit();
  addEventListener('resize', fit);

  // Sekcije ispod prvog ekrana ulaze odozdo kad dođu u pogled; ono što je već vidljivo ostaje kako jeste
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const els = [...document.querySelectorAll('.rv')].filter(el => el.getBoundingClientRect().top > innerHeight * .9);
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.remove('wait');
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  for (const el of els) { el.classList.add('wait'); io.observe(el); }
})();
