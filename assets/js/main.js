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

  /* ---------- 7. Certificate modal ---------- */
  var modal = document.getElementById("cert-modal");
  if (modal) {
    var dialog = modal.querySelector(".modal-dialog");
    var backdrop = modal.querySelector(".modal-backdrop");
    var body = modal.querySelector(".modal-body");
    var img = document.getElementById("cert-image");
    var title = document.getElementById("cert-title");
    var openLink = document.getElementById("cert-open");
    var zoomBtn = document.getElementById("cert-zoom");
    var closeBtn = modal.querySelector(".modal-close");
    var lastFocus = null, zoomed = false, nw = 0, nh = 0;
    var PAD = 14;   // .modal-body padding, both sides

    // Shrink the frame to the picture. Left to itself the dialog would size to
    // the image's intrinsic width (~2150px) and then clamp, leaving the fitted
    // image floating in a wide empty box.
    function fit() {
      if (!nw || !nh) return;
      if (zoomed) { dialog.style.width = ""; return; }
      var header = modal.querySelector(".modal-header").offsetHeight;
      var availH = window.innerHeight * 0.94 - header - PAD * 2 - 2;
      var availW = window.innerWidth - 32 - PAD * 2 - 2;
      var s = Math.min(availW / nw, availH / nh, 1);
      dialog.style.width = Math.round(nw * s + PAD * 2 + 2) + "px";
    }

    function setZoom(next) {
      zoomed = !!next;
      modal.classList.toggle("zoomed", zoomed);
      zoomBtn.setAttribute("aria-pressed", String(zoomed));
      fit();
      // start the 1:1 view at the top, horizontally centred
      body.scrollTop = 0;
      body.scrollLeft = Math.max(0, (body.scrollWidth - body.clientWidth) / 2);
    }

    img.addEventListener("load", function () {
      nw = img.naturalWidth; nh = img.naturalHeight;
      modal.classList.remove("is-loading");
      img.classList.add("ready");
      fit();
    });
    window.addEventListener("resize", fit);

    function openModal(src, label) {
      lastFocus = document.activeElement;
      zoomed = false;
      modal.classList.remove("zoomed");
      zoomBtn.setAttribute("aria-pressed", "false");
      img.classList.remove("ready");
      modal.classList.add("is-loading");
      dialog.style.width = "";
      nw = nh = 0;
      img.src = src; img.alt = label;
      title.textContent = label;
      openLink.href = src;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (animated) {
        M.animate(backdrop, { opacity: [0, 1] }, { duration: .2 });
        M.animate(dialog, { opacity: [0, 1], transform: ["scale(.97) translateY(8px)", "scale(1) translateY(0px)"] }, { easing: snappy });
      } else { backdrop.style.opacity = "1"; dialog.style.opacity = "1"; }
      closeBtn.focus();
      // a cached image can finish before the listener is wired up
      if (img.complete && img.naturalWidth) {
        nw = img.naturalWidth; nh = img.naturalHeight;
        modal.classList.remove("is-loading");
        img.classList.add("ready");
        fit();
      }
    }

    function closeModal() {
      function done() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
      }
      if (animated) {
        M.animate(backdrop, { opacity: 0 }, { duration: .15 });
        M.animate(dialog, { opacity: 0, transform: "scale(.97) translateY(8px)" }, { duration: .15 }).finished.then(done);
      } else { done(); }
    }

    each(document.querySelectorAll("[data-cert]"), function (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        openModal(el.getAttribute("data-cert"), el.getAttribute("data-cert-title") || "Certificate");
      });
    });

    zoomBtn.addEventListener("click", function () { setZoom(!zoomed); });
    img.addEventListener("click", function () { setZoom(!zoomed); });
    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("open")) return;
      if (e.key === "Escape") closeModal();
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
    var CITY = {
      kolkata:  "Kolkata, India",
      aberdeen: "Aberdeen, Scotland",
      glasgow:  "Glasgow, Scotland",
      london:   "London, England"
    };
    var K = 2.6, CX = 610, CY = 420;   // scale, and the fallback landing point
    var TIP_GAP = 32;                  // pin-to-label spacing

    var svg = route.querySelector(".atlas-svg");
    var VB_W = 1220, VB_H = 1202;

    // The label rides on the map rather than inside the card, so it can never
    // be clipped by one or sit on its text. Fixed, because the atlas is
    // viewport-pinned as well.
    var tip = document.createElement("div");
    tip.className = "atlas-tip";
    tip.setAttribute("aria-hidden", "true");
    tip.innerHTML = '<span class="pb-dot"></span><span class="pb-text">' +
      '<b class="pb-city"></b><i class="pb-when"></i></span>';
    document.body.appendChild(tip);
    var tipCity = tip.querySelector(".pb-city");
    var tipWhen = tip.querySelector(".pb-when");

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
      var lx = CX, ly = CY, sx = 0, sy = 0, labelY = 0, placed = false;

      if (w > 0 && r && r.width && el) {
        // Anchor to the right edge of the whole list, not the card: Education
        // is a two-column grid, so a card's right edge is its neighbour.
        var box = el.closest(".exp, .grid") || el;
        sx = box.getBoundingClientRect().right + w / 2;
        // Line the label up with the heading you are reading. Measuring the
        // title beats any offset from the card top, which drifts as soon as a
        // card is open or a heading wraps.
        var head = el.querySelector(".exp-title") || el.querySelector("h3") || el;
        var hr = head.getBoundingClientRect();
        labelY = hr.top + hr.height / 2;
        sy = labelY - TIP_GAP;   // the pin sits just above its label
        var k = r.width / VB_W;
        // The pin has to stay inside the map's box, which clips its content.
        // The label does not — it is fixed to the viewport — so it is clamped
        // separately and keeps its place beside the heading even where the
        // map starts too low for the pin to follow.
        sy = Math.min(Math.max(sy, r.top + 40), r.top + r.height - 40);
        labelY = Math.min(Math.max(labelY, 46), window.innerHeight - 30);
        lx = (sx - r.left) / k;
        ly = (sy - r.top) / k;
        placed = true;
      }
      zoom.style.transform =
        "translate(" + (lx - p[0] * K) + "px," + (ly - p[1] * K) + "px) scale(" + K + ")";

      if (!placed) { tip.classList.remove("on"); return; }
      tip.setAttribute("data-place", key);
      tipCity.textContent = CITY[key];
      var when = datesOf(el);
      tipWhen.textContent = when;
      tip.classList.toggle("is-now", el.classList.contains("current"));
      // sits just under its pin, centred in the lane and kept on screen
      tip.style.left = "0px"; tip.style.top = "0px";
      tip.classList.add("on");
      var tw = tip.offsetWidth / 2 + 8;
      tip.style.left = Math.min(Math.max(sx, tw), window.innerWidth - tw) + "px";
      tip.style.top = labelY + "px";
    }
    function resetZoom() {
      if (zoom) zoom.style.transform = "";
      tip.classList.remove("on");
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
      badge.innerHTML = '<span class="pb-dot"></span><span class="pb-text">' +
        '<b class="pb-city"></b>' + (when ? '<i class="pb-when"></i>' : '') + '</span>';
      badge.querySelector(".pb-city").textContent = CITY[key];
      if (when) badge.querySelector(".pb-when").textContent = when;
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
