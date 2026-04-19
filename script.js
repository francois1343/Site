/* ═══════════════════════════════════════════════════════════
   LA MOUNA — Pizzeria Artisanale
   script.js
   - Toggle thème clair / sombre
   - Filtre pizzas par tranche de prix
   - Animations d'entrée au scroll (IntersectionObserver)
   - Validation & soumission formulaire
   - Navigation active au scroll
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     1. TOGGLE THÈME CLAIR / SOMBRE
  ───────────────────────────────────────────── */
  const html        = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Lire le thème sauvegardé (ou préférence système)
  const savedTheme  = localStorage.getItem('lamouna-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initTheme   = savedTheme || (prefersDark ? 'dark' : 'light');
  html.setAttribute('data-theme', initTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('lamouna-theme', next);
  });


  /* ─────────────────────────────────────────────
     2. FILTRE PIZZAS PAR PRIX
  ───────────────────────────────────────────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const pizzaCards = document.querySelectorAll('.pizza-card');

  // Correspondances tranche → prix numériques inclus
  const filterRanges = {
    'all': null,
    '9':   [9],
    '10':  [10],
    '11':  [11],
    '12':  [12, 13],
    '14':  [14, 15],
    '16':  [16, 17, 18, 19, 20],
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Mettre à jour le bouton actif
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      const range  = filterRanges[filter];

      pizzaCards.forEach(card => {
        const price = parseInt(card.getAttribute('data-price'), 10);

        if (!range || range.includes(price)) {
          // Afficher avec animation
          card.classList.remove('hidden');
          card.style.animation = 'cardReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Injection keyframe dynamique pour cardReveal
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }
  `;
  document.head.appendChild(styleSheet);


  /* ─────────────────────────────────────────────
     3. ANIMATIONS D'ENTRÉE AU SCROLL
  ───────────────────────────────────────────── */
  const animatedSections = document.querySelectorAll('.menu-section, .contact-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Une seule fois
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  });

  animatedSections.forEach(section => observer.observe(section));


  /* ─────────────────────────────────────────────
     4. NAVIGATION ACTIVE AU SCROLL
  ───────────────────────────────────────────── */
  const navLinks    = document.querySelectorAll('.site-nav a:not(.nav-cta)');
  const sections    = document.querySelectorAll('main section[id]');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('nav-active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    threshold: 0.3,
  });

  sections.forEach(s => navObserver.observe(s));

  // Style nav-active injecté dynamiquement
  const navStyle = document.createElement('style');
  navStyle.textContent = `
    .site-nav a.nav-active {
      color: var(--accent);
    }
  `;
  document.head.appendChild(navStyle);


  /* ─────────────────────────────────────────────
     5. VALIDATION & SOUMISSION FORMULAIRE
  ───────────────────────────────────────────── */
  const form        = document.getElementById('contactForm');
  const successMsg  = document.getElementById('formSuccess');

  if (!form) return;

  // Champs obligatoires (hors "notes")
  const requiredFields = [
    { id: 'prenom',    label: 'Prénom' },
    { id: 'nom',       label: 'Nom' },
    { id: 'telephone', label: 'Téléphone' },
    { id: 'commande',  label: 'Commande' },
    { id: 'date',      label: 'Date' },
    { id: 'heure',     label: 'Heure' },
  ];

  // Nettoyer l'état d'erreur au focus
  requiredFields.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('focus', () => {
        el.classList.remove('error');
        removeError(el);
      });
      el.addEventListener('input', () => {
        if (el.value.trim()) {
          el.classList.remove('error');
          removeError(el);
        }
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;

    // Vérifier les champs texte / textarea / date / time
    requiredFields.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (!el.value.trim()) {
        markError(el, `${label} est requis.`);
        valid = false;
      } else {
        el.classList.remove('error');
        removeError(el);
      }
    });

    // Vérifier "service" (radio)
    const serviceChecked = form.querySelector('input[name="service"]:checked');
    const serviceGroup   = form.querySelector('input[name="service"]')?.closest('.form-group');
    if (!serviceChecked) {
      markGroupError(serviceGroup, 'Veuillez choisir un type de service.');
      valid = false;
    } else {
      clearGroupError(serviceGroup);
    }

    // Vérifier "paiement" (radio)
    const paiementChecked = form.querySelector('input[name="paiement"]:checked');
    const paiementGroup   = form.querySelector('input[name="paiement"]')?.closest('.form-group');
    if (!paiementChecked) {
      markGroupError(paiementGroup, 'Veuillez choisir un mode de paiement.');
      valid = false;
    } else {
      clearGroupError(paiementGroup);
    }

    // Validation numéro de téléphone (format belge flexible)
    const telEl = document.getElementById('telephone');
    if (telEl && telEl.value.trim()) {
      const cleaned = telEl.value.replace(/[\s\-\.]/g, '');
      const telValid = /^(\+32|0032|0)[1-9]\d{7,8}$/.test(cleaned);
      if (!telValid) {
        markError(telEl, 'Numéro de téléphone invalide.');
        valid = false;
      }
    }

    if (!valid) {
      // Scroll vers la première erreur
      const firstError = form.querySelector('.error, .error-msg');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // ── Soumission simulée (succès) ──────────────
    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.querySelector('span').textContent = 'Envoi en cours…';

    setTimeout(() => {
      form.reset();
      successMsg.classList.add('visible');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.querySelector('span').textContent = 'Envoyer ma commande';

      // Masquer le message après 6 secondes
      setTimeout(() => successMsg.classList.remove('visible'), 6000);
    }, 900);
  });

  /* ── Helpers erreurs ─────────────────────── */
  function markError(el, msg) {
    el.classList.add('error');
    removeError(el);
    const err = document.createElement('span');
    err.className = 'error-msg';
    err.textContent = msg;
    el.parentNode.appendChild(err);
    injectErrorStyle();
  }

  function removeError(el) {
    const existing = el.parentNode?.querySelector('.error-msg');
    if (existing) existing.remove();
  }

  function markGroupError(group, msg) {
    if (!group) return;
    clearGroupError(group);
    group.classList.add('group-error');
    const err = document.createElement('span');
    err.className = 'error-msg';
    err.textContent = msg;
    group.appendChild(err);
    injectErrorStyle();
  }

  function clearGroupError(group) {
    if (!group) return;
    group.classList.remove('group-error');
    const existing = group.querySelector('.error-msg');
    if (existing) existing.remove();
  }

  // Style des messages d'erreur (injecté une seule fois)
  let errorStyleInjected = false;
  function injectErrorStyle() {
    if (errorStyleInjected) return;
    errorStyleInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      .error-msg {
        display: block;
        font-family: var(--font-sans);
        font-size: 0.7rem;
        color: var(--terra);
        margin-top: 0.25rem;
        letter-spacing: 0.04em;
        animation: fadeIn 0.25s ease both;
      }
    `;
    document.head.appendChild(s);
  }


  /* ─────────────────────────────────────────────
     6. SMOOTH SCROLL POUR LA NAVIGATION
  ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 30;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ─────────────────────────────────────────────
     7. HEADER COMPACT AU SCROLL
  ───────────────────────────────────────────── */


  // Header statique — disparaît naturellement au scroll, sans sticky.

});