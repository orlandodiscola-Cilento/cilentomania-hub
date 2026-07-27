(function (global) {
  'use strict';

  const STORAGE_KEY = 'cilentomania_language';
  const DEFAULT_LANGUAGE = 'it';
  const SUPPORTED_LANGUAGES = {
    it: { code: 'IT', flag: 'assets/flags/it.svg', name: 'Italiano' },
    en: { code: 'EN', flag: 'assets/flags/gb.svg', name: 'English' },
    de: { code: 'DE', flag: 'assets/flags/de.svg', name: 'Deutsch' },
    fr: { code: 'FR', flag: 'assets/flags/fr.svg', name: 'Français' },
    es: { code: 'ES', flag: 'assets/flags/es.svg', name: 'Español' }
  };

  const dictionaryCache = new Map();
  let currentLanguage = DEFAULT_LANGUAGE;
  let currentDictionary = {};
  let fallbackDictionary = {};
  let initialized = false;
  let initializationPromise = null;

  function getSupportedLanguages() {
    return Object.keys(SUPPORTED_LANGUAGES);
  }

  function normalizeLanguage(input) {
    const value = String(input || '').trim().toLowerCase();
    if (!value) return DEFAULT_LANGUAGE;
    const primary = value.split('-')[0];
    return getSupportedLanguages().includes(primary) ? primary : DEFAULT_LANGUAGE;
  }

  function readStoredLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeLanguage(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function detectBrowserLanguage() {
    const browser = navigator.language || navigator.userLanguage || '';
    return normalizeLanguage(browser);
  }

  async function loadDictionary(language) {
    if (dictionaryCache.has(language)) return dictionaryCache.get(language);
    const url = 'i18n/' + language + '.json';
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('i18n-load-failed-' + language + '-http-' + response.status);
    }
    const dictionary = await response.json();
    dictionaryCache.set(language, dictionary);
    return dictionary;
  }

  function getByPath(object, keyPath) {
    return keyPath.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), object);
  }

  function formatTemplate(value, params) {
    if (!params || typeof value !== 'string') return value;
    return value.replace(/\{(\w+)\}/g, function (_, token) {
      return Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : '{' + token + '}';
    });
  }

  function t(key, fallback, params) {
    const fromCurrent = getByPath(currentDictionary, key);
    if (typeof fromCurrent === 'string') return formatTemplate(fromCurrent, params);

    const fromFallback = getByPath(fallbackDictionary, key);
    if (typeof fromFallback === 'string') return formatTemplate(fromFallback, params);

    if (typeof fallback === 'string' && fallback) return formatTemplate(fallback, params);
    return key;
  }

  function applyToElement(element) {
    const textKey = element.getAttribute('data-i18n');
    if (textKey) element.textContent = t(textKey, element.textContent || '');

    const placeholderKey = element.getAttribute('data-i18n-placeholder');
    if (placeholderKey) element.setAttribute('placeholder', t(placeholderKey, element.getAttribute('placeholder') || ''));

    const ariaLabelKey = element.getAttribute('data-i18n-aria-label');
    if (ariaLabelKey) element.setAttribute('aria-label', t(ariaLabelKey, element.getAttribute('aria-label') || ''));

    const titleKey = element.getAttribute('data-i18n-title');
    if (titleKey) element.setAttribute('title', t(titleKey, element.getAttribute('title') || ''));
  }

  function applyTranslations(rootElement) {
    const root = rootElement || document;
    const selector = '[data-i18n], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title]';
    if (root.matches && root.matches(selector)) applyToElement(root);
    root.querySelectorAll(selector).forEach(applyToElement);
  }

  function updateHtmlLanguageAttribute(language) {
    document.documentElement.setAttribute('lang', language);
  }

  function updateLanguageSelectorUI(language) {
    const meta = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
    const trigger = document.querySelector('[data-language-trigger]');
    const current = document.querySelector('[data-language-current]');
    const menu = document.querySelector('[data-language-menu]');
    if (current) {
      if (current.tagName === 'IMG') {
        current.setAttribute('src', meta.flag);
      } else {
        current.textContent = meta.name;
      }
    }
    if (trigger) {
      const label = t('language.selector') + '. ' + t('language.current') + ': ' + meta.name;
      trigger.setAttribute('title', label);
      trigger.setAttribute('aria-label', label);
    }
    if (menu) {
      menu.setAttribute('aria-label', t('language.selector'));
    }

    document.querySelectorAll('[data-language-option]').forEach(option => {
      const selected = option.getAttribute('data-language-option') === language;
      option.setAttribute('aria-checked', String(selected));
      option.classList.toggle('is-selected', selected);
    });
  }

  function dispatchLanguageChange(language) {
    document.dispatchEvent(new CustomEvent('cilentomania:languagechange', { detail: { language } }));
  }

  async function setLanguage(language, options) {
    const opts = options || {};
    const normalized = normalizeLanguage(language);

    try {
      const targetDictionary = await loadDictionary(normalized);
      if (!Object.keys(fallbackDictionary).length) {
        fallbackDictionary = await loadDictionary(DEFAULT_LANGUAGE);
      }
      currentLanguage = normalized;
      currentDictionary = targetDictionary;
    } catch (error) {
      console.warn('i18n: impossibile caricare la lingua richiesta, fallback italiano.', error);
      currentLanguage = DEFAULT_LANGUAGE;
      fallbackDictionary = Object.keys(fallbackDictionary).length ? fallbackDictionary : await loadDictionary(DEFAULT_LANGUAGE);
      currentDictionary = fallbackDictionary;
    }

    updateHtmlLanguageAttribute(currentLanguage);
    applyTranslations(document);
    updateLanguageSelectorUI(currentLanguage);

    if (opts.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, currentLanguage);
      } catch (error) {
        // Ignore storage errors.
      }
    }

    if (opts.emit !== false) dispatchLanguageChange(currentLanguage);
    return currentLanguage;
  }

  function getCurrentLanguage() {
    return currentLanguage;
  }

  function buildLanguageSelector() {
    const host = document.querySelector('[data-language-selector]');
    if (!host) return;

    const trigger = host.querySelector('[data-language-trigger]');
    const menu = host.querySelector('[data-language-menu]');
    if (!trigger || !menu) return;

    menu.innerHTML = getSupportedLanguages().map(language => {
      const meta = SUPPORTED_LANGUAGES[language];
      return '<button type="button" role="menuitemradio" class="language-selector__option" data-language-option="' + language + '" aria-checked="false">'
        + '<img class="language-selector__flag language-option-flag" src="' + meta.flag + '" alt="" aria-hidden="true">'
        + '<span class="language-selector__name">' + meta.name + '</span>'
        + '<span class="language-selector__check" aria-hidden="true">✓</span>'
        + '</button>';
    }).join('');

    const closeMenu = function () {
      host.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const openMenu = function () {
      host.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', function () {
      if (host.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openMenu();
      const first = menu.querySelector('[data-language-option]');
      if (first) first.focus();
    });

    menu.addEventListener('click', function (event) {
      const option = event.target.closest('[data-language-option]');
      if (!option) return;
      const language = option.getAttribute('data-language-option');
      setLanguage(language).finally(closeMenu);
    });

    menu.addEventListener('keydown', function (event) {
      const options = Array.from(menu.querySelectorAll('[data-language-option]'));
      const index = options.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        trigger.focus({ preventScroll: true });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = options[(index + 1 + options.length) % options.length];
        next?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const next = options[(index - 1 + options.length) % options.length];
        next?.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!host.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  async function init() {
    if (initialized) return;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async function () {
    buildLanguageSelector();

    const storedLanguage = readStoredLanguage();
    const browserLanguage = detectBrowserLanguage();
    const initialLanguage = storedLanguage || browserLanguage || DEFAULT_LANGUAGE;

    fallbackDictionary = await loadDictionary(DEFAULT_LANGUAGE).catch(function (error) {
      console.warn('i18n: impossibile caricare il fallback italiano.', error);
      return {};
    });
    currentDictionary = fallbackDictionary;
    currentLanguage = DEFAULT_LANGUAGE;

    await setLanguage(initialLanguage, { persist: storedLanguage !== null, emit: false });
    initialized = true;
    })();

    return initializationPromise;
  }

  global.CilentomaniaI18n = {
    init,
    t,
    setLanguage,
    getCurrentLanguage,
    applyTranslations,
    getSupportedLanguages,
    normalizeLanguage
  };
})(window);
