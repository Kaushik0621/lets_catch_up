/* The background globe follows the roles and degrees as the reader scrolls.
   Hovering or opening a role provides a temporary close view. Three.js is
   optional: the original SVG atlas and all city portraits remain available
   when WebGL or its CDN cannot load. */
(function () {
  "use strict";

  var atlas = document.querySelector(".atlas");
  var mount = document.getElementById("journey3d-canvas");
  var placeEls = Array.prototype.slice.call(
    document.querySelectorAll(".exp-item[data-place], .card[data-place]")
  );
  if (!atlas || !mount || !placeEls.length) return;

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }
  if (!hasWebGL()) return; // the 2D map underneath is already showing; nothing to undo

  import("three")
    .then(function (THREE) {
      try {
        init(THREE);
        atlas.classList.add("atlas3d-active"); // only now does the 2D map hide
        if (window.JourneyScroll) window.JourneyScroll.refresh();
      } catch (e) {
        console.warn("[journey3d] staying on the 2D map:", e);
      }
    })
    .catch(function (e) {
      console.warn("[journey3d] three.js failed to load, staying on the 2D map:", e);
    });

  function init(THREE) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var CITIES = [
      { key: "kolkata", lat: 22.57, lon: 88.36 },
      { key: "aberdeen", lat: 57.15, lon: -2.09 },
      { key: "glasgow", lat: 55.86, lon: -4.25 },
      { key: "london", lat: 51.51, lon: -0.13 },
    ];

    var root = document.documentElement;
    var cs = getComputedStyle(root);
    function cssColor(name, fallback) {
      var v = cs.getPropertyValue(name).trim();
      return v || fallback;
    }
    function cityColor(key) {
      return cssColor("--c-" + key, "#8b8cf9");
    }
    function accentColor() {
      return cssColor("--accent", "#8b8cf9");
    }
    function landmarkColor() {
      return cssColor("--landmark", "#c59b3a");
    }
    function coastlineColor() {
      return new THREE.Color(cssColor("--text-3", "#8a8a8a"))
        .lerp(new THREE.Color(accentColor()), 0.18);
    }

    var RADIUS = 1;
    function lonTheta(lon) {
      return (lon + 180) * (Math.PI / 180);
    }
    function toVec3(lat, lon, r) {
      var phi = (90 - lat) * (Math.PI / 180);
      var theta = lonTheta(lon);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    // The rotation (around the vertical axis) that brings a point at a
    // given longitude angle to face the camera. Derived by hand: for a
    // group rotated by g, a point's camera-facing (+Z) coordinate is
    // proportional to sin(g + theta), maximised at g = PI/2 - theta.
    function facingRotation(theta) {
      return Math.PI / 2 - theta;
    }
    // ---------- renderer ----------
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    mount.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 3.6);

    var group = new THREE.Group();
    scene.add(group);

    // An invisible solid core — opaque, so it renders in the normal
    // pass and writes depth; colourWrite off, so it never actually
    // paints. It exists purely so the far side of the globe (wireframe,
    // coastlines, route arcs) sits hidden behind the near side, the way
    // a real sphere would occlude itself.
    var core = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 0.985, 32, 20),
      new THREE.MeshBasicMaterial({ colorWrite: false })
    );
    group.add(core);

    // ---------- real coastlines ----------
    // world-atlas's pre-merged "land" object (one MultiPolygon, no
    // internal country borders) from the same CDN Three.js is already
    // loading from. TopoJSON decoded by hand below rather than pulling
    // in topojson-client as a second dependency: arcs are delta-encoded
    // point sequences, and a polygon ring is a sequence of arc indices,
    // negative meaning "use that arc reversed". Each ring is
    // decoded independently (no arc-sharing/stitching) and drawn as its
    // own closed loop, which draws a shared coastline twice in places
    // rather than once — invisible at this line weight, and not worth
    // the extra complexity of proper arc deduplication for a background
    // visual rather than a precise map.
    var journey3dLand = null; // filled in once (if) the fetch below resolves
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json")
      .then(function (r) {
        if (!r.ok) throw new Error("world-atlas fetch failed: " + r.status);
        return r.json();
      })
      .then(function (topology) {
        var landColor = coastlineColor();
        var landMat = new THREE.LineBasicMaterial({
          color: landColor,
          transparent: true,
          opacity: 0.36,
        });
        var tr = topology.transform;
        function decodeArc(raw) {
          var x = 0,
            y = 0;
          return raw.map(function (d) {
            x += d[0];
            y += d[1];
            return tr ? [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]] : [x, y];
          });
        }
        var arcsLL = topology.arcs.map(decodeArc);
        function ringPoints(ring) {
          var pts = [];
          ring.forEach(function (idx) {
            var rev = idx < 0;
            var a = arcsLL[rev ? ~idx : idx];
            if (rev) a = a.slice().reverse();
            pts = pts.concat(a);
          });
          return pts;
        }
        var land = topology.objects.land;
        if (!land || !land.geometries) return;
        var landGroup = new THREE.Group();
        land.geometries.forEach(function (geom) {
          var polygons = geom.type === "Polygon" ? [geom.arcs] : geom.type === "MultiPolygon" ? geom.arcs : [];
          polygons.forEach(function (rings) {
            rings.forEach(function (ring) {
              var pts = ringPoints(ring);
              if (pts.length < 3) return;
              var vecs = pts.map(function (ll) {
                return toVec3(ll[1], ll[0], RADIUS * 1.002);
              });
              vecs.push(vecs[0]); // closes the loop
              var geo = new THREE.BufferGeometry().setFromPoints(vecs);
              landGroup.add(new THREE.Line(geo, landMat));
            });
          });
        });
        group.add(landGroup);
        journey3dLand = { group: landGroup, mat: landMat };
        if (reduced) renderer.render(scene, camera);
      })
      .catch(function (e) {
        console.warn("[journey3d] continents didn't load, globe stays wireframe-only:", e);
      });

    // ---------- cities ----------
    var cityPositions = CITIES.map(function (c) {
      return toVec3(c.lat, c.lon, RADIUS * 1.004);
    });
    var markers = [];
    CITIES.forEach(function (c, idx) {
      var color = new THREE.Color(cityColor(c.key));
      var marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 12),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 })
      );
      marker.position.copy(cityPositions[idx]);
      // A surface-aligned locator ring keeps the geographic point precise.
      var halo = new THREE.Mesh(
        new THREE.RingGeometry(0.025, 0.032, 40),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
      );
      halo.position.copy(cityPositions[idx]).multiplyScalar(1.002);
      halo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cityPositions[idx].clone().normalize());
      group.add(marker, halo);
      markers.push({ key: c.key, marker: marker, halo: halo, phase: idx * 1.3, curScale: 1 });
    });

    // A thin acquisition ring, independent of the small location dot.
    var acquisition = new THREE.Mesh(
      new THREE.RingGeometry(0.043, 0.046, 64),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor()), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    group.add(acquisition);

    // ---------- route arcs, raised above the surface like a flight path ----------
    var arcs = [];
    for (var a = 0; a < cityPositions.length - 1; a++) {
      var start = cityPositions[a];
      var end = cityPositions[a + 1];
      var mid = start.clone().add(end).multiplyScalar(0.5);
      var lift = 1 + start.distanceTo(end) * 0.55;
      mid.normalize().multiplyScalar(RADIUS * lift);
      var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      var mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(cityColor(CITIES[a + 1].key)),
        transparent: true,
        opacity: 0,
      });
      var line = new THREE.Line(geo, mat);
      group.add(line);
      arcs.push({ line: line, delay: a * 420 });
    }

    var flightLayer = new THREE.Group();
    flightLayer.visible = false;
    group.add(flightLayer);
    var flightLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({
      color: new THREE.Color(accentColor()), transparent: true, opacity: 0.55, depthWrite: false
    }));
    var traveler = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColor()), transparent: true, opacity: 0.95
    }));
    flightLayer.add(flightLine, traveler);
    var flightPair = "";

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // ---------- starfield ----------
    // The canvas is a rectangle; the globe is a circle inside it, and
    // however it's framed there's always empty corner space left over.
    // Scattered far points fill that rather than leaving it flat —
    // the same dotted visual language the skylines and the (now
    // removed) wireframe grid used, just reused for depth instead of
    // shape. Added to the scene directly, not the group, so it holds
    // still while the globe itself turns and shifts — a sky, not part
    // of the planet.
    var STAR_COUNT = 240;
    var starPositions = new Float32Array(STAR_COUNT * 3);
    for (var s = 0; s < STAR_COUNT; s++) {
      var su = Math.random(),
        sv = Math.random();
      var sTheta = su * Math.PI * 2;
      var sPhi = Math.acos(2 * sv - 1);
      var sr = 5.5 + Math.random() * 9;
      starPositions[s * 3] = sr * Math.sin(sPhi) * Math.cos(sTheta);
      starPositions[s * 3 + 1] = sr * Math.cos(sPhi);
      starPositions[s * 3 + 2] = sr * Math.sin(sPhi) * Math.sin(sTheta);
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    var starMat = new THREE.PointsMaterial({
      color: new THREE.Color(cssColor("--text-3", "#8a8a8a")),
      size: 0.035,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    var stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---------- sizing ----------
    function size() {
      var w = mount.clientWidth,
        h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (reduced) renderer.render(scene, camera);
    }
    size();
    window.addEventListener("resize", size);
    new ResizeObserver(size).observe(mount);

    // ---------- which city the globe should be facing ----------
    // Two inputs, hover always winning: a direct hover on a real role
    // or degree (journey:focus/blur, dispatched from main.js's existing
    // focusOn()/resetZoom()) overrides whatever scrolling alone would
    // pick. Losing hover falls back to the scroll-driven key rather
    // than resetting to the first city.
    var activeKey = null;
    var hoverKey = null;
    var scrollKey = CITIES[0].key;
    var activeSource = null;
    var hoverSource = null;
    var scrollSource = null;
    var activeMode = false;
    var landmarkActive = false;
    var focusStarted = -Infinity;
    var orbitDirection = 1;
    // Keep the globe in the clear margin beside the content.
    var SHIFT_X = 0;
    var targetPosX = SHIFT_X;
    group.position.x = SHIFT_X;
    var targetOrientation = new THREE.Quaternion();
    var targetZoom = 1;
    var targetDistance = 3.6;
    var scrollState = null;
    var northAxis = new THREE.Vector3(0, 1, 0);
    var frontAxis = new THREE.Vector3(0, 0, 1);
    var stopProfiles = placeEls.map(function (el, index) {
      var key = el.getAttribute("data-place");
      var city = CITIES.find(function (c) { return c.key === key; });
      var lat = el.hasAttribute("data-lat") ? Number(el.getAttribute("data-lat")) : city.lat;
      var lon = el.hasAttribute("data-lon") ? Number(el.getAttribute("data-lon")) : city.lon;
      if (!Number.isFinite(lat) || Math.abs(lat) > 90) lat = city.lat;
      if (!Number.isFinite(lon) || Math.abs(lon) > 180) lon = city.lon;
      var orientation = new THREE.Quaternion().setFromEuler(new THREE.Euler(lat * Math.PI / 180, facingRotation(lonTheta(lon)), 0, "XYZ"));
      orientation.premultiply(new THREE.Quaternion().setFromAxisAngle(frontAxis, (index % 2 ? -1 : 1) * 0.035));
      return { el: el, key: key, index: index, normal: toVec3(lat, lon, 1), orientation: orientation };
    });
    function smooth(value) { return value * value * (3 - 2 * value); }
    function flightPoint(from, to, progress) {
      var wave = Math.sin(Math.PI * progress);
      var point = from.normal.clone().lerp(to.normal, progress).normalize();
      var distance = from.normal.angleTo(to.normal);
      if (distance < 0.04) {
        var east = northAxis.clone().cross(from.normal).normalize();
        var north = from.normal.clone().cross(east).normalize();
        point.addScaledVector(east, wave * 0.055).addScaledVector(north, Math.sin(progress * Math.PI * 2) * 0.025).normalize();
      }
      return point.multiplyScalar(1.008 + wave * (distance < 0.04 ? 0.035 : 0.16));
    }
    function setScrollTargets(state) {
      if (!state || !state.inside) {
        flightLayer.visible = false;
        return;
      }
      var from = stopProfiles.find(function (p) { return p.el === state.from; });
      var to = stopProfiles.find(function (p) { return p.el === state.to; });
      if (!from || !to) return;
      var progress = smooth(state.progress);
      var distance = from.normal.angleTo(to.normal);
      var wave = Math.sin(Math.PI * state.progress);
      targetOrientation.copy(from.orientation).slerp(to.orientation, progress);
      var roll = wave * (distance < 0.04 ? 0.11 : 0.045) * (from.index % 2 ? -1 : 1);
      targetOrientation.premultiply(new THREE.Quaternion().setFromAxisAngle(frontAxis, roll));
      targetZoom = 1.08 + (distance < 0.04 ? wave * 0.08 : -wave * 0.08);
      targetDistance = 3.6 + wave * Math.min(0.5, distance * 0.3);
      var pair = from.index + ":" + to.index;
      if (flightPair !== pair) {
        flightPair = pair;
        var points = [];
        for (var n = 0; n <= 96; n++) points.push(flightPoint(from, to, n / 96));
        flightLine.geometry.dispose();
        flightLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
      }
      flightLine.geometry.setDrawRange(0, Math.max(2, Math.floor(progress * 96) + 1));
      flightLayer.visible = from !== to && state.progress > 0.001 && state.progress < 0.999;
      traveler.position.copy(flightPoint(from, to, progress));
      var color = landmarkActive ? landmarkColor() : cityColor(activeKey);
      flightLine.material.color.set(color);
      traveler.material.color.set(color);
      mount.style.setProperty("--flight-progress", state.progress);
    }

    function applyKey(key, source) {
      if (!key) return;
      var city = CITIES.find(function (c) { return c.key === key; });
      if (!city) return;
      var changed = activeKey !== key || activeSource !== source || activeMode !== !!hoverKey;
      activeKey = key;
      activeSource = source || null;
      activeMode = !!hoverKey;
      landmarkActive = !!(source && source.getAttribute("data-landmark") === "tower-bridge");
      var index = Math.max(0, placeEls.indexOf(source));
      var lat = city.lat, lon = city.lon;
      if (source && source.hasAttribute("data-lat") && source.hasAttribute("data-lon")) {
        var roleLat = Number(source.getAttribute("data-lat"));
        var roleLon = Number(source.getAttribute("data-lon"));
        if (Number.isFinite(roleLat) && Number.isFinite(roleLon) && Math.abs(roleLat) <= 90 && Math.abs(roleLon) <= 180) {
          lat = roleLat;
          lon = roleLon;
        }
      }
      // First put the city at +Z with local north pointing up. Then
      // align its surface normal with the actual camera-to-globe ray:
      // the globe is offset, so facing +Z alone is not directly overhead.
      var overhead = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(lat * Math.PI / 180, facingRotation(lonTheta(lon)), 0, "XYZ")
      );
      var viewDirection = camera.position.clone().sub(group.position).normalize();
      var cameraAlignment = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), viewDirection
      );
      targetOrientation.copy(cameraAlignment).multiply(overhead);
      // Roll around the viewing ray keeps the city directly underneath
      // the camera, while giving neighbouring chapters distinct framing.
      orbitDirection = index % 2 ? -1 : 1;
      var chapterRoll = new THREE.Quaternion().setFromAxisAngle(viewDirection, orbitDirection * 0.035);
      targetOrientation.premultiply(chapterRoll);
      targetZoom = hoverKey ? 1.1 : 1.08;
      targetDistance = 3.6;
      markers.forEach(function (m, i) {
        m.marker.position.copy(m.key === key ? toVec3(lat, lon, RADIUS * 1.004) : cityPositions[i]);
        m.halo.position.copy(m.marker.position).multiplyScalar(1.002);
        m.halo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), m.marker.position.clone().normalize());
      });
      acquisition.position.copy(toVec3(lat, lon, RADIUS * 1.01));
      acquisition.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), acquisition.position.clone().normalize());
      acquisition.material.color.set(landmarkActive ? landmarkColor() : cityColor(key));
      mount.setAttribute("data-landmark", landmarkActive ? "tower-bridge" : "");
      mount.setAttribute("data-focus-role", source ? String(index) : "overview");
      if (changed) focusStarted = performance.now();
    }
    applyKey(scrollKey, scrollSource);

    // Under reduced motion the render loop below never starts, so this
    // also has to snap the globe directly and render once itself —
    // otherwise hovering would update the orientation internally but nothing
    // would ever actually redraw to show it.
    function onFocus(e) {
      var detail = e && e.detail ? e.detail : {};
      if (detail.mode === "scroll") {
        return;
      }
      // main.js tracks label placement every frame. Replay the arrival
      // only when the actual role changes, rather than on every dispatch.
      if (hoverKey === detail.key && hoverSource === detail.source) {
        return;
      }
      flightLayer.visible = false;
      hoverKey = detail.key || null;
      hoverSource = detail.source || null;
      applyKey(hoverKey || scrollKey, hoverSource || scrollSource);
      if (reduced) {
        group.quaternion.copy(targetOrientation);
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
        styleMarkers(true);
        renderer.render(scene, camera);
      }
    }
    function onBlur() {
      if (!hoverKey) return;
      hoverKey = null;
      hoverSource = null;
      applyKey(scrollKey, scrollSource);
      if (!reduced) setScrollTargets(scrollState);
      if (reduced) {
        group.quaternion.copy(targetOrientation);
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
        styleMarkers(true);
        renderer.render(scene, camera);
      }
    }
    document.addEventListener("journey:focus", onFocus);
    document.addEventListener("journey:blur", onBlur);

    function onScrollState(e) {
      scrollState = e.detail;
      if (!scrollState) return;
      scrollSource = scrollState.active;
      scrollKey = scrollSource.getAttribute("data-place");
      if (hoverKey || dragging) return;
      if (!scrollState.inside) {
        flightLayer.visible = false;
        return;
      }
      if (activeSource !== scrollSource || activeMode) applyKey(scrollKey, scrollSource);
      if (reduced) {
        flightLayer.visible = false;
        group.quaternion.copy(targetOrientation);
        camera.zoom = targetZoom;
        camera.position.z = targetDistance;
        camera.updateProjectionMatrix();
        styleMarkers(true);
        renderer.render(scene, camera);
      } else {
        setScrollTargets(scrollState);
      }
    }
    document.addEventListener("journey:scroll", onScrollState);
    if (window.JourneyScroll && window.JourneyScroll.getState()) onScrollState({ detail: window.JourneyScroll.getState() });

    // ---------- drag to look around ----------
    // Manual control always wins outright: while dragging, the hover/
    // scroll targeting above is overridden by whatever the drag itself
    // sets as the target, every frame — so letting go never snaps the
    // globe back to somewhere the visitor just rotated away from.
    var dragging = false,
      lastX = 0,
      lastY = 0,
      baseTiltX = -0.15,
      targetTiltX = -0.15;

    function clientXY(e) {
      var p = e.touches ? e.touches[0] : e;
      return [p.clientX, p.clientY];
    }
    function pointerDown(e) {
      dragging = true;
      flightLayer.visible = false;
      baseTiltX = group.rotation.x;
      targetTiltX = baseTiltX;
      var xy = clientXY(e);
      lastX = xy[0];
      lastY = xy[1];
      mount.style.cursor = "grabbing";
    }
    function pointerMove(e) {
      if (!dragging) return;
      var xy = clientXY(e);
      group.rotation.y += (xy[0] - lastX) * 0.006;
      baseTiltX = Math.max(-0.9, Math.min(0.9, baseTiltX + (xy[1] - lastY) * 0.004));
      targetTiltX = baseTiltX;
      lastX = xy[0];
      lastY = xy[1];
      targetOrientation.copy(group.quaternion);
      if (reduced) {
        group.rotation.x = targetTiltX;
        targetOrientation.copy(group.quaternion);
        renderer.render(scene, camera);
      }
    }
    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      targetOrientation.copy(group.quaternion);
      mount.style.cursor = "grab";
    }
    mount.style.cursor = "grab";
    mount.style.touchAction = "pan-y";
    mount.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);

    // ---------- making the focused city unmistakable ----------
    // Rotation alone isn't enough to read as "in focus" when the facing
    // city has close neighbours — Aberdeen and Glasgow sit a couple of
    // degrees apart, so at this framing their markers can overlap however
    // the globe is turned. The active one grows and lights up fully; the
    // rest shrink back and dim, so which city is focused is never in
    // doubt regardless of how tightly its neighbours cluster around it.
    function styleMarkers(instant) {
      markers.forEach(function (m) {
        var isActive = m.key === activeKey;
        var color = landmarkActive && isActive ? landmarkColor() : cityColor(m.key);
        m.marker.material.color.set(color);
        m.halo.material.color.set(color);
        var targetScale = isActive ? 1.15 : 0.65;
        var targetOpacity = isActive ? 1 : 0.42;
        var targetHalo = isActive ? 1 : 0.55;
        if (instant) {
          m.curScale = targetScale;
          m.marker.material.opacity = targetOpacity;
          m.haloBase = targetHalo;
        } else {
          m.curScale += (targetScale - m.curScale) * 0.12;
          m.marker.material.opacity += (targetOpacity - m.marker.material.opacity) * 0.12;
          m.haloBase = (m.haloBase || 1) + (targetHalo - (m.haloBase || 1)) * 0.12;
        }
        m.marker.scale.setScalar(m.curScale);
      });
    }

    // ---------- re-theme on toggle, instead of a hard reload ----------
    new MutationObserver(function () {
      cs = getComputedStyle(root);
      starMat.color.set(cssColor("--text-3", "#8a8a8a"));
      if (journey3dLand) journey3dLand.mat.color.copy(coastlineColor());
      markers.forEach(function (m) {
        var color = new THREE.Color(landmarkActive && m.key === activeKey ? landmarkColor() : cityColor(m.key));
        m.marker.material.color.copy(color);
        m.halo.material.color.copy(color);
      });
      arcs.forEach(function (arcObj, idx) {
        arcObj.line.material.color.set(cityColor(CITIES[idx + 1].key));
      });
      acquisition.material.color.set(landmarkActive ? landmarkColor() : cityColor(activeKey));
      flightLine.material.color.set(landmarkActive ? landmarkColor() : cityColor(activeKey));
      traveler.material.color.copy(flightLine.material.color);
      if (reduced) renderer.render(scene, camera);
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    // ---------- draw-in + render loop ----------
    group.quaternion.copy(targetOrientation);
    group.position.x = targetPosX;
    if (reduced) {
      arcs.forEach(function (arcObj) {
        arcObj.line.material.opacity = 0.24;
      });
      styleMarkers(true);
      markers.forEach(function (m) {
        m.halo.scale.setScalar(m.haloBase);
        m.halo.material.opacity = 0.18 * m.haloBase;
      });
      renderer.render(scene, camera);
      return;
    }

    var started = null;
    var lastFrame = performance.now();
    var lastRender = 0;
    function tick(ts) {
      requestAnimationFrame(tick);
      if (document.hidden || (scrollState && !scrollState.inside && !hoverKey)) {
        lastFrame = ts;
        return;
      }
      if (ts - lastRender < 1000 / 45) return;
      lastRender = ts;
      if (!started) started = ts;
      var t = ts - started;
      // Keep arrival timing consistent on slower GPUs and busy tabs.
      var elapsed = Math.min(64, Math.max(0, ts - lastFrame));
      lastFrame = ts;
      var arrivalEase = 1 - Math.exp(-elapsed / 180);

      arcs.forEach(function (arcObj) {
        var p = Math.max(0, Math.min(1, (t - arcObj.delay - 500) / 900));
        arcObj.line.material.opacity = 0.2 * p;
      });

      styleMarkers();
      markers.forEach(function (m) {
        var k = (Math.sin(t / 900 + m.phase) + 1) / 2;
        m.halo.scale.setScalar(m.haloBase * (1 + k * 0.22));
        m.halo.material.opacity = 0.65 * m.haloBase * (1 - k * 0.25);
      });

      var progress = Math.max(0, Math.min(1, (ts - focusStarted) / 1400));
      if (!dragging) group.quaternion.slerp(targetOrientation, arrivalEase);
      else group.rotation.x += (targetTiltX - group.rotation.x) * 0.08;
      camera.zoom += (targetZoom - camera.zoom) * arrivalEase;
      camera.position.z += (targetDistance - camera.position.z) * arrivalEase;
      camera.updateProjectionMatrix();
      group.position.x += (targetPosX - group.position.x) * 0.06;
      acquisition.scale.setScalar(1 + progress * 0.8);
      acquisition.material.opacity = dragging ? 0 : 0.25 * Math.sin(progress * Math.PI) * (1 - progress);

      renderer.render(scene, camera);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
})();
