/* ============================================================================
   AMIT CHOUHAN — testimonials.js

   👉 EDIT THIS ARRAY to add real testimonials. Each entry:
        {
          quote       : "...",                       // the testimonial text
          name        : "Jane Doe",                  // person's name
          role        : "IT Manager, Acme Corp",     // role + company
          avatar      : "assets/testimonials/jane.jpg", // OPTIONAL photo path
          placeholder : true                          // shows a "Placeholder" flag
        }
   - Omit `avatar` to show the default avatar icon.
   - Delete `placeholder: true` once a testimonial is real.
   ========================================================================== */
var TESTIMONIALS = [
  {
    quote: "Amit kept our entire branch network running without a single major outage. Responsive, reliable, and great with users.",
    name: "[ Add Name ]",
    role: "Branch Manager, [Company]",
    placeholder: true
  },
  {
    quote: "He built our internal HRMS in weeks, not months. Saved the team hours every week.",
    name: "[ Add Name ]",
    role: "Operations Lead, [Company]",
    placeholder: true
  },
  {
    quote: "Whenever something broke, Amit fixed it fast and explained it simply. A real asset to the IT team.",
    name: "[ Add Name ]",
    role: "Team Lead, [Company]",
    placeholder: true
  },
  {
    quote: "From Active Directory to custom dashboards — he handles the full stack of IT and tooling.",
    name: "[ Add Name ]",
    role: "Founder, [Company]",
    placeholder: true
  }
];

(function () {
  'use strict';
  var track = document.getElementById('testimonialTrack');
  if (!track || !Array.isArray(TESTIMONIALS) || !TESTIMONIALS.length) return;

  var PERSON_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function card(t, hidden) {
    var avatar = t.avatar ? '<img src="' + esc(t.avatar) + '" alt="" />' : PERSON_ICON;
    var flag = t.placeholder ? '<span class="quote__flag">Placeholder</span>' : '';
    return '<figure class="nb-card quote"' + (hidden ? ' aria-hidden="true"' : '') + '>' +
        flag +
        '<span class="quote__mark" aria-hidden="true">&ldquo;</span>' +
        '<blockquote class="quote__text">' + esc(t.quote) + '</blockquote>' +
        '<figcaption class="quote__person">' +
          '<span class="quote__avatar" aria-hidden="true">' + avatar + '</span>' +
          '<span class="quote__meta">' +
            '<span class="quote__name">' + esc(t.name) + '</span>' +
            '<span class="quote__role mono">' + esc(t.role) + '</span>' +
          '</span>' +
        '</figcaption>' +
      '</figure>';
  }

  // First set is read by screen readers; the duplicate set (aria-hidden)
  // makes the marquee loop seamless.
  var setA = TESTIMONIALS.map(function (t) { return card(t, false); }).join('');
  var setB = TESTIMONIALS.map(function (t) { return card(t, true); }).join('');
  track.innerHTML = setA + setB;
})();
