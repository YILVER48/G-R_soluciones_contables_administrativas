/**
 * G&R SOLUCIONES — script.js
 * Scroll animations, navbar, mobile menu, form validation, WhatsApp, back-to-top
 */

'use strict';

/* ── Utility helpers ──────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── DOM ready ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initActiveNavLinks();
  initBackToTop();
  initContactForm();
  initSmoothScroll();
});

/* ════════════════════════════════════════════════════════════
   1. NAVBAR — sticky + scroll-shrink
   ════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ════════════════════════════════════════════════════════════
   2. MOBILE MENU — hamburger toggle + close on link click
   ════════════════════════════════════════════════════════════ */
function initMobileMenu() {
  const toggle  = $('#navToggle');
  const menu    = $('#navMenu');
  const overlay = createOverlay();
  if (!toggle || !menu) return;

  const open  = () => {
    menu.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    overlay.classList.add('visible');
  };

  const close = () => {
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    overlay.classList.remove('visible');
  };

  toggle.addEventListener('click', () =>
    menu.classList.contains('open') ? close() : open()
  );

  // Close when a nav link is clicked
  $$('.nav__link, .nav__cta', menu).forEach(link =>
    link.addEventListener('click', close)
  );

  // Close on overlay click
  overlay.addEventListener('click', close);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) close();
  });
}

function createOverlay() {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999',
    'background:rgba(0,0,0,.5)', 'backdrop-filter:blur(2px)',
    'opacity:0', 'pointer-events:none',
    'transition:opacity .3s ease',
  ].join(';');
  document.body.appendChild(el);

  // Expose open/close helpers instead of patching classList
  el.show = () => { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; };
  el.hide = () => { el.style.opacity = '0'; el.style.pointerEvents = 'none'; };

  // Keep classList.add/remove working for external callers
  const _add    = el.classList.add.bind(el.classList);
  const _remove = el.classList.remove.bind(el.classList);
  el.classList.add = (cls, ...rest) => {
    _add(cls, ...rest);
    if (cls === 'visible') el.show();
  };
  el.classList.remove = (cls, ...rest) => {
    _remove(cls, ...rest);
    if (cls === 'visible') el.hide();
  };

  return el;
}

/* ════════════════════════════════════════════════════════════
   3. SCROLL REVEAL — IntersectionObserver
   ════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate only once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  $$('.reveal').forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════════════════════
   4. ACTIVE NAV LINKS — highlight section in view
   ════════════════════════════════════════════════════════════ */
function initActiveNavLinks() {
  const sections = $$('section[id], div[id]').filter(el =>
    $$('.nav__link').some(link => link.getAttribute('href') === `#${el.id}`)
  );
  const navLinks = $$('.nav__link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const active = navLinks.find(
            link => link.getAttribute('href') === `#${entry.target.id}`
          );
          if (active) active.classList.add('active');
        }
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach(section => observer.observe(section));
}

/* ════════════════════════════════════════════════════════════
   5. BACK TO TOP
   ════════════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ════════════════════════════════════════════════════════════
   6. SMOOTH SCROLL — for anchor links
   ════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = $(targetId);
      if (!target) return;
      e.preventDefault();

      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '80',
        10
      );
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   7. CONTACT FORM — validation + WhatsApp fallback
   ════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form       = $('#contactForm');
  if (!form) return;

  const successBox = $('#formSuccess');

  /* ── Field definitions ── */
  const fields = {
    nombre:  { required: true,  label: 'El nombre' },
    correo:  { required: true,  label: 'El correo', type: 'email' },
    mensaje: { required: true,  label: 'El mensaje' },
  };

  /* ── Live validation on blur ── */
  Object.keys(fields).forEach(name => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', () => validateField(name, input, fields[name]));
    input.addEventListener('input', () => {
      // Clear error as soon as user starts typing again
      if (input.classList.contains('error')) {
        clearError(name, input);
      }
    });
  });

  /* ── Submit handler ── */
  form.addEventListener('submit', e => {
    e.preventDefault();
    hideSuccess();

    let valid = true;
    Object.keys(fields).forEach(name => {
      const input = form.elements[name];
      if (!input) return;
      if (!validateField(name, input, fields[name])) valid = false;
    });

    if (!valid) {
      // Focus first invalid field
      const firstError = form.querySelector('.form__input.error, .form__textarea.error');
      if (firstError) firstError.focus();
      return;
    }

    // Build data object
    const data = {
      nombre:   form.elements.nombre.value.trim(),
      empresa:  form.elements.empresa?.value.trim() || '',
      correo:   form.elements.correo.value.trim(),
      telefono: form.elements.telefono?.value.trim() || '',
      mensaje:  form.elements.mensaje.value.trim(),
    };

    submitForm(form, data, successBox);
  });
}

/* ── Validate a single field ── */
function validateField(name, input, config) {
  const val = input.value.trim();

  if (config.required && !val) {
    showError(name, input, `${config.label} es obligatorio.`);
    return false;
  }

  if (config.type === 'email' && val) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRe.test(val)) {
      showError(name, input, 'Ingrese un correo electrónico válido.');
      return false;
    }
  }

  clearError(name, input);
  return true;
}

function showError(name, input, msg) {
  input.classList.add('error');
  input.setAttribute('aria-invalid', 'true');
  const errEl = $(`#error${capitalize(name)}`);
  if (errEl) errEl.textContent = msg;
}

function clearError(name, input) {
  input.classList.remove('error');
  input.setAttribute('aria-invalid', 'false');
  const errEl = $(`#error${capitalize(name)}`);
  if (errEl) errEl.textContent = '';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function hideSuccess() {
  const box = $('#formSuccess');
  if (box) { box.classList.remove('show', 'error-msg'); box.textContent = ''; }
}

/* ── Form submission — redirect to WhatsApp with data ── */
function submitForm(form, data, successBox) {
  const btn = form.querySelector('[type="submit"]');

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Enviando...';

  // Simulate processing delay, then open WhatsApp
  setTimeout(() => {
    const msg = buildWhatsAppMessage(data);
    const url = `https://wa.me/573208569866?text=${encodeURIComponent(msg)}`;

    // Show success
    if (successBox) {
      successBox.className = 'form__success show';
      successBox.innerHTML =
        '<i class="fas fa-check-circle"></i> ¡Mensaje listo! Se abrirá WhatsApp para enviarlo. Si no se abre automáticamente, ' +
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--gold);font-weight:600;">haga clic aquí</a>.`;
    }

    // Open WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer');

    // Reset form
    form.reset();

    // Restore button
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i> Enviar Mensaje';
  }, 700);
}

function buildWhatsAppMessage(data) {
  let msg = `Hola, me contacto desde la página web de G&R Soluciones.\n\n`;
  msg += `👤 *Nombre:* ${data.nombre}\n`;
  if (data.empresa) msg += `🏢 *Empresa:* ${data.empresa}\n`;
  msg += `📧 *Correo:* ${data.correo}\n`;
  if (data.telefono) msg += `📞 *Teléfono:* ${data.telefono}\n`;
  msg += `\n💬 *Mensaje:*\n${data.mensaje}`;
  return msg;
}

/* ════════════════════════════════════════════════════════════
   8. HERO COUNTER ANIMATION — disabled (stats removed)
   ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   8b. ACCORDION — desplegable Servicios Tributarios
   ════════════════════════════════════════════════════════════ */
(function initAccordion() {
  $$('.accordion__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const bodyId   = btn.getAttribute('aria-controls');
      const body     = $(`#${bodyId}`);
      if (!body) return;

      if (expanded) {
        btn.setAttribute('aria-expanded', 'false');
        body.hidden = true;
      } else {
        btn.setAttribute('aria-expanded', 'true');
        body.hidden = false;
      }
    });
  });
})();

/* ════════════════════════════════════════════════════════════
   9. NAVBAR — close mobile menu on resize to desktop
   ════════════════════════════════════════════════════════════ */
(function initResizeHandler() {
  let lastWidth = window.innerWidth;

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (w === lastWidth) return;
    lastWidth = w;

    if (w > 768) {
      const menu   = $('#navMenu');
      const toggle = $('#navToggle');
      if (menu?.classList.contains('open')) {
        menu.classList.remove('open');
        toggle?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  }, { passive: true });
})();

/* ════════════════════════════════════════════════════════════
   10. FOOTER LEGAL LINKS — placeholder modal notice
   ════════════════════════════════════════════════════════════ */
(function initLegalLinks() {
  const privacy = $('#privacyLink');
  const terms   = $('#termsLink');

  const showNotice = (e, title) => {
    e.preventDefault();
    const msg =
      `${title}\n\n` +
      'Este documento está en proceso de elaboración. ' +
      'Para consultas sobre privacidad o términos de uso, ' +
      'comuníquese con nosotros en contabilidad@gyrsolucionesca.com';
    alert(msg);
  };

  privacy?.addEventListener('click', e => showNotice(e, 'Política de Privacidad'));
  terms?.addEventListener('click',   e => showNotice(e, 'Términos y Condiciones'));
})();
