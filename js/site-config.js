/* Site URL for canonical + Open Graph (edit before deploy if auto-detect is not enough for social crawlers). */
(function () {
  'use strict';
  var meta = document.querySelector('meta[name="site-base"]');
  var configured = meta && meta.getAttribute('content');
  configured = configured ? configured.replace(/\/$/, '') : '';
  var base = configured;
  if (!base && location.protocol.indexOf('http') === 0 && location.host) {
    var dir = location.pathname.replace(/[^/]*$/, '');
    base = location.origin + (dir.endsWith('/') ? dir.slice(0, -1) : dir);
    if (base.endsWith('/')) base = base.slice(0, -1);
  }
  if (!base) return;

  function abs(path) {
    return base + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function setProp(prop, val) {
    var el = document.querySelector('meta[property="' + prop + '"]');
    if (el) el.setAttribute('content', val);
  }
  function setName(name, val) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (el) el.setAttribute('content', val);
  }

  setProp('og:url', base + '/');
  setProp('og:image', abs('/assets/og-image.svg'));
  setName('twitter:image', abs('/assets/og-image.svg'));

  var canonical = document.getElementById('canonicalUrl');
  if (canonical) canonical.setAttribute('href', base + '/');
})();
