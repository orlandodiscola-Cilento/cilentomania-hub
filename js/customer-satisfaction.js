(function () {
  "use strict";

  const DEFAULT_CONFIG_URL = "/data/customer-satisfaction.json";
  const THEMES = new Set(["purple"]);
  const ICONS = {
    form: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 2v4h4l-4-4ZM8 12h8v-2H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z"/></svg>'
  };

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function isSafeFormUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && (url.hostname === "forms.gle" || url.hostname === "docs.google.com");
    } catch (error) {
      return false;
    }
  }

  function renderCustomerSatisfaction(mount, config) {
    if (!config || config.enabled !== true || !config.button || !isSafeFormUrl(config.button.url)) {
      mount.hidden = true;
      return;
    }

    const theme = THEMES.has(config.appearance && config.appearance.theme)
      ? config.appearance.theme
      : "purple";
    mount.className = `customer-satisfaction customer-satisfaction--${theme}`;
    mount.hidden = false;
    mount.replaceChildren();

    const title = createElement("h2", "customer-satisfaction__title", config.title || "");
    const text = createElement("p", "customer-satisfaction__text", config.text || "");
    const link = createElement("a", "customer-satisfaction__link");
    link.href = config.button.url;
    link.setAttribute("aria-label", config.button.label || "Apri il questionario di gradimento");

    if (config.button.target === "_blank") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    const icon = createElement("span", "customer-satisfaction__icon");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = ICONS[config.icon && config.icon.name] || ICONS.form;

    const copy = createElement("span", "customer-satisfaction__copy");
    copy.append(
      createElement("strong", "", config.button.label || ""),
      createElement("span", "", config.button.description || "")
    );

    link.append(icon, copy);
    if (!config.appearance || config.appearance.showArrow !== false) {
      const arrow = createElement("span", "customer-satisfaction__arrow", "›");
      arrow.setAttribute("aria-hidden", "true");
      link.append(arrow);
    }

    mount.append(title, text, link);
  }

  async function initializeMount(mount) {
    const configUrl = mount.dataset.customerSatisfactionConfig || DEFAULT_CONFIG_URL;
    try {
      const response = await fetch(configUrl, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderCustomerSatisfaction(mount, await response.json());
    } catch (error) {
      mount.hidden = true;
      console.error("Customer Satisfaction non disponibile:", error);
    }
  }

  function initialize() {
    document.querySelectorAll("[data-customer-satisfaction]").forEach(initializeMount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
