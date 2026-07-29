/*
 * CO2 LASER SERVICES — moteur de traduction léger (sans dépendance).
 *
 * Usage dans le HTML :
 *   <span data-i18n="p1.lead"></span>            → remplace le texte
 *   <input data-i18n-placeholder="form.name">    → remplace le placeholder
 *   <a data-i18n-title="nav.contact">            → remplace l'attribut title
 *   <body data-page-title="title.contact">       → remplace <title> et la meta description
 *
 * La langue choisie est mémorisée (localStorage) et suivie d'une page à l'autre.
 */
(function () {
  'use strict';

  var DICT = window.CO2LS_CONTENT || {};
  var SUPPORTED = ['fr', 'de', 'en'];
  var STORAGE_KEY = 'co2ls-lang';
  var current = 'fr';

  function pickInitialLang() {
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;

    var stored;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    // Français par défaut : c'est la langue de référence du site.
    return 'fr';
  }

  function t(key) {
    var table = DICT[current] || DICT.fr || {};
    if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    var fallback = DICT.fr || {};
    return Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : '';
  }

  function apply(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });

    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });

    scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });

    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });

    // Titre du document + meta description
    var pageTitleKey = document.body && document.body.getAttribute('data-page-title');
    if (pageTitleKey) document.title = t(pageTitleKey);

    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta.description'));

    document.documentElement.setAttribute('lang', t('html.lang') || current);

    // État visuel des sélecteurs de langue
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      var on = el.getAttribute('data-lang') === current;
      el.classList.toggle('is-active', on);
      if (el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', String(on));
    });
  }

  function setLang(lang, opts) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* mode privé */ }
    apply();
    if (!opts || !opts.silent) {
      document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: lang } }));
    }
  }

  current = pickInitialLang();
  document.documentElement.setAttribute('lang', current);

  var api = {
    get lang() { return current; },
    supported: SUPPORTED,
    t: t,
    apply: apply,
    setLang: setLang
  };
  window.CO2LS = Object.assign(window.CO2LS || {}, { i18n: api });

  function boot() {
    apply();
    // Délégation : tout élément [data-lang] devient un bouton de langue.
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-lang]');
      if (!btn) return;
      ev.preventDefault();
      setLang(btn.getAttribute('data-lang'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
