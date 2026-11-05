/* ═══════════════════════════════════════════════════════════
   LA MOUNA — Panier & Gestion Commandes
   Système de panier côté client avec synchronisation backend
═══════════════════════════════════════════════════════════ */

// Configuration serveur
// ZM_CLIENT_V2 : même origine, références stables, aucun flux client privé.
const API_BASE = "/api";
let pendingRequest = null;

// État du panier
const cartState = {
  items: [],
  selectedZone: "beaumont",
  deliveryMode: "emporter",
};

// Zones de livraison
const deliveryZones = {
  beaumont: {
    label: "Beaumont",
    fee: 0,
    freeThreshold: 0,
    description: "Livraison gratuite",
  },
  clermont: {
    label: "Clermont",
    fee: 2,
    freeThreshold: 30,
    description: "2€ si < 30€, gratuit dès 30€",
  },
  entite: {
    label: "Villages entité",
    fee: 2,
    freeThreshold: 30,
    description: "2€ si < 30€, gratuit dès 30€",
  },
  grandrieu: {
    label: "Grand-Rieu",
    fee: 2,
    freeThreshold: 30,
    description: "2€ si < 30€, gratuit dès 30€",
  },
  vergnies: {
    label: "Vergnies",
    fee: 2,
    freeThreshold: 30,
    description: "2€ si < 30€, gratuit dès 30€",
  },
  sivry: {
    label: "Sivry",
    fee: 3,
    freeThreshold: 30,
    description: "3€ si < 30€, gratuit dès 30€",
  },
  bousignies: {
    label: "Bousignies-sur-Roc",
    fee: 3,
    freeThreshold: 30,
    description: "3€ si < 30€, gratuit dès 30€",
  },
  rance: {
    label: "Rance",
    fee: 4,
    freeThreshold: 30,
    description: "4€ si < 30€, gratuit dès 30€",
  },
  sautin: {
    label: "Sautin",
    fee: 4,
    freeThreshold: 30,
    description: "4€ si < 30€, gratuit dès 30€",
  },
  froidchapelle: {
    label: "Froidchapelle",
    fee: 4,
    freeThreshold: 30,
    description: "4€ si < 30€, gratuit dès 30€",
  },
};

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  initializeCart();
  setupEventListeners();
  loadPizzasWithButtons();
  loadCartFromStorage();
});

/* ─────────────────────────────────────────────
   INITIALISATION
───────────────────────────────────────────── */

function initializeCart() {
  // Créer le badge du panier
  const cartContainer = document.createElement("div");
  cartContainer.className = "cart-container";
  cartContainer.innerHTML = `
    <div class="cart-badge" id="cartBadge" title="Voir panier">
      <span id="cartCount">0</span>
    </div>
    <div class="cart-panel" id="cartPanel">
      <div class="cart-header">Mon panier</div>
      <div class="cart-items" id="cartItems">
        <p style="text-align: center; color: #999; padding: 1rem;">Panier vide</p>
      </div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>Total:</span>
          <span id="cartTotalPrice">0,00 €</span>
        </div>
        <div class="cart-actions">
          <button class="btn-clear-cart" id="btnClearCart">Vider</button>
          <button class="btn-checkout" id="btnCheckout">Valider</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(cartContainer);

  // Charger depuis le localStorage
  loadCartFromStorage();
}

function loadPizzasWithButtons() {
  // Ajouter les boutons "+" à toutes les pizzas automatiquement
  const pizzaCards = document.querySelectorAll(".pizza-card");
  pizzaCards.forEach((card) => {
    const name = card.querySelector(".pizza-name")?.textContent;
    const price = card.getAttribute("data-price");
    const priceText = card.querySelector(".pizza-price")?.textContent;

    if (name && !card.querySelector(".item-add-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item-add-btn";
      btn.setAttribute("data-item", name);
      btn.setAttribute("data-price", price);
      btn.setAttribute("title", "Ajouter au panier");
      btn.textContent = "+";
      card.appendChild(btn);
    }
  });

  // Ajouter un bouton aux plats dont le prix est affiché dans une ligne de menu.
  document.querySelectorAll(".menu-item").forEach((item) => {
    const name = item.querySelector(".item-name")?.textContent?.trim();
    const priceText = item.querySelector(".item-price")?.textContent;
    const price = Number.parseFloat(priceText?.replace(",", "."));

    if (
      name &&
      Number.isFinite(price) &&
      !item.querySelector(".item-add-btn")
    ) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item-add-btn";
      btn.dataset.item = name;
      btn.dataset.price = price;
      btn.setAttribute("title", `Ajouter ${name} au panier`);
      btn.textContent = "+";
      item.appendChild(btn);
    }
  });

  // Les boissons sont affichées sous forme d'étiquettes, avec un prix fixe de 2 €.
  document.querySelectorAll(".boisson-tag").forEach((tag) => {
    const name = tag.textContent.trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "boisson-add-btn";
    btn.dataset.item = name;
    btn.dataset.price = "2";
    btn.setAttribute("title", `Ajouter ${name} au panier`);
    btn.setAttribute("aria-label", `Ajouter ${name} au panier`);
    btn.textContent = "+";
    tag.appendChild(btn);
  });

  // Ajouter les listeners aux boutons existants
  document
    .querySelectorAll(".item-add-btn, .boisson-add-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const name = btn.getAttribute("data-item");
        const price = parseFloat(btn.getAttribute("data-price"));
        if (name && Number.isFinite(price)) {
          addToCart(name, price);
        }
      });
    });
}

function setupEventListeners() {
  // Toggle panier
  document.getElementById("cartBadge").addEventListener("click", () => {
    const panel = document.getElementById("cartPanel");
    panel.classList.toggle("visible");
  });

  // Bouton vider panier
  document.getElementById("btnClearCart").addEventListener("click", () => {
    if (confirm("Êtes-vous sûr de vouloir vider le panier ?")) {
      cartState.items = [];
      updateCartDisplay();
      saveCartToStorage();
    }
  });

  // Bouton valider / aller au formulaire
  document.getElementById("btnCheckout").addEventListener("click", () => {
    if (cartState.items.length === 0) {
      alert("Votre panier est vide");
      return;
    }
    // Fermer le panier et scroller vers le formulaire
    document.getElementById("cartPanel").classList.remove("visible");
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  });

  // Gestion du service de livraison
  document.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const deliverySection = document.getElementById("deliverySection");
      const adresseField = document.getElementById("adresse");

      if (e.target.value === "livraison") {
        cartState.deliveryMode = "livraison";
        deliverySection.style.display = "block";
        adresseField.required = true;
        updateDeliveryFee();
      } else {
        cartState.deliveryMode = e.target.value;
        deliverySection.style.display = "none";
        adresseField.required = false;
        updateFormTotals();
      }
    });
  });

  // Changement de zone
  const zoneSelect = document.getElementById("zone");
  if (zoneSelect) {
    zoneSelect.addEventListener("change", (e) => {
      cartState.selectedZone = e.target.value;
      updateDeliveryFee();
    });
  }

  // Modification du formulaire
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
}

/* ─────────────────────────────────────────────
   GESTION DU PANIER
───────────────────────────────────────────── */

function addToCart(name, price) {
  const existingItem = cartState.items.find((item) => item.name === name && item.price === price);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cartState.items.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      price,
      quantity: 1,
    });
  }

  updateCartDisplay();
  saveCartToStorage();

  // Animation du badge
  const badge = document.getElementById("cartBadge");
  badge.classList.add("item-added-animation");
  setTimeout(() => badge.classList.remove("item-added-animation"), 500);
}

function removeFromCart(itemId) {
  const index = cartState.items.findIndex((item) => item.id === itemId);
  if (index > -1) {
    cartState.items.splice(index, 1);
    updateCartDisplay();
    saveCartToStorage();
  }
}

function updateCartDisplay() {
  const itemsContainer = document.getElementById("cartItems");
  const count = document.getElementById("cartCount");
  const totalPrice = document.getElementById("cartTotalPrice");

  // Mettre à jour le nombre d'articles
  const totalItems = cartState.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  count.textContent = totalItems;

  // Mettre à jour la liste des articles
  if (cartState.items.length === 0) {
    itemsContainer.innerHTML =
      '<p style="text-align: center; color: #999; padding: 1rem;">Panier vide</p>';
    totalPrice.textContent = "0,00 €";
  } else {
    itemsContainer.innerHTML = cartState.items
      .map(
        (item) => `
      <div class="cart-item">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-qty">${item.quantity}x</span>
        <span style="min-width: 50px; text-align: right;">${(item.price * item.quantity).toFixed(2).replace(".", ",")} €</span>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
      </div>
    `,
      )
      .join("");

    const total = cartState.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    totalPrice.textContent = total.toFixed(2).replace(".", ",") + " €";
  }

  // Mettre à jour le formulaire
  updateFormDisplay();
  updateFormTotals();
}

function updateFormDisplay() {
  const formCart = document.getElementById("cartDisplayInForm");

  if (cartState.items.length === 0) {
    formCart.innerHTML =
      '<p style="color: #999; text-align: center; margin: 1rem 0;">Votre panier est vide. Cliquez sur "+" pour ajouter des articles.</p>';
  } else {
    const itemsList = cartState.items
      .map(
        (item) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #ddd;">
        <div>
          <strong>${item.name}</strong>
          <br>
          <small style="color: #999;">${item.quantity}x ${item.price.toFixed(2).replace(".", ",")} €</small>
        </div>
        <div style="text-align: right;">
          <strong>${(item.price * item.quantity).toFixed(2).replace(".", ",")} €</strong>
        </div>
      </div>
    `,
      )
      .join("");

    formCart.innerHTML = itemsList;
  }
}

function updateDeliveryFee() {
  const zone = deliveryZones[cartState.selectedZone];
  if (!zone) return;

  const totalSubtotal = getTotalPrice();
  let fee = 0;

  if (zone.freeThreshold > 0 && totalSubtotal >= zone.freeThreshold) {
    fee = 0;
  } else {
    fee = zone.fee;
  }

  // Afficher les infos de livraison
  const infoBox = document.getElementById("deliveryInfo");
  if (infoBox) {
    infoBox.innerHTML = `
      <p><strong>${zone.label}</strong></p>
      <p class="delivery-fee">${zone.description}</p>
      <p>Frais calculés: ${fee.toFixed(2).replace(".", ",")} €</p>
    `;
  }

  cartState.deliveryFee = fee;
  updateFormTotals();
}

function updateFormTotals() {
  const subtotal = getTotalPrice();
  const fee =
    cartState.deliveryMode === "livraison" ? cartState.deliveryFee || 0 : 0;
  const total = subtotal + fee;

  document.getElementById("formTotalPrice").textContent =
    subtotal.toFixed(2).replace(".", ",") + " €";
  document.getElementById("formDeliveryFee").textContent =
    fee.toFixed(2).replace(".", ",") + " €";
  document.getElementById("formTotalWithDelivery").textContent =
    total.toFixed(2).replace(".", ",") + " €";
}

function getTotalPrice() {
  return cartState.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
}

/* ─────────────────────────────────────────────
   SAUVEGARDE & CHARGEMENT LOCAL
───────────────────────────────────────────── */

function saveCartToStorage() {
  localStorage.setItem("lamouna-cart", JSON.stringify(cartState));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem("lamouna-cart");
  if (saved) {
    const data = JSON.parse(saved);
    cartState.items = data.items || [];
    cartState.selectedZone = data.selectedZone || "beaumont";
    updateCartDisplay();
  }
}

/* ─────────────────────────────────────────────
   SOUMISSION DU FORMULAIRE
───────────────────────────────────────────── */

async function handleFormSubmit(e) {
  e.preventDefault();

  if (cartState.items.length === 0) {
    alert("Votre panier est vide. Veuillez ajouter des articles.");
    return;
  }

  const form = e.target;
  const prenom = document.getElementById("prenom").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const telephone = document.getElementById("telephone").value.trim();
  const service = document.querySelector('input[name="service"]:checked').value;
  const paiement = document.querySelector(
    'input[name="paiement"]:checked',
  ).value;
  const date = document.getElementById("date").value;
  const heure = document.getElementById("heure").value;
  const notes = document.getElementById("notes").value.trim();
  const adresse =
    service === "livraison"
      ? document.getElementById("adresse").value.trim()
      : "";
  const zone =
    service === "livraison"
      ? document.getElementById("zone").value
      : "beaumont";

  // Validation
  if (!prenom || !nom || !telephone) {
    alert("Veuillez remplir tous les champs requis");
    return;
  }

  if (service === "livraison" && !adresse) {
    alert("Veuillez entrer une adresse de livraison");
    return;
  }

  const sousTotal = getTotalPrice();
  const fraisLivraison =
    service === "livraison" ? cartState.deliveryFee || 0 : 0;
  const total = sousTotal + fraisLivraison;

  // Préparer les données de la commande
  const commandeData = {
    prenom,
    nom,
    telephone,
    adresse,
    zone,
    items: cartState.items.map((item) => ({
      name: item.name,
      menuId: item.name + "|" + Math.round(item.price * 100),
      price: item.price,
      quantity: item.quantity,
    })),
    service,
    paiement: paiement === "especes" ? "cash" : "virement",
    date,
    heure,
    notes,
    sousTotal,
    fraisLivraison,
    total,
  };

  // Afficher le chargement
  const submitBtn = form.querySelector(".form-submit");
  const originalText = submitBtn.querySelector("span").textContent;
  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Envoi en cours...";

  try {
    if (!/^https?:$/.test(location.protocol)) throw new Error("Ouvre le site depuis le serveur La Mouna, pas directement depuis le fichier HTML.");
    const bytes = new TextEncoder().encode(JSON.stringify(commandeData));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(b => b.toString(16).padStart(2,"0")).join("");
    try { pendingRequest = JSON.parse(sessionStorage.getItem("lamouna-pending-request-v1")) || pendingRequest; } catch {}
    if (!pendingRequest || pendingRequest.hash !== hash) pendingRequest = {hash, key:crypto.randomUUID()};
    try { sessionStorage.setItem("lamouna-pending-request-v1",JSON.stringify(pendingRequest)); } catch {}
    // Envoyer au backend
    const response = await fetch(`${API_BASE}/commandes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": pendingRequest.key,
      },
      body: JSON.stringify(commandeData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erreur lors de l'envoi");
    }

    pendingRequest = null;
    try { sessionStorage.removeItem("lamouna-pending-request-v1"); } catch {}
    // Succès !
    cartState.items = [];
    updateCartDisplay();
    saveCartToStorage();

    form.reset();
    const successMsg = document.getElementById("formSuccess");
    if (successMsg) {
      successMsg.classList.add("visible");
      setTimeout(() => successMsg.classList.remove("visible"), 6000);
    }

    // Confirmation visuelle
    alert("✓ Commande reçue avec succès ! Numéro: " + result.commandeId);
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur lors de l'envoi de la commande: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = originalText;
  }
}

// Les commandes des autres clients sont réservées au terminal cuisine.
