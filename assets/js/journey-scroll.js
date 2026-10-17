/* Maps natural page scrolling to the actual roles and degrees. No scroll
   interception, extra copy, or dependency on WebGL. */
(function () {
  "use strict";
  var journey = document.querySelector(".journey");
  var stops = Array.prototype.slice.call(document.querySelectorAll(".exp-item[data-place], .card[data-place]"));
  if (!journey || !stops.length) return;
  var pending = 0;
  var previousY = window.scrollY;
  var direction = 1;
  var state = null;
  var reading = null;
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function smooth(value) { return value * value * (3 - 2 * value); }
  function update() {
    pending = 0;
    var y = window.scrollY;
    var moving = Math.abs(y - previousY) > 0.5;
    if (moving) direction = y > previousY ? 1 : -1;
    previousY = y;
    var height = document.documentElement.clientHeight;
    var rect = journey.getBoundingClientRect();
    var visible = Math.min(rect.bottom, height) - Math.max(rect.top, 0);
    var inside = visible > 0;
    var presence = smooth(clamp(visible / Math.min(300, height * 0.45)));
    var boxes = stops.map(function (el) { return el.getBoundingClientRect(); });
    var anchors = boxes.map(function (box) { return y + box.top + Math.min(box.height * 0.3, 100); });
    // Side-by-side degrees share a row. Give each a portion of that row's
    // reading distance so neither disappears from the scrolling sequence.
    for (var i = 0; i < boxes.length;) {
      var end = i + 1;
      while (end < boxes.length && Math.abs(boxes[end].top - boxes[i].top) < 8) end++;
      if (end - i > 1) {
        var rowHeight = Math.max.apply(null, boxes.slice(i, end).map(function (b) { return b.height; }));
        for (var j = i; j < end; j++) anchors[j] = y + boxes[i].top + rowHeight * (0.2 + 0.6 * (j - i) / (end - i - 1));
      }
      i = end;
    }
    var line = y + height * 0.48;
    var fromIndex = 0;
    while (fromIndex < anchors.length - 1 && line >= anchors[fromIndex + 1]) fromIndex++;
    var toIndex = Math.min(fromIndex + 1, anchors.length - 1);
    var progress = fromIndex === toIndex ? 0 : clamp((line - anchors[fromIndex]) / Math.max(1, anchors[toIndex] - anchors[fromIndex]));
    if (line < anchors[0]) toIndex = fromIndex = 0;
    var activeIndex = progress < 0.5 ? fromIndex : toIndex;
    var arrival = fromIndex === toIndex ? 1 : progress < 0.5 ? 1 - smooth(progress * 2) : smooth((progress - 0.5) * 2);
    state = {
      inside: inside, presence: presence, from: stops[fromIndex], to: stops[toIndex],
      active: stops[activeIndex], progress: progress, arrival: arrival,
      direction: direction, moving: moving,
      overall: clamp((line - anchors[0]) / Math.max(1, anchors[anchors.length - 1] - anchors[0]))
    };
    if (reading !== (inside ? state.active : null)) {
      if (reading) reading.classList.remove("is-reading");
      reading = inside ? state.active : null;
      if (reading) reading.classList.add("is-reading");
    }
    journey.style.setProperty("--journey-progress", state.overall);
    journey.style.setProperty("--journey-presence", presence);
    document.dispatchEvent(new CustomEvent("journey:scroll", { detail: state }));
  }
  function queue() { if (!pending) pending = requestAnimationFrame(update); }
  window.JourneyScroll = { getState: function () { return state; }, refresh: queue };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  if ("ResizeObserver" in window) new ResizeObserver(queue).observe(journey);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  queue();
})();
