import popular from "../data/popular.js";
import specials from "../data/specials.js";
import shots from "../data/shots.js";
import beer from "../data/beer.js";
import soft from "../data/soft.js";

const MENUS = [
  { key: "popular", label: "Popular cocktails", items: popular },
  { key: "specials", label: "Rady's specials", items: specials },
  { key: "shots",   label: "Shots", items: shots },
  { key: "beer",    label: "Beer", items: beer },
  { key: "soft",    label: "Soft drink", items: soft },
];

// Demo cart state
const cart = [];

// ---------------- Toast + swipe-to-dismiss (no animation restarts) ----------------
let toastStartHideTimer = null; // triggers hide after 4s
let toastCleanupTimer = null;   // cleanup after 6s
let toastHideAt = 0;            // timestamp when hide should start
let toastEndAt = 0;             // timestamp when toast fully ends

function clearToastTimers() {
  clearTimeout(toastStartHideTimer);
  clearTimeout(toastCleanupTimer);
  toastStartHideTimer = null;
  toastCleanupTimer = null;
}

function scheduleToastTimers(remainingStartHideMs = 4000, remainingCleanupMs = 6000) {
  const now = Date.now();
  toastHideAt = now + remainingStartHideMs;
  toastEndAt  = now + remainingCleanupMs;

  toastStartHideTimer = setTimeout(() => startHideToast(false), remainingStartHideMs);
  toastCleanupTimer   = setTimeout(() => cleanupToast(), remainingCleanupMs);
}

function showAddedToCartToast(itemName) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  initToastSwipeOnce();

  clearToastTimers();

  // reset classes + inline styles (in case user dragged)
  toast.classList.remove("hiding", "dragging", "fast", "visible");
  toast.style.transform = "";
  toast.style.opacity = "";

  toast.textContent = `${itemName} added to the cart`;

  // force reflow so transition always triggers
  void toast.offsetWidth;

  // show
  toast.classList.add("visible");

  // start hide at t=4s; end at t=6s
  scheduleToastTimers(4000, 6000);
}

function startHideToast(fast = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("dragging");
  toast.classList.toggle("fast", fast);

  toast.classList.add("hiding");
  toast.classList.remove("visible");

  if (fast) {
    clearToastTimers();
    toastCleanupTimer = setTimeout(() => cleanupToast(), 300);
  }
}

function cleanupToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("visible", "hiding", "dragging", "fast");
  toast.style.transform = "";
  toast.style.opacity = "";
  clearToastTimers();
}

let toastSwipeInitialized = false;

function initToastSwipeOnce() {
  if (toastSwipeInitialized) return;
  toastSwipeInitialized = true;

  const toast = document.getElementById("toast");
  if (!toast) return;

  let startY = 0;
  let deltaY = 0;
  let dragging = false;

  let remainingStartHide = 0;
  let remainingCleanup = 0;

  const threshold = 55;

  toast.addEventListener("pointerdown", (e) => {
    if (!toast.classList.contains("visible")) return;

    dragging = true;
    startY = e.clientY;
    deltaY = 0;

    // pause timers
    const now = Date.now();
    remainingStartHide = Math.max(0, toastHideAt - now);
    remainingCleanup   = Math.max(0, toastEndAt - now);
    clearToastTimers();

    toast.classList.add("dragging");
    toast.classList.remove("fast");
    toast.setPointerCapture(e.pointerId);
  });

  toast.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    deltaY = Math.max(0, e.clientY - startY);
    toast.style.transform = `translateX(-50%) translateY(${deltaY}px)`;

    const alpha = Math.max(0, 1 - deltaY / 180);
    toast.style.opacity = String(alpha);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;

    if (deltaY > threshold) {
      toast.style.transform = "";
      toast.style.opacity = "";
      toast.classList.remove("dragging");
      startHideToast(true);
      return;
    }

    // snap back + resume timers
    toast.classList.remove("dragging");
    toast.style.transform = "";
    toast.style.opacity = "";

    toast.classList.add("visible");
    toast.classList.remove("hiding", "fast");

    scheduleToastTimers(remainingStartHide, remainingCleanup);
  }

  toast.addEventListener("pointerup", endDrag);
  toast.addEventListener("pointercancel", endDrag);
} // ✅ THIS CLOSING BRACE WAS MISSING IN YOUR VERSION

// ---------------- Cart ----------------
function addToCart(item) {
  cart.push(item);
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.textContent = String(cart.length);
}

// ---------------- Rendering: menus stacked vertically ----------------
function renderAllMenus() {
  const root = document.getElementById("menuSections");
  if (!root) return;

  root.innerHTML = "";

  MENUS.forEach((menu) => {
    const section = document.createElement("section");
    section.className = "menu-section";
    section.id = `section-${menu.key}`;

    const title = document.createElement("h2");
    title.className = "menu-section-title";
    title.textContent = menu.label;

    const sub = document.createElement("p");
    sub.className = "menu-section-sub";
    sub.textContent = `${menu.items.length} item(s)`;

    const grid = document.createElement("div");
    grid.className = "menu-grid";

    menu.items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";

      const ingredientsText =
        item.ingredients && item.ingredients.length
          ? item.ingredients.join(", ")
          : "Ingredients: (coming soon)";

      const descriptionHtml = item.description
        ? `<div class="card-desc">${escapeHtml(item.description)}</div>`
        : "";

      card.innerHTML = `
        <div class="card-title">${escapeHtml(item.name)}</div>
        <div class="card-sub">${escapeHtml(ingredientsText)}</div>
        ${descriptionHtml}
        <button class="add-btn" type="button">Add</button>
      `;

      card.querySelector(".add-btn").onclick = () => {
        addToCart(item);
        showAddedToCartToast(item.name);
      };

      grid.appendChild(card);
    });

    section.appendChild(title);
    section.appendChild(sub);
    section.appendChild(grid);
    root.appendChild(section);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderAllMenus();