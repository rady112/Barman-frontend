import popular from "../data/popular.js";
import specials from "../data/specials.js";
import shots from "../data/shots.js";
import beer from "../data/beer.js";
import soft from "../data/soft.js";

// Order exactly as requested
const MENUS = [
  { key: "popular", label: "Popular cocktails", items: popular },
  { key: "specials", label: "Rady's specials", items: specials },
  { key: "shots",   label: "Shots", items: shots },
  { key: "beer",    label: "Beer", items: beer },
  { key: "soft",    label: "Soft drink", items: soft },
];

let activeMenuKey = MENUS[0].key;

// Demo cart state (you can replace later with real UI)
const cart = [];

// ----- Toast -----
let toastTimer = null;

function showAddedToCartToast(itemName) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("show");
  void toast.offsetWidth; // restart animation reliably

  toast.textContent = `${itemName} added to the cart`;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 6100);
}

// ----- Cart -----
function addToCart(item) {
  cart.push(item);
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.textContent = String(cart.length);
}

// ----- UI rendering -----
function renderTabs() {
  const tabs = document.getElementById("menuTabs");
  if (!tabs) return;

  tabs.innerHTML = "";

  MENUS.forEach((m) => {
    const btn = document.createElement("button");
    btn.textContent = m.label;
    btn.className = (m.key === activeMenuKey) ? "active" : "";

    btn.onclick = () => {
      activeMenuKey = m.key;
      renderTabs();
      renderMenu();
    };

    tabs.appendChild(btn);
  });
}

function renderMenu() {
  const grid = document.getElementById("menuGrid");
  if (!grid) return;

  const menu = MENUS.find((m) => m.key === activeMenuKey);
  if (!menu) return;

  grid.innerHTML = "";

  menu.items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const ingredientsText =
      item.ingredients && item.ingredients.length
        ? item.ingredients.join(", ")
        : "Ingredients: (coming soon)";

    card.innerHTML = `
      <div class="card-title">${escapeHtml(item.name)}</div>
      <div class="card-sub">${escapeHtml(ingredientsText)}</div>
      <button class="add-btn" type="button">Add</button>
    `;

    card.querySelector(".add-btn").onclick = () => {
      addToCart(item);
      showAddedToCartToast(item.name);
    };

    grid.appendChild(card);
  });
}

// Safety: avoid accidental HTML injection
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Init
renderTabs();
renderMenu();
