/* ============================================================
   "Ask about Kaushik" widget.

   Thin on purpose: every guardrail lives in the Worker, because
   anything enforced here is enforced by a machine the visitor
   owns. This file handles UI and nothing security-relevant.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- config ---------- */
  var ENDPOINT = "https://kaushik-site-chat.<your-subdomain>.workers.dev/chat";

  var MAX_CHARS = 320;          // mirrors the Worker, for the counter only
  var HISTORY_TURNS = 6;

  var GREETING =
    "I answer from what's written on this page — his roles, projects, research and how to reach him.";

  var CHIPS = [
    "What does he do now?",
    "Show me his best project",
    "What's his background?",
    "Is he open to work?"
  ];

  var CONFIGURED = ENDPOINT.indexOf("<your-subdomain>") === -1;

  // Demo mode: on localhost the widget still renders, answering straight from
  // data/kb.json with no model behind it. That way the UI can be seen and
  // styled before the Worker exists. On a real domain an unconfigured widget
  // stays hidden rather than showing visitors a chat box that cannot answer.
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  var DEMO = !CONFIGURED && LOCAL;

  if (!CONFIGURED && !DEMO) {
    console.warn("[chat] ENDPOINT is not configured — widget hidden. Set it in assets/js/chat.js.");
    return;
  }
  if (DEMO) {
    console.warn("[chat] demo mode: answering from data/kb.json, no model. Set ENDPOINT for real answers.");
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(markup) {
    var wrap = document.createElement("span");
    wrap.innerHTML = markup;
    return wrap.firstElementChild;
  }
  var ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h13M12.5 6.5l5.5 5.5-5.5 5.5"/></svg>'
  };

  /* ---------- build ---------- */
  /* The bot's own mark: a page with two lines of text and a spark over them —
     an answer being drawn out of a page, which is exactly what this thing
     does. It is an assistant reading Kaushik's site, not Kaushik, so it does
     not wear his face.

     Drawn, not filled. A gradient-filled rounded square is the house style of
     every AI widget on the web and of nothing on this page; line art in one
     accent colour is the language the atlas, the skylines and the card rules
     already speak, so the mark reads as part of the site. currentColor means
     it takes the theme with no second asset. */
  function mark(cls, size) {
    return svg(
      '<svg class="' + (cls || "") + '" viewBox="0 0 32 32" width="' + size + '" height="' + size + '" ' +
        'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<rect x="4" y="5" width="24" height="22" rx="6.5"/>' +
        '<path d="M9.6 20h9M9.6 23.8h5.4"/>' +
        '<path fill="currentColor" stroke="none" d="M20.4 7.8c.52 2.91 1.29 3.68 4.2 4.2' +
          '-2.91.52-3.68 1.29-4.2 4.2-.52-2.91-1.29-3.68-4.2-4.2 2.91-.52 3.68-1.29 4.2-4.2z"/>' +
      '</svg>'
    );
  }

  var fab = el("button", "chat-fab");
  fab.type = "button";
  fab.setAttribute("aria-label", "Ask a question about Kaushik");
  var fabWrap = el("span", "chat-fab-wrap");
  fabWrap.appendChild(mark("chat-mark", 26));
  fab.appendChild(fabWrap);
  fab.appendChild(el("span", null, "Ask about Kaushik"));

  var panel = el("div", "chat-panel");
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-label", "Ask about Kaushik");

  var head = el("div", "chat-head");
  head.appendChild(mark("chat-mark", 26));
  var headText = el("div");
  headText.appendChild(el("h2", null, "Kaushik's assistant"));
  headText.appendChild(
    el("div", "sub", DEMO ? "Demo mode · no model" : "Answers only from this site"));
  head.appendChild(headText);
  head.appendChild(el("div", "spacer"));
  var closeBtn = el("button", "chat-close");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close chat");
  closeBtn.appendChild(svg(ICON.close));
  head.appendChild(closeBtn);

  var log = el("div", "chat-log");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");

  var chips = el("div", "chat-chips");
  CHIPS.forEach(function (c) {
    var b = el("button", "chat-chip", c);
    b.type = "button";
    b.addEventListener("click", function () { input.value = c; submit(); });
    chips.appendChild(b);
  });

  var form = el("form", "chat-form");
  var input = el("textarea", "chat-input");
  input.rows = 1;
  input.placeholder = "Ask about his work…";
  input.maxLength = MAX_CHARS;
  input.setAttribute("aria-label", "Your question");
  var send = el("button", "chat-send");
  send.type = "submit";
  send.setAttribute("aria-label", "Send");
  send.appendChild(svg(ICON.send));
  form.appendChild(input);
  form.appendChild(send);

  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(form);

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  /* ---------- messages ---------- */
  var history = [];
  var busy = false;
  var greeted = false;

  function scroll() { log.scrollTop = log.scrollHeight; }

  function addMsg(role, text, isError) {
    var m = el("div", "chat-msg " + (role === "user" ? "from-user" : "from-bot") + (isError ? " is-error" : ""), text);
    log.appendChild(m);
    scroll();
    return m;
  }

  function addSources(sources) {
    if (!sources || !sources.length) return;
    // De-duplicate: four retrieved chunks often share one section.
    var seen = {}, links = [];
    sources.forEach(function (s) {
      if (seen[s.section]) return;
      seen[s.section] = 1;
      links.push(s.section);
    });
    var row = el("div", "chat-src");
    row.appendChild(el("span", "line"));
    links.slice(0, 3).forEach(function (sec, i) {
      if (i) row.appendChild(document.createTextNode(" · "));
      var a = el("a", null, sec);
      a.href = "#" + sec;
      row.appendChild(a);
    });
    log.appendChild(row);
    scroll();
  }

  function addTyping() {
    var m = el("div", "chat-msg from-bot");
    var t = el("span", "chat-typing");
    t.appendChild(el("i")); t.appendChild(el("i")); t.appendChild(el("i"));
    m.appendChild(t);
    log.appendChild(m);
    scroll();
    return m;
  }

  /* ---------- demo mode answering ----------
     A deliberately crude scorer. The Worker's BM25 gate is the real thing;
     this exists only so the widget is usable before the Worker is deployed. */
  var demoKB = null;

  function loadDemoKB() {
    if (demoKB) return Promise.resolve(demoKB);
    return fetch("data/kb.json")
      .then(function (r) { return r.json(); })
      .then(function (kb) { demoKB = kb; return kb; });
  }

  var DEMO_STOP = /^(a|an|and|are|about|at|be|but|by|can|did|do|does|for|from|has|have|he|her|him|his|how|in|is|it|its|me|my|of|on|or|tell|that|the|to|was|were|what|when|where|which|who|why|with|you|your)$/;

  function demoAnswer(q) {
    return loadDemoKB().then(function (kb) {
      var terms = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
        .filter(function (t) { return t.length > 2 && !DEMO_STOP.test(t); });

      var best = null, bestScore = 0;
      kb.chunks.forEach(function (c) {
        var title = c.title.toLowerCase();
        var tags = (c.tags || []).join(" ").toLowerCase();
        var text = c.text.toLowerCase();
        var score = 0;
        terms.forEach(function (t) {
          // Title first: "chumley" names the project chunk, and also appears in
          // passing inside the job chunk. Weighting titles breaks that tie the
          // way the Worker's BM25 does.
          if (title.indexOf(t) !== -1) score += 3;
          else if (tags.indexOf(t) !== -1) score += 2;
          else if (text.indexOf(t) !== -1) score += 1;
        });
        if (score > bestScore) { bestScore = score; best = c; }
      });

      if (!best || bestScore < 2) {
        var d = kb.deflections;
        return { answer: d[Math.abs(hashish(q)) % d.length], grounded: false };
      }
      return { answer: best.text, grounded: true, sources: [{ section: best.section, title: best.title }] };
    });
  }

  function hashish(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h;
  }

  /* ---------- send ---------- */
  function submit() {
    var q = input.value.trim();
    if (!q || busy) return;

    chips.hidden = true;
    panel.classList.remove("is-empty");
    addMsg("user", q);
    input.value = "";
    input.style.height = "auto";
    busy = true;
    send.disabled = true;

    var typing = addTyping();
    var payload = { question: q, history: history.slice(-HISTORY_TURNS) };

    var request = DEMO
      ? demoAnswer(q)
      : fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); });

    request
      .then(function (data) {
        typing.remove();
        var answer = (data && data.answer) || "I didn't catch that — try rephrasing?";
        addMsg("assistant", answer, !data || !data.answer);
        if (data && data.grounded) addSources(data.sources);

        // Only grounded exchanges become context. Feeding deflections back in
        // teaches the model that dodging is the house style.
        if (data && data.grounded) {
          history.push({ role: "user", content: q });
          history.push({ role: "assistant", content: answer });
          history = history.slice(-HISTORY_TURNS);
        }
      })
      .catch(function () {
        typing.remove();
        addMsg("assistant", "I couldn't reach the server. Kaushik's email is in the Contact section if it's urgent.", true);
      })
      .then(function () {
        busy = false;
        send.disabled = false;
        input.focus();
      });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });

  // Enter sends, Shift+Enter makes a newline — the convention people expect.
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  });

  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 108) + "px";
  });

  /* ---------- open / close ---------- */
  function addIntro() {
    var box = el("div", "chat-intro");
    var wrap = el("span", "chat-id-av-wrap");
    wrap.appendChild(mark("chat-mark chat-mark-lg", 46));
    box.appendChild(wrap);
    box.appendChild(el("h3", null, "Ask about Kaushik"));
    box.appendChild(el("p", null, GREETING));
    // The chips go inside the greeting, not on the panel floor: they are only
    // ever shown before the first question, and split across the panel they
    // left a void in the middle that read as a rendering fault.
    box.appendChild(chips);
    log.appendChild(box);
    // Nothing to scroll yet, so the log centres its one block instead of
    // pinning it to the top and leaving a hole above the chips.
    panel.classList.add("is-empty");
  }

  function open() {
    panel.hidden = false;
    fab.hidden = true;
    requestAnimationFrame(function () { panel.classList.add("is-open"); });
    if (!greeted) { addIntro(); greeted = true; }
    setTimeout(function () { input.focus(); }, 120);
  }

  function close() {
    panel.classList.remove("is-open");
    var done = function () { panel.hidden = true; fab.hidden = false; fab.focus(); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
    else setTimeout(done, 200);
  }

  fab.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) close();
  });
})();
