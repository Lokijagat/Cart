(function () {
  if (window.__mixmachCartOffersInit) return;
  window.__mixmachCartOffersInit = true;

  // Ordered most-specific first, each targeting the actual visible sliding
  // panel (not an outer full-viewport wrapper, which is why the banner used
  // to render outside the visible cart on themes where a wrapper matched
  // before its inner panel did).
  var DRAWER_SELECTORS = [
    "#update-cart", // this store's custom Alpine-based theme
    'dialog[aria-labelledby="cart-drawer-heading"]', // Shopify's Horizon theme family (cart-specific, not other drawers)
    "dialog.theme-drawer__dialog",
    "#CartDrawer",
    ".cart-drawer",
    "[data-cart-drawer]",
    "cart-drawer",
  ];
  var DRAWER_HEADING_SELECTORS = [".x-cart-heading", ".theme-drawer__header"];
  var DRAWER_SLOT_CLASS = "mixmach-flash-offer-drawer-slot";

  var PAGE_MAIN_SELECTORS = ["#MainContent", 'main[role="main"]', "main"];
  var PAGE_DISCOUNT_LANDMARK_SELECTORS = [
    'label[for="x-cart-discount-field"]',
    'label[for*="discount" i]',
    'input[name*="discount" i]',
  ];
  var PAGE_DISCOUNT_SLOT_CLASS = "mixmach-flash-offer-page-discount-slot";
  var PAGE_BLOCK_SLOT_SELECTOR = ".mixmach-flash-offer-page-slot";

  var ROTATE_INTERVAL_MS = 4000;
  var FADE_DURATION_MS = 250;

  function applyOffer(banner, offer) {
    banner.style.backgroundColor = offer.backgroundColor || "#2d4a2f";
    banner.style.color = offer.textColor || "#ffffff";
    banner.textContent = offer.message || "";
  }

  function renderInto(container, offers, contextKey) {
    var applicable = offers.filter(function (offer) {
      return offer[contextKey];
    });

    var signature = applicable
      .map(function (offer) {
        return offer.message + "|" + offer.backgroundColor + "|" + offer.textColor;
      })
      .join("::");

    // Same offers as last time this container was refreshed: leave the
    // running rotation/timer alone instead of restarting it on every
    // debounced DOM-mutation refresh.
    if (container.dataset.mixmachSignature === signature) return;
    container.dataset.mixmachSignature = signature;

    if (container.__mixmachRotationTimer) {
      clearInterval(container.__mixmachRotationTimer);
      container.__mixmachRotationTimer = null;
    }
    container.innerHTML = "";

    if (!applicable.length) return;

    var banner = document.createElement("div");
    banner.className = "mixmach-flash-offer";
    container.appendChild(banner);

    var index = 0;
    applyOffer(banner, applicable[index]);

    if (applicable.length > 1) {
      container.__mixmachRotationTimer = setInterval(function () {
        banner.classList.add("mixmach-flash-offer-fade");
        setTimeout(function () {
          index = (index + 1) % applicable.length;
          applyOffer(banner, applicable[index]);
          banner.classList.remove("mixmach-flash-offer-fade");
        }, FADE_DURATION_MS);
      }, ROTATE_INTERVAL_MS);
    }
  }

  function findFirst(selectors, root) {
    root = root || document;
    for (var i = 0; i < selectors.length; i++) {
      var el = root.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function isCartPage() {
    return /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?cart\/?(?:$|\?)/i.test(window.location.pathname);
  }

  function ensureSlot(slotClass, referenceEl, position) {
    if (!referenceEl || !referenceEl.parentNode) return null;

    var existing = document.querySelector("." + slotClass);
    if (existing) return existing;

    var slot = document.createElement("div");
    slot.className = slotClass;
    if (position === "after") {
      referenceEl.parentNode.insertBefore(slot, referenceEl.nextSibling);
    } else {
      referenceEl.parentNode.insertBefore(slot, referenceEl);
    }
    return slot;
  }

  // --- Cart drawer ---

  function findDrawer() {
    return findFirst(DRAWER_SELECTORS);
  }

  function refreshDrawer(offers) {
    var drawer = findDrawer();
    if (!drawer) return;

    var slot = drawer.querySelector("." + DRAWER_SLOT_CLASS);
    if (!slot) {
      slot = document.createElement("div");
      slot.className = DRAWER_SLOT_CLASS;

      var heading = findFirst(DRAWER_HEADING_SELECTORS, drawer);
      if (heading && heading.parentNode) {
        heading.parentNode.insertBefore(slot, heading.nextSibling);
      } else {
        drawer.insertBefore(slot, drawer.firstChild);
      }
    }

    renderInto(slot, offers, "showOnDrawer");
  }

  // --- Cart page ---

  function refreshCartPage(offers) {
    if (!isCartPage()) return;

    var main = findFirst(PAGE_MAIN_SELECTORS) || document.body;

    // Best-effort auto placement, right before the discount code field.
    var discountLandmark = findFirst(PAGE_DISCOUNT_LANDMARK_SELECTORS, main);
    var discountSlot = ensureSlot(PAGE_DISCOUNT_SLOT_CLASS, discountLandmark, "before");
    if (discountSlot) renderInto(discountSlot, offers, "showOnCartPage");

    // Merchant-placed "Mixmach Flash Offers" app block: works on any theme,
    // wherever the merchant dragged it in the theme editor.
    document.querySelectorAll(PAGE_BLOCK_SLOT_SELECTOR).forEach(function (slot) {
      renderInto(slot, offers, "showOnCartPage");
    });
  }

  function init(offers) {
    if (!offers.length) return;

    refreshDrawer(offers);
    refreshCartPage(offers);

    var refreshTimer = null;
    var observer = new MutationObserver(function () {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () {
        refreshDrawer(offers);
        refreshCartPage(offers);
      }, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  fetch("/apps/mixmach/cart-settings", { credentials: "same-origin" })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      init(data.flashOffers || []);
    })
    .catch(function () {});
})();
