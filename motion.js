/* Crónicas del Aventurero — capa experimental de microinteracciones.
   No toca estado, reglas, almacenamiento ni el árbol de navegación. */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = () => !reduce.matches;
  const gsap = () => window.gsap;
  const kill = target => gsap()?.killTweensOf(target);

  const style = document.createElement('style');
  style.textContent = `
    .motion-press { will-change: transform, filter; }
    .motion-feedback { animation: motionFeedback .42s cubic-bezier(.2,.8,.2,1) both; }
    .motion-select { animation: motionSelect .32s cubic-bezier(.2,.8,.2,1) both; }
    .motion-tab-shift { animation: motionTabShift .48s cubic-bezier(.16,1,.3,1) both; }
    .motion-field-active { box-shadow: 0 0 0 3px rgba(var(--accent-rgb),.13), 0 0 20px rgba(var(--accent-rgb),.08) !important; }
    .spell-card.motion-open, .feature-card.motion-open { box-shadow: 0 10px 25px rgba(0,0,0,.16), 0 0 0 1px rgba(var(--accent-rgb),.12); }
    .item-card.motion-selected, .inv-cell.motion-selected { animation: motionSelect .34s cubic-bezier(.2,.8,.2,1) both; }
    .bag-tabs .btn.active { box-shadow: 0 0 0 1px rgba(var(--accent-rgb),.22), 0 8px 16px rgba(0,0,0,.15); }
    #transition-fog .motion-veil { position:absolute; inset:-12%; z-index:3; pointer-events:none; opacity:0; background:linear-gradient(108deg,transparent 12%,rgba(234,241,239,.045) 34%,rgba(var(--accent-rgb),.10) 50%,rgba(234,241,239,.04) 66%,transparent 88%); mix-blend-mode:screen; will-change:transform,opacity; }
    #transition-fog.fog-combat .motion-veil { background:linear-gradient(108deg,transparent 12%,rgba(255,180,150,.045) 34%,rgba(190,65,67,.13) 50%,rgba(255,180,150,.04) 66%,transparent 88%); }
    #transition-fog.motion-cinematic-active::after { content:''; position:absolute; inset:0; z-index:4; pointer-events:none; opacity:0; background:radial-gradient(ellipse at 50% 48%, transparent 22%, rgba(5,10,15,.05) 54%, rgba(2,6,10,.30) 100%); animation: motionVignette .72s cubic-bezier(.22,1,.36,1) both; }
    .battle-portrait .hp-spark { position:absolute; z-index:5; width:var(--spark-size,4px); height:var(--spark-size,4px); left:var(--spark-x); top:var(--spark-y); border-radius:50%; pointer-events:none; background:var(--spark-color); box-shadow:0 0 5px var(--spark-color),0 0 12px var(--spark-glow); will-change:transform,opacity; }
    .hp-arc.motion-health-glow.health-heal .hp { filter:drop-shadow(0 0 6px rgba(125,255,177,.95)) drop-shadow(0 0 16px rgba(61,214,124,.78)) drop-shadow(0 0 27px rgba(61,214,124,.36)); }
    .hp-arc.motion-health-glow.health-temp .temp { filter:drop-shadow(0 0 6px rgba(137,215,255,.98)) drop-shadow(0 0 16px rgba(62,164,255,.82)) drop-shadow(0 0 27px rgba(62,164,255,.38)); }
    .combat-prepared-inline { margin-top:2px; }
    .combat-prepared-inline .spell-cards { margin-top:12px; }
    /* Los espacios mantienen sus mismos nodos y controles: esta capa solo
       sustituye su aspecto por el emblema de la clase activa. */
    .slot-card .dots { gap:6px; min-height:30px; align-items:center; }
    .slot-card .dot.spell-slot-icon { width:26px; height:26px; border:0; border-radius:0; background:transparent; display:grid; place-items:center; overflow:visible; opacity:1; }
    .slot-card .dot.spell-slot-icon img { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,.52)) drop-shadow(0 0 5px rgba(var(--accent-rgb),.28)); transition:filter .25s ease, opacity .25s ease, transform .25s ease; }
    .slot-card .dot.spell-slot-icon:not(.used) img { animation: spellSlotReady 2.9s ease-in-out infinite; }
    .slot-card .dot.spell-slot-icon.used { opacity:1; }
    .slot-card .dot.spell-slot-icon.used img { opacity:.27; filter:grayscale(1) brightness(.62) drop-shadow(0 1px 2px rgba(0,0,0,.7)); transform:scale(.86); }
    @keyframes spellSlotReady { 0%,100% { filter:drop-shadow(0 2px 4px rgba(0,0,0,.52)) drop-shadow(0 0 4px rgba(var(--accent-rgb),.2)); } 50% { filter:drop-shadow(0 2px 4px rgba(0,0,0,.52)) drop-shadow(0 0 9px rgba(var(--accent-rgb),.52)); } }
    .turn-counter { display:none !important; }
    .nav-3d.motion-nav-pressed, .subnav button.motion-nav-pressed, .mobile-nav button.motion-nav-pressed { color:var(--a2); }
    @keyframes motionFeedback { 0% { transform: translateY(1px) scale(.985); filter:brightness(.96); } 52% { transform: translateY(-1px) scale(1.012); filter:brightness(1.12); } 100% { transform:none; filter:none; } }
    @keyframes motionSelect { 0% { transform:scale(.975); opacity:.7; } 100% { transform:none; opacity:1; } }
    @keyframes motionTabShift { 0% { transform:translateX(-5px); opacity:.55; } 100% { transform:none; opacity:1; } }
    @keyframes motionVignette { 0% { opacity:0; } 30% { opacity:1; } 100% { opacity:0; } }
    @media (max-width: 520px) { .slot-card .dot.spell-slot-icon { width:23px; height:23px; } .slot-card .dots { gap:4px; } }
    @media (prefers-reduced-motion: reduce) { .motion-feedback, .motion-select, .motion-tab-shift, #transition-fog.motion-cinematic-active::after, .slot-card .dot.spell-slot-icon img { animation:none !important; } }
  `;
  document.head.appendChild(style);

  const SPELL_ICON_ROOT = 'assets/spell-icons/';
  const SPELL_CLASS_ICONS = Object.freeze({
    artifice: 'Icono_Artifice.png', barbaro: 'Icono_Barbaro.png', bardo: 'Icono_Bardo.png',
    brujo: 'Icono_Brujo.png', clerigo: 'Icono_Clerigo.png', druida: 'Icono_Druida.png',
    explorador: 'Icono_Explorador.png', guerrero: 'Icono_Guerrero.png', hechicero: 'Icono_Hechicero.png',
    mago: 'Icono_Mago.png', monje: 'Icono_Monje.png', paladin: 'Icono_Paladin.png',
    picaro: 'Icono_Picaro.png', pugilista: 'Icono_Pugilista.png'
  });
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function activeSpellClass() {
    const text = normalized(document.querySelector('#top-profile small')?.textContent);
    return Object.keys(SPELL_CLASS_ICONS).find(key => text.includes(key)) || null;
  }
  function replaceSlotDotsWithIcons() {
    const key = activeSpellClass();
    if (!key) return;
    const src = `${SPELL_ICON_ROOT}${SPELL_CLASS_ICONS[key]}`;
    document.querySelectorAll('.slot-card .dots .dot').forEach(dot => {
      dot.classList.add('spell-slot-icon');
      if (dot.dataset.spellIcon === src) return;
      dot.dataset.spellIcon = src;
      dot.replaceChildren();
      const icon = document.createElement('img');
      icon.src = src;
      icon.alt = dot.classList.contains('used') ? `Espacio de conjuro de ${key} gastado` : `Espacio de conjuro de ${key} disponible`;
      icon.loading = 'lazy';
      icon.decoding = 'async';
      dot.appendChild(icon);
    });
  }

  function feedback(element) {
    if (!element || !canAnimate()) return;
    kill(element);
    if (gsap()) {
      gsap().fromTo(element, { scale: .985, y: 1, filter: 'brightness(.97)' }, { scale: 1, y: 0, filter: 'brightness(1)', duration: .32, ease: 'power2.out', clearProps: 'transform,filter' });
      return;
    }
    element.classList.remove('motion-feedback');
    void element.offsetWidth;
    element.classList.add('motion-feedback');
  }

  function enterView() {
    if (!canAnimate()) return;
    const view = document.getElementById('view');
    if (!view) return;
    const nodes = [...view.querySelectorAll(':scope > .hero, :scope > .panel, :scope > .grid, :scope > .mobile-subnav')];
    if (!nodes.length) return;
    kill(nodes);
    if (gsap()) {
      const inner = [...view.querySelectorAll(':scope > .grid > .panel, :scope > .panel .spell-card, :scope > .panel .item-card')].slice(0, 12);
      const timeline = gsap().timeline({ defaults: { overwrite: 'auto' } });
      timeline.fromTo(nodes, { opacity: 0, y: 14, scale: .992 }, { opacity: 1, y: 0, scale: 1, duration: .42, stagger: .035, ease: 'power3.out', clearProps: 'opacity,transform' });
      if (inner.length) timeline.fromTo(inner, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: .26, stagger: .018, ease: 'power2.out', clearProps: 'opacity,transform' }, '-=.27');
    } else {
      nodes.forEach((node, index) => {
        node.animate([{ opacity: .1, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: index * 22, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).finished.catch(() => {}).finally(() => node.getAnimations().forEach(animation => animation.cancel()));
      });
    }
  }

  // Renders caused by navigation occur while the fog is present. Other renders
  // (vida, estadísticas, mochila) deliberately skip this entrance animation.
  const view = document.getElementById('view');
  let combatLayoutQueued = false;
  function arrangeCombatPanel() {
    if (!view?.querySelector('.battle-portrait')) return;
    view.querySelector('.turn-counter')?.remove();
    const panels = [...view.querySelectorAll('.grid.main-split .grid > .panel')];
    const slotsPanel = panels.find(panel => panel.querySelector('h2')?.textContent.includes('Espacios de conjuro'));
    const preparedPanel = [...view.children].find(node => node.classList?.contains('panel') && node.querySelector('h2')?.textContent.includes('Conjuros preparados'));
    if (!slotsPanel || !preparedPanel) return;
    const inline = document.createElement('section');
    inline.className = 'combat-prepared-inline';
    inline.append(...preparedPanel.childNodes);
    const separator = document.createElement('div');
    separator.className = 'separator';
    slotsPanel.append(separator, inline);
    preparedPanel.remove();
  }
  function scheduleCombatLayout() {
    if (combatLayoutQueued) return;
    combatLayoutQueued = true;
    requestAnimationFrame(() => {
      combatLayoutQueued = false;
      arrangeCombatPanel();
      replaceSlotDotsWithIcons();
    });
  }
  if (view) new MutationObserver(() => {
    if (document.getElementById('transition-fog')?.classList.contains('active')) requestAnimationFrame(enterView);
    scheduleCombatLayout();
  }).observe(view, { childList: true });
  scheduleCombatLayout();
  requestAnimationFrame(replaceSlotDotsWithIcons);

  function emitHealthParticles(type) {
    if (!canAnimate()) return;
    const portrait = document.querySelector('.battle-portrait');
    const arc = portrait?.querySelector('.hp-arc');
    if (!portrait || !arc) return;
    portrait.querySelectorAll('.hp-spark').forEach(spark => spark.remove());
    arc.classList.remove('motion-health-glow', 'health-heal', 'health-temp');
    arc.classList.add('motion-health-glow', type === 'heal' ? 'health-heal' : 'health-temp');
    const color = type === 'heal' ? '#8ff6b9' : '#9bdbff';
    const glow = type === 'heal' ? 'rgba(63,220,128,.82)' : 'rgba(64,165,255,.86)';
    const count = innerWidth < 640 ? 12 : 20;
    for (let index = 0; index < count; index += 1) {
      const angle = (-155 + Math.random() * 250) * Math.PI / 180;
      const radius = 42 + Math.random() * 4;
      const spark = document.createElement('i');
      spark.className = 'hp-spark';
      spark.style.setProperty('--spark-x', `${50 + Math.cos(angle) * radius}%`);
      spark.style.setProperty('--spark-y', `${50 + Math.sin(angle) * radius}%`);
      spark.style.setProperty('--spark-size', `${1.5 + Math.random() * 3}px`);
      spark.style.setProperty('--spark-color', color);
      spark.style.setProperty('--spark-glow', glow);
      portrait.appendChild(spark);
      const dx = (Math.random() - .5) * 18;
      const dy = -8 - Math.random() * 28;
      const delay = index * .018;
      if (gsap()) {
        gsap().fromTo(spark, { opacity: 0, xPercent: -50, yPercent: -50, scale: .25 }, { opacity: index % 4 === 0 ? 1 : .72, x: dx, y: dy, scale: 1 + Math.random() * .55, duration: .48 + Math.random() * .28, delay, ease: 'power2.out', onComplete: () => gsap().to(spark, { opacity: 0, duration: .2, onComplete: () => spark.remove() }) });
      } else {
        spark.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.25)' }, { opacity: .82, transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.2)` }, { opacity: 0, transform: `translate(calc(-50% + ${dx * 1.25}px),calc(-50% + ${dy * 1.3}px)) scale(.8)` }], { duration: 720, delay: delay * 1000, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.catch(() => {}).finally(() => spark.remove());
      }
    }
    window.setTimeout(() => arc.classList.remove('motion-health-glow', 'health-heal', 'health-temp'), 1250);
  }

  // La niebla original sigue siendo el único disparador de navegación. Esta
  // capa añade un único barrido luminoso, sin tocar transformaciones de nubes.
  const fog = document.getElementById('transition-fog');
  if (fog) {
    const veil = document.createElement('div');
    veil.className = 'motion-veil';
    fog.appendChild(veil);
    new MutationObserver(() => {
      if (!fog.classList.contains('active') || fog.classList.contains('motion-cinematic-active') || !canAnimate()) return;
      fog.classList.add('motion-cinematic-active');
      kill(veil);
      if (gsap()) {
        gsap().fromTo(veil, { opacity: 0, xPercent: -18, scaleX: .85 }, { opacity: .95, xPercent: 18, scaleX: 1.18, duration: .62, ease: 'sine.inOut', onComplete: () => gsap().to(veil, { opacity: 0, duration: .18, ease: 'sine.out', clearProps: 'transform,opacity' }) });
      } else {
        veil.animate([{ opacity: 0, transform: 'translateX(-12%) scaleX(.88)' }, { opacity: .86, transform: 'translateX(12%) scaleX(1.1)' }, { opacity: 0, transform: 'translateX(16%) scaleX(1.15)' }], { duration: 680, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      window.setTimeout(() => fog.classList.remove('motion-cinematic-active'), 780);
    }).observe(fog, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest('button, summary, .inv-cell, .item-card');
    if (!target || target.disabled || !canAnimate()) return;
    target.classList.add('motion-press');
    if (gsap()) {
      kill(target);
      gsap().to(target, { scale: .975, duration: .09, ease: 'power1.out' });
    }
  }, { passive: true });

  document.addEventListener('pointerup', event => {
    const target = event.target.closest('.motion-press');
    if (!target) return;
    target.classList.remove('motion-press');
    feedback(target);
  }, { passive: true });

  document.addEventListener('pointercancel', event => {
    const target = event.target.closest('.motion-press');
    if (target) { target.classList.remove('motion-press'); kill(target); }
  }, { passive: true });

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action="heal"], [data-action="temp"]')?.dataset.action;
    if (!action) return;
    const input = document.getElementById(action === 'heal' ? 'heal-value' : 'temp-value');
    if (Number(input?.value) > 0) window.setTimeout(() => emitHealthParticles(action), 36);
  }, true);

  document.addEventListener('toggle', event => {
    const card = event.target;
    if (!(card instanceof HTMLDetailsElement) || !card.matches('.spell-card, .feature-card')) return;
    if (!canAnimate()) return;
    card.classList.toggle('motion-open', card.open);
    const detail = card.querySelector('.spell-detail, .feature-detail');
    if (card.open && detail) {
      kill(detail);
      if (gsap()) gsap().fromTo(detail, { opacity: 0, y: -5 }, { opacity: 1, y: 0, duration: .22, ease: 'power2.out', clearProps: 'opacity,transform' });
      else detail.animate([{ opacity: 0, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
    }
  }, true);

  document.addEventListener('focusin', event => {
    const field = event.target;
    if (field.matches?.('input, select, textarea, .entry-edit')) field.classList.add('motion-field-active');
  });
  document.addEventListener('focusout', event => event.target.classList?.remove('motion-field-active'));

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action="toggle-spell"], [data-action="item-select"], [data-action="grid-cell"], .bag-tabs .btn, [data-page]');
    if (!target || !canAnimate()) return;
    if (target.matches('[data-page]')) {
      target.classList.remove('motion-nav-pressed');
      void target.offsetWidth;
      target.classList.add('motion-nav-pressed');
      return; // La niebla y la Timeline principal ya gestionan navegación.
    }
    target.classList.remove('motion-selected');
    void target.offsetWidth;
    target.classList.add('motion-selected');
  });

  window.addEventListener('pagehide', () => document.querySelectorAll('.motion-press').forEach(node => { kill(node); node.classList.remove('motion-press'); }));
})();
