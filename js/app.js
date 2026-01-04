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

// ---------------- Toast + swipe-to-dismiss (freeze state while dragging) ----------------
let toastStartHideTimer = null;
let toastCleanupTimer = null;
let toastHideAt = 0;
let toastEndAt = 0;

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

  // hard reset (important after drag)
  toast.classList.remove("dragging", "fast", "hiding");
  toast.style.opacity = "";
  toast.style.removeProperty("--toastY");

  toast.textContent = `${itemName} added to the cart`;

  // restart visibility transition reliably
  toast.classList.remove("visible");
  void toast.offsetWidth;
  toast.classList.add("visible");

  scheduleToastTimers(4000, 6000);
}

function startHideToast(fast = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("dragging");
  toast.classList.toggle("fast", fast);

  toast.classList.add("hiding");
  toast.classList.remove("visible");

  toast.style.opacity = "";
  toast.style.removeProperty("--toastY");

  if (fast) {
    clearToastTimers();
    toastCleanupTimer = setTimeout(() => cleanupToast(), 300);
  }
}

function cleanupToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("visible", "hiding", "dragging", "fast");
  toast.style.opacity = "";
  toast.style.removeProperty("--toastY");
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

  let baseY = 0; // frozen Y at drag start
  let remainingStartHide = 0;
  let remainingCleanup = 0;

  const threshold = 55;

  toast.addEventListener("pointerdown", (e) => {
    // allow dragging only if it's currently visible (even if mid-transition)
    if (!toast.classList.contains("visible") && !toast.classList.contains("hiding")) return;

    dragging = true;
    startY = e.clientY;
    deltaY = 0;

    // pause timers
    const now = Date.now();
    remainingStartHide = Math.max(0, toastHideAt - now);
    remainingCleanup   = Math.max(0, toastEndAt - now);
    clearToastTimers();

    // FREEZE current visual state to prevent snapping
    const cs = getComputedStyle(toast);
    const yStr = cs.getPropertyValue("--toastY").trim() || "0px";
    baseY = parseFloat(yStr) || 0;

    toast.style.setProperty("--toastY", `${baseY}px`);
    toast.style.opacity = cs.opacity;

    // remove state classes that would fight the drag, then enable dragging
    toast.classList.remove("fast", "hiding");
    toast.classList.add("visible", "dragging");

    toast.setPointerCapture(e.pointerId);
  });

  toast.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    deltaY = Math.max(0, e.clientY - startY);
    const y = baseY + deltaY;

    toast.style.setProperty("--toastY", `${y}px`);

    // fade slightly while dragging down
    const alpha = Math.max(0, 1 - y / 180);
    toast.style.opacity = String(alpha);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;

    toast.classList.remove("dragging");
    toast.style.opacity = "";

    if (baseY + deltaY > threshold) {
      // dismiss fast
      toast.style.removeProperty("--toastY");
      startHideToast(true);
      return;
    }

    // snap back to visible smoothly (no restart)
    toast.style.removeProperty("--toastY");
    toast.classList.add("visible");
    toast.classList.remove("hiding", "fast");

    scheduleToastTimers(remainingStartHide, remainingCleanup);
  }

  toast.addEventListener("pointerup", endDrag);
  toast.addEventListener("pointercancel", endDrag);
}
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

    // If any item in this menu has an image, reserve media space for ALL cards in this menu
    // so card heights stay aligned even with mixed image availability.
    const menuHasImages = menu.items.some((it) => Boolean(it.image));

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

      const mediaHtml = !menuHasImages
        ? ""
        : item.image
          ? `<img class="card-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">`
          : `<div class="card-img-placeholder" aria-hidden="true"></div>`;

      card.innerHTML = `
        ${mediaHtml}
        <div class="card-content">
          <div class="card-title">${escapeHtml(item.name)}</div>
          <div class="card-sub">${escapeHtml(ingredientsText)}</div>
          ${descriptionHtml}
        </div>
        <div class="card-actions">
          <button class="add-btn" type="button">Add</button>
        </div>
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
