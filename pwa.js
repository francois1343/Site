// Installation, connexion et mises à jour restent séparées du panier.
const $ = id => document.getElementById(id);
let registration, installEvent, updateWorker, reloadRequested = false, reloaded = false;
let updateAvailable = false, engagement = 0, lastCheck = 0, deferredUpdate = false;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const get = key => { try { return localStorage.getItem('lamouna-' + key); } catch { return null; } };
const set = (key, value) => { try { localStorage.setItem('lamouna-' + key, value); } catch {} };
function hide() { $('pwa-notice').hidden = true; }
function notice(title, description, actions) {
  if (document.querySelector('dialog[open]')) return;
  $('toast').hidden = true;
  $('pwa-title').textContent = title;
  $('pwa-description').textContent = description;
  $('pwa-actions').replaceChildren();
  for (const [label, action] of actions) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.onclick = action;
    $('pwa-actions').append(button);
  }
  $('pwa-notice').hidden = false;
}
function keepDraft() {
  // Le brouillon est privé à cet onglet ; aucune donnée personnelle dans le cache SW.
  const draft = { notes: $('order-notes').value, service: document.querySelector('input[name=service]:checked')?.value };
  try { sessionStorage.setItem('lamouna-order-draft', JSON.stringify(draft)); return true; }
  catch { return !draft.notes && draft.service === 'À emporter'; }
}
try {
  const draft = JSON.parse(sessionStorage.getItem('lamouna-order-draft') || 'null');
  if (draft && typeof draft.notes === 'string') $('order-notes').value = draft.notes.slice(0, 500);
  if (draft?.service === 'Livraison') document.querySelector('input[value="Livraison"]').checked = true;
} catch {}
$('order-notes').addEventListener('input', keepDraft);
document.querySelectorAll('input[name=service]').forEach(input => input.addEventListener('change', keepDraft));
function safeReload() {
  if (reloaded) return;
  if (document.querySelector('dialog[open]') || !keepDraft()) {
    reloadRequested = false;
    notice('Votre sélection d’abord', 'Fermez la fiche ou copiez vos remarques avant de mettre à jour.', [['Plus tard', hide]]);
    return;
  }
  reloaded = true; location.reload();
}
function offerUpdate() {
  if (deferredUpdate) return;
  notice('✨ Une nouvelle version est disponible !', 'Quelques améliorations viennent d’arriver. Votre panier est conservé.', [
    ["J’ai compris", async () => {
      if (!keepDraft()) { notice('Copiez vos remarques', 'Ce navigateur ne peut pas sauvegarder votre brouillon. Copiez-le avant de recharger.', [['Plus tard', hide]]); return; }
      await navigator.locks?.request?.('lamouna-cart-v2', async () => {});
      if (document.querySelector('dialog[open]')) return;
      if (registration?.waiting) {
        updateWorker = registration.waiting; reloadRequested = true;
        updateWorker.postMessage({ type: 'APPLY_UPDATE' });
        $('pwa-description').textContent = 'Mise à jour en cours…';
        setTimeout(() => {
          if (!reloaded && reloadRequested) {
            reloadRequested = false;
            notice('Mise à jour en attente', 'Elle n’a pas pu être appliquée. Vous pouvez continuer à utiliser la carte.', [['Réessayer', offerUpdate], ['Plus tard', hide]]);
          }
        }, 10000);
      } else safeReload();
    }],
    ['Plus tard', () => { deferredUpdate = true; hide(); }]
  ]);
}
function installCard(manual = false) {
  if (updateAvailable) { deferredUpdate = false; offerUpdate(); return; }
  if (standalone()) { if (manual) notice('La Mouna est installée', 'Votre carte est déjà ouverte en mode application.', [['Fermer', hide]]); return; }
  if (!manual && (get('install-refused') === 'yes' || Number(get('install-later')) > Date.now())) return;
  const later = () => { set('install-later', String(Date.now() + 7 * 86400000)); hide(); };
  const never = () => { set('install-refused', 'yes'); hide(); };
  if (installEvent) {
    notice('🍕 La Mouna, à portée de main', 'Gardez la carte sur votre écran d’accueil.', [
      ['Installer', async () => {
        const event = installEvent; installEvent = null;
        try { await event.prompt(); const choice = await event.userChoice; if (choice.outcome !== 'accepted') later(); else hide(); }
        catch { installCard(true); }
      }], ['Plus tard', later], ['Ne plus proposer', never]
    ]);
  } else if (manual) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    notice('Ajouter La Mouna à l’accueil', ios ? 'Dans Safari : ouvrez Partager, puis « Sur l’écran d’accueil ». Si ce choix manque, ouvrez cette page dans Safari.' : 'Ouvrez le menu de votre navigateur et cherchez « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option n’est pas proposée, la carte reste utilisable ici.', [['J’ai compris', hide]]);
  }
}
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; if (engagement >= 2) installCard(); });
window.addEventListener('appinstalled', () => { installEvent = null; hide(); $('install-help').hidden = true; });
$('install-help').hidden = standalone();
$('install-help').onclick = () => installCard(true);
document.addEventListener('click', event => {
  if (event.target.closest('.category,.add-button,.pizza-thumb,#product-add')) {
    engagement++;
    if (engagement === 2) setTimeout(() => installCard(), 10000);
  }
});
for (const dialog of document.querySelectorAll('dialog')) {
  new MutationObserver(() => { if (dialog.open) hide(); }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  dialog.addEventListener('close', () => { if (updateAvailable && !deferredUpdate) offerUpdate(); });
}
function connection(online) {
  $('connection-notice').hidden = online;
  $('connection-text').textContent = 'Connexion indisponible · La carte déjà enregistrée reste consultable. Prix et disponibilité à confirmer par téléphone.';
}
async function checkConnection(retry = false) {
  $('connection-retry').disabled = true;
  try {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 7000);
    let response;
    try { response = await fetch('build.json', { cache: 'no-store', signal: controller.signal }); } finally { clearTimeout(timer); }
    if (!response.ok || !(await response.json()).files) throw Error();
    connection(true);
    if (retry && !$('menu-error').hidden) safeReload();
  } catch { connection(false); }
  finally { $('connection-retry').disabled = false; }
}
$('connection-retry').onclick = () => checkConnection(true);
window.addEventListener('offline', () => connection(false));
window.addEventListener('online', () => checkConnection());
window.addEventListener('lamouna:cached-menu', () => connection(false));
checkConnection();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) safeReload();
    else if (registration?.active && !reloaded) { updateAvailable = true; offerUpdate(); }
  });
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(reg => {
    registration = reg;
    const inspect = () => { if (reg.waiting && navigator.serviceWorker.controller) { updateAvailable = true; updateWorker = reg.waiting; offerUpdate(); } };
    inspect();
    reg.addEventListener('updatefound', () => { reg.installing?.addEventListener('statechange', inspect); });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - lastCheck > 5 * 60000) {
        lastCheck = Date.now(); reg.update().catch(() => {}); checkConnection();
        deferredUpdate = false; if (updateAvailable) offerUpdate();
      }
    });
  }).catch(() => {
    // Une installation impossible ne bloque pas la carte ni le panier.
    $('install-help').textContent = 'Ajouter à l’écran d’accueil ↗';
  });
}
