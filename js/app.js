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

// ---------------- Toast + swipe-to-dismiss ----------------
let toastTimer = null;
let toastInitialized = false;

function initToastSwipe() {
  if (toastInitialized) return;
  toastInitialized = true;

  const toast = document.getElementById("toast");
  if (!toast) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;

  const threshold = 55; // px swipe-down to dismiss

  function setDragTransform(deltaY) {
    const clamped = Math.max(0, deltaY); // only allow downward drag
    toast.style.transform = `translateX(-50%) translateY(${clamped}px)`;
    // optional: fade slightly while dragging down
    const alpha = Math.max(0, 1 - clamped / 180);
    toast.style.opacity = String(alpha);
  }

  function resetTransform() {
    toast.style.transform = "";
    toast.style.opacity = "";
  }

  function dismissToastNow() {
    clearTimeout(toastTimer);
    toast.classList.remove("show");
    toast.classList.add("dismiss");
    // clean up after dismiss animation
    setTimeout(() => {
      toast.classList.remove("dismiss");
      resetTransform();
    }, 300);
  }

  function onStart(clientY) {
    // Only allow swipe while toast is visible
    if (!toast.classList.contains("show")) return;
    dragging = true;
    startY = clientY;
    currentY = clientY;

    // Stop CSS animations so drag feels direct
    toast.style.animation = "none";
  }

  function onMove(clientY) {
    if (!dragging) return;
    currentY = clientY;
    const delta = currentY - startY;
    setDragTransform(delta);
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;

    const delta = currentY - startY;

    // restore animation so it can continue or exit
    toast.style.animation = "";

    if (delta > threshold) {
      dismissToastNow();
    } else {
      // snap back to normal visible state
      resetTransform();

      // re-apply show animations cleanly (continue with remaining time is hard; restart is simplest)
      toast.classList.remove("show");
      void toast.offsetWidth;
      toast.classList.add("show");

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove("show");
      }, 6100);
    }
  }

  // Touch
  toast.addEventListener("touchstart", (e) => onStart(e.touches[0].clientY), { passive: true });
  toast.addEventListener("touchmove", (e) => onMove(e.touches[0].clientY), { passive: true });
  toast.addEventListener("touchend", onEnd);

  // Mouse (desktop drag)
  toast.addEventListener("mousedown", (e) => onStart(e.clientY));
  window.addEventListener("mousemove", (e) => onMove(e.clientY));
  window.addEventListener("mouseup", onEnd);
}

function showAddedToCartToast(itemName) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  initToastSwipe();

  // reset any inline styles from dragging
  toast.style.transform = "";
  toast.style.opacity = "";
  toast.style.animation = "";

  toast.classList.remove("dismiss");
  toast.classList.remove("show");
  void toast.offsetWidth;

  toast.textContent = `${itemName} added to the cart`;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 6100);
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

// Safety
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderAllMenus();