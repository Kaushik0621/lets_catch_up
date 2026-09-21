/* ============================================================
   Motion + interaction layer.
   Motion One (UMD) is optional: if it fails to load, everything
   is revealed immediately and the site still works.
   ============================================================ */
(function () {
  "use strict";

  var M = window.Motion || null;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animated = !!M && !reduced;

  var soft   = animated ? M.spring({ stiffness: 190, damping: 24 }) : null;
  var snappy = animated ? M.spring({ stiffness: 320, damping: 30 }) : null;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function showAll(nodes) {
    each(nodes, function (n) { n.style.opacity = "1"; n.style.filter = "none"; n.style.transform = "none"; });
  }

  /* ---------- 1. Theme ---------- */
  var root = document.documentElement;
  function systemDark() { return window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function currentTheme() { return root.getAttribute("data-theme") || (systemDark() ? "dark" : "light"); }
  var themeListeners = [];
  function applyTheme(next) {
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    themeListeners.forEach(function (fn) { try { fn(next); } catch (e) {} });
  }
  each(document.querySelectorAll(".theme-toggle"), function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      if (document.startViewTransition && !reduced) document.startViewTransition(function () { applyTheme(next); });
      else applyTheme(next);
    });
  });

  /* ---------- 2. Entrance ---------- */
  var intro = document.querySelectorAll("[data-enter]");
  if (animated && intro.length) {
    M.animate(
      intro,
      { opacity: [0, 1], transform: ["translateY(10px)", "translateY(0px)"], filter: ["blur(6px)", "blur(0px)"] },
      { delay: M.stagger(0.06), easing: soft }
    );
  } else { showAll(intro); }

  /* ---------- 3. Scroll reveals ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (animated && reveals.length) {
    each(reveals, function (el) {
      var seen = false;
      M.inView(el, function () {
        if (seen) return;             // inView re-fires on every re-entry
        seen = true;
        M.animate(
          el,
          { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"], filter: ["blur(4px)", "blur(0px)"] },
          { easing: soft }
        );
      }, { margin: "0px 0px -10% 0px" });
    });
  } else { showAll(reveals); }

  /* ---------- 4. Scroll-spy nav ---------- */
  var sections = document.querySelectorAll(".sec[id]");
  var navLinks = document.querySelectorAll(".rail-nav a, .topbar-nav a");

  function markActive(id) {
    each(navLinks, function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
  }
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var visible = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      // Whichever tracked section occupies the most of the viewport wins.
      var best = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; best = id; }
      });
      if (best) markActive(best);
    }, { threshold: [0, .15, .35, .6, .85], rootMargin: "-15% 0px -45% 0px" });
    each(sections, function (s) { obs.observe(s); });
  }

  /* ---------- 5. Cursor spotlight on cards ---------- */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    each(document.querySelectorAll("[data-tilt]"), function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- 6. Expandable roles ---------- */
  each(document.querySelectorAll("[data-expand]"), function (row) {
    var panel = row.querySelector(".details");
    var chev = row.querySelector(".chev svg");
    if (!panel) return;

    var open = false;
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");

    function setOpen(next) {
      open = next;
      row.setAttribute("aria-expanded", String(open));
      row.classList.toggle("is-open", open);
      var target = open ? panel.scrollHeight : 0;
      if (animated) {
        M.animate(panel, { height: target + "px" }, { easing: soft }).finished.then(function () {
          if (open) panel.style.height = "auto";
        });
        if (chev) M.animate(chev, { transform: "rotate(" + (open ? 180 : 0) + "deg)" }, { easing: snappy });
      } else {
        panel.style.height = open ? "auto" : "0px";
        if (chev) chev.style.transform = "rotate(" + (open ? 180 : 0) + "deg)";
      }
    }

    function handle(e) {
      if (e.target.closest("a")) return;   // let real links work
      if (open) panel.style.height = panel.scrollHeight + "px"; // leave auto so it can animate back
      requestAnimationFrame(function () { setOpen(!open); });
    }

    row.addEventListener("click", handle);
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handle(e); }
    });
  });

  // A skyline per city, in a 200x48 band with the ground at y=44. Filled
  // silhouettes read at any size; the handful of `ln` paths — cables, arches,
  // wheel spokes — are stroked instead, because a 1px line has no area to fill.
  // Buildings are listed left to right, which is also the order they rise in.
  var SKY = {
    // Howrah Bridge spans the full band behind everything, the way the city
    // actually reads from the river. It is drawn first, so the buildings in
    // front of it paint over their share of the lattice.
    kolkata:
      '<path class="ln" d="M0 27 10 17 18 11 26 9 38 11 52 14 68 17.5 84 19.5 100 21 ' +
        '116 19.5 132 17.5 148 14 162 11 174 9 182 11 190 17 200 27"/>' +
      '<path class="ln" d="M10 17v13M18 11v19M26 9v21M38 11v19M52 14v16M68 17.5v12.5' +
        'M84 19.5v10.5M100 21v9M116 19.5v10.5M132 17.5v12.5M148 14v16M162 11v19' +
        'M174 9v21M182 11v19M190 17v13"/>' +
      '<path class="ln" d="M0 30 10 17M10 30 18 11M18 30 26 9M26 30 38 11M38 30 52 14' +
        'M52 30 68 17.5M68 30 84 19.5M84 30 100 21M116 30 100 21M132 30 116 19.5' +
        'M148 30 132 17.5M162 30 148 14M174 30 162 11M182 30 174 9M190 30 182 11M200 30 190 17"/>' +
      '<path class="ln" d="M0 30h200"/>' +
      '<path d="M0 44V34h14v10z"/>' +
      '<path d="M16 44V30h18v14z"/>' +
      '<path d="M18 30v-5.6l1.5-3 1.5 3V30zM30 30v-5.6l1.5-3 1.5 3V30z"/>' +
      '<path d="M23 30v-8l2-5 2 5v8z"/>' +
      '<path d="M36 44V33h22v11z"/>' +
      '<path d="M40 33a2 2 0 0 1 4 0zM50 33a2 2 0 0 1 4 0z"/>' +
      '<path d="M60 44V29h56v15z"/>' +
      '<path class="ln" d="M60 33h56"/>' +
      '<path class="ln" d="M83 44v-6a5 5 0 0 1 10 0v6"/>' +
      '<path d="M63 29v-3h4v3zM109 29v-3h4v3z"/>' +
      '<path d="M63 26a2 2 0 0 1 4 0zM109 26a2 2 0 0 1 4 0z"/>' +
      '<path d="M78 29v-6h20v6z"/>' +
      '<path d="M78 23a10 10 0 0 1 20 0z"/>' +
      '<path d="M86 13v-3h4v3z"/>' +
      '<path class="ln" d="M88 10V7.8"/>' +
      '<circle cx="88" cy="6.7" r="1.1"/>' +
      '<path d="M119 44v-4h12v4z"/>' +
      '<path d="M122.4 40 123.2 18h3.6l.8 22z"/>' +
      '<path d="M121.6 15.8h7.6V18h-7.6z"/>' +
      '<path d="M123.8 15.8v-2.6h3.2v2.6z"/>' +
      '<path d="M123.8 13.2a1.6 1.6 0 0 1 3.2 0z"/>' +
      '<path class="ln" d="M125.4 11.6V9.4"/>' +
      '<path d="M134 44V32h7v12zM142 44V36h6v8z"/>' +
      '<path d="M152 44v-6h32v6z"/>' +
      '<path d="M154.4 38v-4.6h7V38zM155.8 33.4v-3.6h4.2v3.6zM157 29.8l.9-3.4.9 3.4z"/>' +
      '<path d="M174.6 38v-4.6h7V38zM176 33.4v-3.6h4.2v3.6zM177.2 29.8l.9-3.4.9 3.4z"/>' +
      '<path d="M163 38v-6h10v6zM164.8 32v-5h6.4v5zM166.4 27l1.8-5.4 1.8 5.4z"/>' +
      '<path class="ln" d="M168.2 21.6v-2M157.9 26.4v-1.6M178.1 26.4v-1.6"/>' +
      '<path d="M186 44V34h14v10z"/>',

    // King’s College crown tower · Marischal College · St Machar’s · the harbour
    aberdeen:
      '<path d="M4 44V30h44v14z"/>' +
      '<path d="M13 30V13h10v17z"/>' +
      '<path d="M12.2 11.4h11.6V13H12.2z"/>' +
      '<path d="M12.2 11.4V8l1.2-2.6L14.6 8v3.4zM21.4 11.4V8l1.2-2.6L23.8 8v3.4z"/>' +
      '<path class="ln" d="M14.8 11.4c0-5.4 6.4-5.4 6.4 0"/>' +
      '<path d="M18 2.4l1.7 4.6h-3.4z"/>' +
      '<path d="M27 30v-9l5.5-4.5L38 21v9z"/>' +
      '<path d="M54 44V27h38v17z"/>' +
      '<path d="M57 27v-8l2.2-4.2L61.4 19v8zM69.4 27V13l3.6-7 3.6 7v14zM85 27v-8l2.2-4.2L89.4 19v8z"/>' +
      '<path d="M96 44V32h9v12zM107 44V27h9v17zM118 44V34h7v10z"/>' +
      '<path d="M131 44V22h6v22zM147 44V22h6v22z"/>' +
      '<path d="M130.4 22 134 12l3.6 10zM146.4 22 150 12l3.6 10z"/>' +
      '<path d="M137 44V31h10v13z"/>' +
      '<path d="M166 44V26l2.2-4.6 2.2 4.6v18z"/>' +
      '<path d="M165 26h6.4v-1.8H165z"/>' +
      '<path d="M177.6 41.6h11.2V44h-11.2z"/>' +
      '<path d="M181.4 41.6V16h3.4v25.6z"/>' +
      '<path d="M184.8 17.8 198.4 13v2.9l-13.6 5z"/>' +
      '<path d="M181.4 19.4 176 21v-2.8l5.4-1.6z"/>' +
      '<path class="ln" d="M195.6 15.4v8.4"/>' +
      '<path d="M194.2 23.6h2.8v1.8h-2.8z"/>',

    // Kelvingrove · the university tower · the Clyde Arc · Finnieston Crane · Riverside
    glasgow:
      '<path d="M4 44V31h33v13z"/>' +
      '<path d="M8 31V19h5v12zM28 31V19h5v12z"/>' +
      '<path d="M7.4 19 10.5 12l3.1 7zM27.4 19 30.5 12l3.1 7z"/>' +
      '<path d="M18 31v-6h5v6z"/>' +
      '<path d="M47 44V21h9v23z"/>' +
      '<path d="M46.4 21 51.5 5l5.1 16z"/>' +
      '<path d="M64 44V30h7v14zM73 44V25h6v19zM81 44V33h5v11z"/>' +
      '<path d="M88 42h36v2H88z"/>' +
      '<path class="ln" d="M89 42c6-13 29-13 34 0M98 42v-6.4M106 42v-8.4M114 42v-6.4"/>' +
      '<path d="M133 44V16h5v28zM131 13.4h9V17h-9z"/>' +
      '<path d="M140 14.6l13 6.2v2.8l-13-5z"/>' +
      '<path class="ln" d="M151 22.4v7"/>' +
      '<path d="M156 44v-8l6-6 6 6 6-6 6 6 6-6 4 4v10z"/>' +
      '<path d="M192 44V33h7v11z"/>',

    // Parliament · Tower Bridge · the Shard · the Gherkin · the Eye · St Paul’s
    london:
      '<path d="M2 44V31h3v-5l2-4 2 4v5h6v-3l1.6-3 1.6 3v3h5.8v13z"/>' +
      '<path d="M26 44V19h5v25zM25.4 19 28.5 11l3.1 8z"/>' +
      '<path d="M34 44V34h4v-3l1-2 1 2v3h4v10z"/>' +
      '<path d="M47 42h32v2H47z"/>' +
      '<path d="M52 42V26h5v16zM51.6 26 54.5 19l2.9 7zM69 42V26h5v16zM68.6 26 71.5 19l2.9 7z"/>' +
      '<path d="M57 29.6h12v1.8H57z"/>' +
      '<path class="ln" d="M47 35c3.4-1.4 5-3.6 5-6.4M79 35c-3.4-1.4-5-3.6-5-6.4"/>' +
      '<path d="M84.6 44 88 9l3.4 35z"/>' +
      '<path d="M96.4 44V28c0-6.2 1.6-11.4 3.6-14.4 2 3 3.6 8.2 3.6 14.4v16z"/>' +
      '<path d="M107 44V27h6v17zM114 44V22h6v22zM113.6 22 117 17.6l3.4 4.4zM121 44V30h5v14z"/>' +
      '<g class="wheel"><circle class="ln" cx="144" cy="26" r="12.6"/>' +
      '<path class="ln" d="M144 13.4v25.2M131.4 26h25.2M135.1 17.1l17.8 17.8M152.9 17.1l-17.8 17.8"/>' +
      '<circle cx="144" cy="26" r="1.6"/></g>' +
      '<path d="M143 37.6 137.8 44h2.8l3.4-5zM145 37.6l5.2 6.4h-2.8l-3.4-5z"/>' +
      '<path d="M164 44V34h20v10z"/>' +
      '<path d="M168 34v-2.2h12V34z"/>' +
      '<path d="M167 31.8a7 7 0 0 1 14 0z"/>' +
      '<path d="M172.6 24.8h2.8v-4.4h-2.8z"/>' +
      '<path d="M173.6 20.4h.8v-3h-.8zM172.8 18.4h2.4v.8h-2.4z"/>' +
      '<path d="M189 44V32h4.6v12zM196 44V36h3.4v8z"/>'
  };

  function skySvg(key) {
    if (!SKY[key]) return "";
    // Line art: every shape carries pathLength="1" so one dash rule draws them
    // all at the same rate, whatever their real perimeter. The fill is the
    // surface colour — invisible, but it hides the parts of a building that
    // sit behind the one in front of it.
    // xMidYMax: the strip keeps the band's 200:48 proportions, so the Eye
    // stays round, and it stays anchored to the ground line if it is cropped.
    var body = SKY[key].replace(/<(path|circle)/g, '<$1 pathLength="1"');
    return '<svg class="sky" viewBox="0 0 200 48" aria-hidden="true" ' +
      'preserveAspectRatio="xMidYMax meet">' + body +
      '<path class="ln" pathLength="1" d="M0 43.6h200"/></svg>';
  }

  /* ---------- 7. Certificate viewer ---------- */
  var modal = document.getElementById("cert-modal");
  if (modal) {
    var dialog = modal.querySelector(".modal-dialog");
    var backdrop = modal.querySelector(".modal-backdrop");
    var body = modal.querySelector(".modal-body");
    var img = document.getElementById("cert-image");
    var closeBtn = modal.querySelector(".modal-close");
    var zoomBtn = document.getElementById("cert-zoom");
    var openLink = document.getElementById("cert-open");
    var factsEl = document.getElementById("cert-facts");
    var markEl = document.getElementById("cert-mark");
    var logoEl = document.getElementById("cert-logo");
    var logoBox = document.getElementById("cert-logo-box");
    var lastFocus = null, zoomed = false;

    function setText(id, v) { document.getElementById(id).textContent = v || ""; }

    // "Conferred:24 June 2024|Result:GPA 15.6 / 22" — the cards declare the
    // credential's details, so adding a certificate is markup, not code.
    function fillFacts(spec) {
      factsEl.innerHTML = "";
      (spec || "").split("|").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 0) return;
        var row = document.createElement("div");
        var dt = document.createElement("dt"), dd = document.createElement("dd");
        dt.textContent = pair.slice(0, i).trim();
        dd.textContent = pair.slice(i + 1).trim();
        row.appendChild(dt); row.appendChild(dd);
        factsEl.appendChild(row);
      });
    }

    // Cap the scan to the space the stage actually has. A percentage chain
    // cannot do this: the figure sizes to the scan's own 3000-odd pixels, so
    // max-height: 100% on the image resolves against nothing. The pieces
    // measured here — rail, bar, padding — do not depend on the image, so
    // there is no circularity.
    function fitPaper() {
      if (zoomed) { img.style.maxHeight = ""; return; }
      var cap = window.innerHeight * (window.innerWidth <= 620 ? 1 : 0.94);
      var stacked = getComputedStyle(dialog).gridTemplateColumns.trim().split(/\s+/).length < 2;
      var railH = stacked ? modal.querySelector(".cert-rail").offsetHeight : 0;
      var barH = modal.querySelector(".cert-bar").offsetHeight;
      var cs = getComputedStyle(body);
      var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      img.style.maxHeight = Math.max(140, cap - railH - barH - padY - 2) + "px";
    }
    window.addEventListener("resize", fitPaper);

    function setZoom(next) {
      zoomed = !!next;
      modal.classList.toggle("zoomed", zoomed);
      zoomBtn.setAttribute("aria-pressed", String(zoomed));
      fitPaper();
      // start the 1:1 view at the top of the page, horizontally centred
      body.scrollTop = 0;
      body.scrollLeft = Math.max(0, (body.scrollWidth - body.clientWidth) / 2);
    }

    function loaded() {
      modal.classList.remove("is-loading");
      img.classList.add("ready");
      fitPaper();
    }
    img.addEventListener("load", loaded);

    function openModal(el) {
      lastFocus = document.activeElement;
      var src = el.getAttribute("data-cert");
      var field = el.getAttribute("data-cert-title") || "Certificate";
      var kind = el.getAttribute("data-cert-kind") || "";
      var place = el.getAttribute("data-place") || "";

      setZoom(false);
      img.classList.remove("ready");
      modal.classList.add("is-loading");
      img.src = src;
      img.alt = kind ? kind + " — " + field : field;
      openLink.href = src;

      setText("cert-eyebrow", el.getAttribute("data-cert-eyebrow"));
      setText("cert-title", field);
      setText("cert-kind", kind);
      setText("cert-org", el.getAttribute("data-cert-org"));
      setText("cert-note", el.getAttribute("data-cert-note"));
      fillFacts(el.getAttribute("data-cert-facts"));

      var logo = el.getAttribute("data-cert-logo");
      logoEl.src = logo || "";
      logoEl.alt = el.getAttribute("data-cert-org") || "";
      logoBox.className = "cr-logo logo " + (el.getAttribute("data-cert-logo-class") || "logo-44");
      logoBox.style.display = logo ? "" : "none";

      // the whole view takes the colour, and the landmark, of where it happened
      dialog.setAttribute("data-place", place);
      markEl.innerHTML = skySvg(place);

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (animated) {
        M.animate(backdrop, { opacity: [0, 1] }, { duration: .24 });
        M.animate(dialog, { opacity: [0, 1], transform: ["scale(.965) translateY(14px)", "scale(1) translateY(0px)"] }, { easing: snappy });
      } else { backdrop.style.opacity = "1"; dialog.style.opacity = "1"; }
      closeBtn.focus();
      // a cached image can finish before the listener is wired up
      if (img.complete && img.naturalWidth) loaded();
    }

    function closeModal() {
      function done() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
      }
      if (animated) {
        M.animate(backdrop, { opacity: 0 }, { duration: .16 });
        M.animate(dialog, { opacity: 0, transform: "scale(.97) translateY(10px)" }, { duration: .16 }).finished.then(done);
      } else { done(); }
    }

    each(document.querySelectorAll("[data-cert]"), function (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        openModal(el);
      });
    });

    zoomBtn.addEventListener("click", function () { setZoom(!zoomed); });
    img.addEventListener("click", function () { setZoom(!zoomed); });
    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("open")) return;
      if (e.key === "Escape") { if (zoomed) setZoom(false); else closeModal(); }
      // keep tabbing inside the dialog while it is open
      if (e.key === "Tab") {
        var f = dialog.querySelectorAll("button, a[href]");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 9. Magnetic buttons ---------- */
  if (animated && window.matchMedia("(hover: hover)").matches) {
    each(document.querySelectorAll(".btn-primary, .icon-btn"), function (el) {
      var strength = el.classList.contains("icon-btn") ? 5 : 8;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        M.animate(el, { transform: "translate(" + dx * strength + "px," + dy * strength + "px)" },
                  { easing: snappy });
      });
      el.addEventListener("pointerleave", function () {
        M.animate(el, { transform: "translate(0px,0px)" }, { easing: soft });
      });
    });
  }

  /* ---------- 10. Stat counters ---------- */
  if (animated) {
    each(document.querySelectorAll(".stat-value"), function (el) {
      var text = el.textContent.trim();
      var m = text.match(/^(\d+)(.*)$/);      // only animate values that start with a number
      if (!m) return;
      var target = parseInt(m[1], 10), suffix = m[2], done = false;
      el.textContent = "0" + suffix;
      M.inView(el, function () {
        if (done) return;
        done = true;
        var t0 = performance.now(), dur = 900;
        (function tick(now) {
          var k = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    });
  }

  /* ---------- 11. Route bar ---------- */
  var route = document.querySelector(".atlas");
  if (route) {
    // Draw the connecting lines once the bar scrolls into view.
    if (animated) {
      var drawn = false;
      M.inView(route, function () {
        if (drawn) return;
        drawn = true;
        route.setAttribute("data-drawn", "");
      });
    } else {
      route.setAttribute("data-drawn", "");
    }

    // Hovering a role or degree zooms the map to that city.
    var zoom = route.querySelector(".atlas-zoom");
    var journey = document.querySelector(".journey");

    var PIN = { kolkata: [1069.7, 500.9], aberdeen: [252.2, 188.4],
                glasgow: [232.7, 200.0], london: [270.0, 239.4] };
    // [city, region] — the label sets the city large and the region small,
    // on the line that also carries the dates.
    var CITY = {
      kolkata:  ["Kolkata", "India"],
      aberdeen: ["Aberdeen", "Scotland"],
      glasgow:  ["Glasgow", "Scotland"],
      london:   ["London", "England"]
    };
    function metaOf(key, when) {
      return when ? CITY[key][1] + " \u00b7 " + when : CITY[key][1];
    }
    var K = 2.6, CX = 610, CY = 420;   // scale, and the fallback landing point
    var PIN_R = 7 * K;                 // the lit dot, r7 in the viewBox
    var TIP_GAP = 22;                  // clear air between that dot and the skyline

    var svg = route.querySelector(".atlas-svg");
    var VB_W = 1220, VB_H = 1202;

    // The label rides on the map rather than inside the card, so it can never
    // be clipped by one or sit on its text. Fixed, because the atlas is
    // viewport-pinned as well.
    var tip = document.createElement("div");
    tip.className = "atlas-tip";
    tip.setAttribute("aria-hidden", "true");
    // Skyline on top so it points back up at the pin, then the ground line it
    // stands on, then the name hanging off that line. No wrapper to style —
    // the three pieces are the label.
    tip.innerHTML =
      '<span class="pb-sky"></span>' +
      '<span class="pb-name"><i class="pb-dot"></i><b class="pb-city"></b></span>' +
      '<i class="pb-when"></i>';
    document.body.appendChild(tip);
    var tipCity = tip.querySelector(".pb-city");
    var tipWhen = tip.querySelector(".pb-when");
    var tipSky = tip.querySelector(".pb-sky");

    function lane() {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--map-lane");
      return parseFloat(v) || 0;
    }

    // Land the city in the clear lane beside the hovered card, level with it,
    // so the pin and its label sit to the card's right instead of behind it.
    function focusOn(key, el) {
      if (!zoom || !PIN[key]) return;
      var p = PIN[key];
      var w = lane(), r = svg && svg.getBoundingClientRect();

      // Fill the label before placing anything: how far the pin sits above it
      // depends on how tall it turns out, and that changes with the city name
      // wrapping or a missing date line.
      tip.setAttribute("data-place", key);
      if (tip.getAttribute("data-city") !== key) {
        tipSky.innerHTML = skySvg(key);
        tip.setAttribute("data-city", key);
      }
      tipCity.textContent = CITY[key][0];
      tipWhen.textContent = metaOf(key, datesOf(el));
      tip.classList.toggle("is-now", el.classList.contains("current"));

      var lx = CX, ly = CY, sx = 0, sy = 0, labelY = 0, placed = false;

      if (w > 0 && r && r.width && el) {
        // Anchor to whichever edge is further right — the list's or the card's.
        // Education is a two-column grid, so a left-column card's right edge is
        // its neighbour and the list wins; a role row, meanwhile, hangs ~22px
        // past its list, and anchoring to the list alone put the label on it.
        var box = el.closest(".exp, .grid") || el;
        sx = Math.max(box.getBoundingClientRect().right,
                      el.getBoundingClientRect().right) + w / 2;
        // Line the label up with the heading you are reading. Measuring the
        // title beats any offset from the card top, which drifts as soon as a
        // card is open or a heading wraps.
        var head = el.querySelector(".exp-title") || el.querySelector("h3") || el;
        var hr = head.getBoundingClientRect();
        labelY = hr.top + hr.height / 2;
        var th = tip.offsetHeight;
        sy = labelY - (th / 2 + PIN_R + TIP_GAP);   // the pin clears the label
        var k = r.width / VB_W;
        // Keep the marker inside the band where the map is actually opaque —
        // its mask fades the top and bottom out, and a pin dropped in there is
        // half invisible. Pin and label move together so they never separate.
        var top = r.top + r.height * 0.13;
        var bot = r.top + r.height * 0.70;
        var want = sy;
        sy = Math.min(Math.max(sy, top), bot);
        labelY += sy - want;
        labelY = Math.min(Math.max(labelY, th / 2 + 10), window.innerHeight - th / 2 - 10);
        lx = (sx - r.left) / k;
        ly = (sy - r.top) / k;
        placed = true;
      }
      zoom.style.transform =
        "translate(" + (lx - p[0] * K) + "px," + (ly - p[1] * K) + "px) scale(" + K + ")";

      if (!placed) { tip.classList.remove("on"); return; }
      // sits just under its pin, centred in the lane and kept on screen
      tip.classList.add("on");
      var tw = tip.offsetWidth / 2 + 8;
      tip.style.left = Math.min(Math.max(sx, tw), window.innerWidth - tw) + "px";
      tip.style.top = labelY + "px";
    }
    function resetZoom() {
      if (zoom) zoom.style.transform = "";
      tip.classList.remove("on");
      tip.removeAttribute("data-city");   // so the skyline rises again next time
    }

    // The label is fixed to the viewport but anchored to a card, so anything
    // that moves the card under a resting pointer — scrolling, or expanding
    // the row you are hovering — would otherwise leave it stranded. Track it
    // for as long as something is hovered, and stop the moment it is not.
    var activeEl = null, activeKey = null, raf = 0;
    function track() {
      raf = 0;
      if (!activeEl) return;
      focusOn(activeKey, activeEl);
      raf = requestAnimationFrame(track);
    }
    function startTrack(key, el) {
      activeKey = key; activeEl = el;
      if (!raf) raf = requestAnimationFrame(track);
    }
    function stopTrack() {
      activeEl = activeKey = null;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    // Each card's own dates, so a finished role never borrows the city's
    // current-ness: hovering Aspect reads "Mar 2026 — Sep 2026", not "now".
    function datesOf(el) {
      var src = el.querySelector(".exp-when") || el.querySelector(".when");
      if (!src) return "";
      var tmp = src.cloneNode(true);
      var kind = tmp.querySelector(".exp-kind");
      if (kind) kind.parentNode.removeChild(kind);
      return (tmp.innerHTML || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    each(document.querySelectorAll("[data-place]"), function (el) {
      var key = el.getAttribute("data-place");
      var stop = route.querySelector('.atlas-pin[data-stop="' + key + '"]');
      if (!stop || !CITY[key]) return;

      // The badge lives on the card, not over the map, so it always points
      // at the thing being hovered.
      var badge = document.createElement("span");
      badge.className = "place-badge" + (el.classList.contains("current") ? " is-now" : "");
      badge.setAttribute("aria-hidden", "true");
      // only on role rows — an education card shows its dates already
      var when = el.classList.contains("exp-item") ? datesOf(el) : "";
      badge.innerHTML =
        '<span class="pb-sky">' + skySvg(key) + '</span>' +
        '<span class="pb-name"><i class="pb-dot"></i><b class="pb-city"></b></span>' +
        '<i class="pb-when"></i>';
      badge.querySelector(".pb-city").textContent = CITY[key][0];
      badge.querySelector(".pb-when").textContent = metaOf(key, when);
      el.appendChild(badge);

      el.addEventListener("pointerenter", function () {
        stop.classList.add("lit");
        route.setAttribute("data-place", key);
        route.classList.add("has-lit");
        el.classList.add("located");
        if (journey) journey.classList.add("focus");
        focusOn(key, el);
        startTrack(key, el);
      });
      el.addEventListener("pointerleave", function () {
        stop.classList.remove("lit");
        route.removeAttribute("data-place");
        route.classList.remove("has-lit");
        el.classList.remove("located");
        if (journey) journey.classList.remove("focus");
        stopTrack();
        resetZoom();
      });
    });
  }

  /* ---------- 8. Year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
