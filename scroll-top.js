/* HP Shop — bouton "Retour en haut" mascotte Happy Price (composant global auto-injecté) */
/* Conscient des modales : remonte aussi le haut de la page commande (#pdOverlay) et du checkout panier (#ccoBody). */
(function () {
  if (window.__hpScrollTop) return;
  window.__hpScrollTop = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = ''
    + '.hpstop{position:fixed;right:2rem;bottom:calc(2rem + 74px);width:56px;height:56px;border-radius:50%;border:none;padding:4px;cursor:pointer;z-index:390;'
    + '-webkit-tap-highlight-color:transparent;opacity:0;visibility:hidden;transform:translateY(16px);'
    + 'background:conic-gradient(from -90deg,#CE1126 0deg,#FCD116 calc(var(--p,0)*1.8deg),#009460 calc(var(--p,0)*3.6deg),rgba(120,120,120,.20) calc(var(--p,0)*3.6deg) 360deg);'
    + 'transition:opacity .35s ease,transform .35s cubic-bezier(.34,1.56,.64,1);}'
    + '.hpstop.hpstop-modal{z-index:585;}'
    + '.hpstop.show{opacity:1;visibility:visible;transform:translateY(0);}'
    + '.hpstop-face{width:100%;height:100%;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.18);}'
    + '.hpstop svg{width:32px;height:32px;display:block;}'
    + '.hpstop-smile{transform-box:fill-box;transform-origin:center;transition:transform .25s ease;}'
    + '.hpstop:hover{transform:translateY(-4px) scale(1.1);}'
    + '.hpstop:hover .hpstop-smile{transform:scaleX(1.25) scaleY(1.18);}'
    + '.hpstop:focus-visible{outline:3px solid #378ADD;outline-offset:3px;}'
    + '.hpstop.takeoff{animation:hpstopTake .5s ease;}'
    + '@keyframes hpstopTake{0%{transform:translateY(0)}35%{transform:translateY(-14px) scale(1.08)}100%{transform:translateY(0)}}'
    + '@media(max-width:768px){.hpstop{right:2rem;bottom:162px;width:48px;height:48px;}.hpstop svg{width:27px;height:27px;}}'
    + '@media(prefers-reduced-motion:reduce){.hpstop{transition:opacity .2s ease;transform:none;}.hpstop.show{transform:none;}.hpstop:hover{transform:none;}.hpstop:hover .hpstop-smile{transform:none;}.hpstop.takeoff{animation:none;}.hpstop-smile{transition:none;}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var svg = ''
    + '<svg viewBox="0 0 48 48" aria-hidden="true">'
    + '<defs><clipPath id="hpstopBag"><path d="M12 17h24a3 3 0 0 1 3 3.2l-1.4 17a3.2 3.2 0 0 1-3.2 2.8H13.6a3.2 3.2 0 0 1-3.2-2.8L9 20.2a3 3 0 0 1 3-3.2Z"/></clipPath></defs>'
    + '<g clip-path="url(#hpstopBag)"><rect x="8" y="16" width="10.7" height="27" fill="#CE1126"/><rect x="18.7" y="16" width="10.6" height="27" fill="#FCD116"/><rect x="29.3" y="16" width="11" height="27" fill="#009460"/></g>'
    + '<path d="M12 17h24a3 3 0 0 1 3 3.2l-1.4 17a3.2 3.2 0 0 1-3.2 2.8H13.6a3.2 3.2 0 0 1-3.2-2.8L9 20.2a3 3 0 0 1 3-3.2Z" fill="none" stroke="#111" stroke-width="2.4"/>'
    + '<path d="M17 17v-2.5a7 7 0 0 1 14 0V17" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"/>'
    + '<path d="M18 27q2-2.4 4 0" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M26 27q2-2.4 4 0" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>'
    + '<path class="hpstop-smile" d="M18 31q6 6 12 0" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>'
    + '</svg>';

  var btn = document.createElement('button');
  btn.className = 'hpstop';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Retour en haut de la page');
  btn.style.setProperty('--p', '0');
  btn.innerHTML = '<span class="hpstop-face">' + svg + '</span>';

  function byId(id) { return document.getElementById(id); }
  function shown(id) { var el = byId(id); return el && el.classList.contains('show'); }

  /* Modales de commande à défilement interne : { déclencheur .show , élément qui scrolle } */
  var SCROLL_MODALS = [
    { open: 'cartCheckoutOverlay', scroller: 'ccoBody' },
    { open: 'pdOverlay', scroller: 'pdOverlay' }
  ];
  /* Modales "bloquantes" : quand elles sont ouvertes, on cache le bouton */
  var BLOCK_MODALS = ['recapOverlay', 'successOverlay', 'nlOverlay', 'cartOverlay'];

  function activeScroller() {
    for (var i = 0; i < SCROLL_MODALS.length; i++) {
      if (shown(SCROLL_MODALS[i].open)) return byId(SCROLL_MODALS[i].scroller);
    }
    return null;
  }
  function isBlocked() {
    for (var i = 0; i < BLOCK_MODALS.length; i++) { if (shown(BLOCK_MODALS[i])) return true; }
    return false;
  }

  function mount() {
    document.body.appendChild(btn);
    onScroll();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  var ticking = false;
  function update() {
    ticking = false;
    if (isBlocked()) { btn.classList.remove('show'); return; }
    var sc = activeScroller();
    var y, docH;
    if (sc) {
      y = sc.scrollTop;
      docH = sc.scrollHeight - sc.clientHeight;
      btn.classList.add('hpstop-modal');
    } else {
      y = window.pageYOffset || document.documentElement.scrollTop || 0;
      docH = document.documentElement.scrollHeight - window.innerHeight;
      btn.classList.remove('hpstop-modal');
    }
    var p = docH > 0 ? Math.min(100, Math.max(0, (y / docH) * 100)) : 0;
    btn.style.setProperty('--p', p.toFixed(1));
    if (y > 300) btn.classList.add('show');
    else btn.classList.remove('show');
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  ['pdOverlay', 'ccoBody'].forEach(function (id) {
    var el = byId(id);
    if (el) el.addEventListener('scroll', onScroll, { passive: true });
  });

  /* Recalcule quand une modale s'ouvre/se ferme (changement de classe) */
  if (window.MutationObserver) {
    var mo = new MutationObserver(onScroll);
    ['pdOverlay', 'cartCheckoutOverlay'].concat(BLOCK_MODALS).forEach(function (id) {
      var el = byId(id);
      if (el) mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  btn.addEventListener('click', function () {
    if (!reduce) {
      btn.classList.remove('takeoff');
      void btn.offsetWidth;
      btn.classList.add('takeoff');
    }
    var sc = activeScroller();
    (sc || window).scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();
