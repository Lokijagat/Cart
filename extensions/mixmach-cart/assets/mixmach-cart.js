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
  var DRAWER_OFFER_SLOT_CLASS = "mixmach-flash-offer-drawer-slot";
  var DRAWER_PROGRESS_SLOT_CLASS = "mixmach-progress-bar-drawer-slot";

  var PAGE_MAIN_SELECTORS = ["#MainContent", 'main[role="main"]', "main"];
  var PAGE_DISCOUNT_LANDMARK_SELECTORS = [
    'label[for="x-cart-discount-field"]',
    'label[for*="discount" i]',
    'input[name*="discount" i]',
  ];
  var PAGE_OFFER_SLOT_CLASS = "mixmach-flash-offer-page-discount-slot";
  var PAGE_PROGRESS_SLOT_CLASS = "mixmach-progress-bar-page-discount-slot";
  var PAGE_OFFER_BLOCK_SELECTOR = ".mixmach-flash-offer-page-slot";
  var PAGE_PROGRESS_BLOCK_SELECTOR = ".mixmach-progress-bar-page-slot";

  var ROTATE_INTERVAL_MS = 4000;
  var FADE_DURATION_MS = 250;

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

  function getCartTotal() {
    return fetch("/cart.js", { credentials: "same-origin" })
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        return cart.total_price / 100;
      })
      .catch(function () {
        return null;
      });
  }

  // --- Flash offers ---

  function applyOffer(banner, offer) {
    banner.style.backgroundColor = offer.backgroundColor || "#2d4a2f";
    banner.style.color = offer.textColor || "#ffffff";
    banner.textContent = offer.message || "";
  }

  function renderOffersInto(container, offers, contextKey) {
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

  // --- Progress bar ---

  function buildMilestones(progressBar) {
    var milestones = [];
    if (progressBar.freeShippingThreshold != null) {
      milestones.push({ amount: progressBar.freeShippingThreshold, label: "Free Shipping", icon: "🚚" });
    }
    (progressBar.tiers || []).forEach(function (tier) {
      milestones.push({ amount: tier.minimumAmount, label: tier.percentage + "% Off", icon: "🎁" });
    });
    milestones.sort(function (a, b) {
      return a.amount - b.amount;
    });
    return milestones;
  }

  function renderProgressBarInto(container, progressBar, contextKey, total) {
    if (!progressBar || !progressBar[contextKey] || total == null) {
      container.innerHTML = "";
      return;
    }

    var milestones = buildMilestones(progressBar);
    if (!milestones.length) {
      container.innerHTML = "";
      return;
    }

    var signature = total.toFixed(2) + "|" + milestones.map(function (m) { return m.amount; }).join(",");
    if (container.dataset.mixmachSignature === signature) return;
    container.dataset.mixmachSignature = signature;

    var maxAmount = milestones[milestones.length - 1].amount;
    var fillPercent = Math.max(0, Math.min(100, (total / maxAmount) * 100));
    var nextMilestone = milestones.filter(function (m) {
      return total < m.amount;
    })[0];

    var messageEl = document.createElement("div");
    messageEl.className = "mixmach-progress-message";
    messageEl.textContent = nextMilestone
      ? "Add " + (nextMilestone.amount - total).toFixed(2) + " more to unlock " + nextMilestone.label + "!"
      : "🎉 You've unlocked every reward!";

    var track = document.createElement("div");
    track.className = "mixmach-progress-track";

    var fill = document.createElement("div");
    fill.className = "mixmach-progress-fill";
    fill.style.width = fillPercent + "%";
    track.appendChild(fill);

    milestones.forEach(function (m) {
      var pos = (m.amount / maxAmount) * 100;
      var reached = total >= m.amount;

      var marker = document.createElement("div");
      marker.className = "mixmach-progress-marker" + (reached ? " mixmach-progress-marker--reached" : "");
      marker.style.left = pos + "%";

      var icon = document.createElement("span");
      icon.className = "mixmach-progress-marker__icon";
      icon.textContent = m.icon;

      var label = document.createElement("span");
      label.className = "mixmach-progress-marker__label";
      label.textContent = m.label;

      marker.appendChild(icon);
      marker.appendChild(label);
      track.appendChild(marker);
    });

    var wrapper = document.createElement("div");
    wrapper.className = "mixmach-progress-bar";
    wrapper.appendChild(messageEl);
    wrapper.appendChild(track);

    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  // --- Cart drawer ---

  function findDrawer() {
    return findFirst(DRAWER_SELECTORS);
  }

  function drawerAnchor(drawer) {
    var offerSlot = drawer.querySelector("." + DRAWER_OFFER_SLOT_CLASS);
    if (offerSlot) return offerSlot;
    return findFirst(DRAWER_HEADING_SELECTORS, drawer);
  }

  function refreshDrawer(offers, progressBar, total) {
    var drawer = findDrawer();
    if (!drawer) return;

    var offerSlot = drawer.querySelector("." + DRAWER_OFFER_SLOT_CLASS);
    if (!offerSlot) {
      var heading = findFirst(DRAWER_HEADING_SELECTORS, drawer);
      if (heading && heading.parentNode) {
        offerSlot = document.createElement("div");
        offerSlot.className = DRAWER_OFFER_SLOT_CLASS;
        heading.parentNode.insertBefore(offerSlot, heading.nextSibling);
      }
    }
    if (offerSlot) renderOffersInto(offerSlot, offers, "showOnDrawer");

    var progressSlot = drawer.querySelector("." + DRAWER_PROGRESS_SLOT_CLASS);
    if (!progressSlot) {
      var anchor = drawerAnchor(drawer);
      if (anchor && anchor.parentNode) {
        progressSlot = document.createElement("div");
        progressSlot.className = DRAWER_PROGRESS_SLOT_CLASS;
        anchor.parentNode.insertBefore(progressSlot, anchor.nextSibling);
      }
    }
    if (progressSlot) renderProgressBarInto(progressSlot, progressBar, "showOnDrawer", total);
  }

  // --- Cart page ---

  function refreshCartPage(offers, progressBar, total) {
    if (!isCartPage()) return;

    var main = findFirst(PAGE_MAIN_SELECTORS) || document.body;
    var discountLandmark = findFirst(PAGE_DISCOUNT_LANDMARK_SELECTORS, main);

    var offerSlot = ensureSlot(PAGE_OFFER_SLOT_CLASS, discountLandmark, "before");
    if (offerSlot) renderOffersInto(offerSlot, offers, "showOnCartPage");

    var progressSlot = ensureSlot(PAGE_PROGRESS_SLOT_CLASS, discountLandmark, "before");
    if (progressSlot) renderProgressBarInto(progressSlot, progressBar, "showOnCartPage", total);

    // Merchant-placed app blocks: work on any theme, wherever dragged in the theme editor.
    document.querySelectorAll(PAGE_OFFER_BLOCK_SELECTOR).forEach(function (slot) {
      renderOffersInto(slot, offers, "showOnCartPage");
    });
    document.querySelectorAll(PAGE_PROGRESS_BLOCK_SELECTOR).forEach(function (slot) {
      renderProgressBarInto(slot, progressBar, "showOnCartPage", total);
    });
  }

  function init(offers, progressBar) {
    if (!offers.length && !progressBar) return;

    function refreshAll() {
      getCartTotal().then(function (total) {
        refreshDrawer(offers, progressBar, total);
        refreshCartPage(offers, progressBar, total);
      });
    }

    refreshAll();

    var refreshTimer = null;
    var observer = new MutationObserver(function () {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refreshAll, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  fetch("/apps/mixmach/cart-settings", { credentials: "same-origin" })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      init(data.flashOffers || [], data.progressBar || null);
    })
    .catch(function () {});
})();
