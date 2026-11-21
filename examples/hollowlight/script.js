/* Hollowlight. Classic script (file:// blocks module scripts); three.js arrives by dynamic import. */
(function () {
  "use strict";
  var root = document.documentElement;
  var still = root.classList.contains("still");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* G14 running head: names the section under the reading line. */
  var head = document.getElementById("runhead");
  var headNo = head.querySelector("b");
  var headName = head.querySelector("span");
  var current = "";
  var swapTimer;
  function setHead(value) {
    if (value === current) return;
    current = value;
    var parts = value.split("|");
    clearTimeout(swapTimer);
    var apply = function () {
      headNo.textContent = parts[0];
      headNo.hidden = !parts[0];
      headName.textContent = parts[1];
      head.classList.remove("is-swapping");
    };
    if (reduce.matches) return apply();
    head.classList.add("is-swapping");
    swapTimer = setTimeout(apply, 150);
  }
  var navLinks = document.querySelectorAll(".nav__links a");
  var sections = document.querySelectorAll("[data-section]");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      setHead(e.target.dataset.section);
      navLinks.forEach(function (a) {
        a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id);
        if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "true");
      });
    });
  }, { rootMargin: "-30% 0px -65% 0px" });
  sections.forEach(function (s) { io.observe(s); });

  /* Newsletter: validate on submit, then live once an error has shown. Async button keeps its width. */
  var form = document.getElementById("signup");
  var input = document.getElementById("email");
  var help = document.getElementById("email-help");
  var live = document.getElementById("signup-live");
  var btn = form.querySelector("button");
  var helpText = help.innerHTML;
  var showedError = false;
  var busy = false;
  function face(name) {
    btn.querySelectorAll("[data-face]").forEach(function (f) { f.classList.toggle("is-on", f.dataset.face === name); });
  }
  function validate() {
    var v = input.value.trim();
    var msg = !v ? "Enter your email address so we know where to send it." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "That address is missing something. Check the part after the @." : "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    help.classList.toggle("is-error", !!msg);
    help.innerHTML = msg ? '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>' + msg : helpText;
    return !msg;
  }
  input.addEventListener("input", function () { if (showedError) validate(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    if (!validate()) { showedError = true; input.focus(); return; }
    busy = true;
    btn.setAttribute("aria-busy", "true");
    btn.setAttribute("aria-disabled", "true");
    face("busy");
    setTimeout(function () {
      face("done");
      live.textContent = "Subscribed. The first dispatch arrives at the start of next month.";
      help.textContent = "Done. Look for a letter from the studio at the start of next month.";
      btn.removeAttribute("aria-busy");
      setTimeout(function () { face("idle"); btn.removeAttribute("aria-disabled"); busy = false; }, 1800);
    }, 900);
  });
  var q = new URLSearchParams(location.search);
  if (q.get("state") === "error") { showedError = true; input.value = "keeper@saltmarrow"; validate(); }

  /* Showpiece: GSAP headline reveal and the pinned pillars. Content is complete without it. */
  function motionOK() { return !reduce.matches && !still; }
  function initGsap() {
    if (!window.gsap || !motionOK()) return;
    var gsap = window.gsap;
    gsap.ticker.lagSmoothing(0);
    if (window.SplitText) {
      gsap.registerPlugin(window.SplitText);
      document.fonts.ready.then(function () {
        window.SplitText.create("#hero-h", {
          type: "lines", mask: "lines", autoSplit: true, aria: "auto",
          onSplit: function (self) {
            return gsap.from(self.lines, { yPercent: 100, duration: 0.8, ease: "power3.out", stagger: 0.07, delay: 0.15 });
          }
        });
      });
    }
    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      var mm = gsap.matchMedia();
      mm.add("(min-width: 1240px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)", function () {
        var sec = document.getElementById("pillars");
        var grid = sec.querySelector(".pillars__grid");
        var steps = sec.querySelectorAll(".pillar");
        var plates = sec.querySelectorAll(".plate");
        sec.classList.add("is-pinned");
        var set = function (i) {
          steps.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
          plates.forEach(function (p, n) { p.classList.toggle("is-on", n === i); });
        };
        var st = window.ScrollTrigger.create({
          trigger: grid, start: "top 120px", end: "+=200%", pin: true, pinSpacing: true,
          onUpdate: function (self) {
            sec.style.setProperty("--p", self.progress.toFixed(3));
            set(Math.min(2, Math.floor(self.progress * 3)));
          }
        });
        return function () { st.kill(); sec.classList.remove("is-pinned"); sec.style.removeProperty("--p"); set(0); };
      });
    }
  }
  if (document.readyState === "complete") initGsap(); else addEventListener("load", initGsap);

  /* Scene: poster first; three.js only after paint, only where the device can afford it. */
  var scene = document.getElementById("scene");
  var canvas = document.getElementById("scene-canvas");
  var lowPower = (navigator.hardwareConcurrency || 4) <= 4;
  var webgl = "WebGL2RenderingContext" in window;
  if (reduce.matches || lowPower || !webgl) return;
  var dispose;
  requestAnimationFrame(function () {
    setTimeout(function () {
      import("https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js").then(function (THREE) {
        dispose = mountScene(THREE, canvas);
        scene.dataset.live = "true";
      }).catch(function () { scene.dataset.live = "false"; });
    }, 60);
  });
  addEventListener("pagehide", function () { if (dispose) dispose(); });

  function mountScene(THREE, canvas) {
    var GOLD = 0xf1ca47, FOG = 0x281714, CREAM = 0xe9dfd7, MAHOG = 0x3a1d1a, ROCK = 0x2a1a17;
    var phone = matchMedia("(max-width: 767px)").matches;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);

    var scene3 = new THREE.Scene();
    scene3.fog = new THREE.FogExp2(FOG, 0.011);
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

    /* Sea: a flat-shaded grid whose waves move on the CPU; flat shading needs no normals recomputed. */
    var seaGeo = new THREE.PlaneGeometry(260, 200, phone ? 90 : 150, phone ? 70 : 120);
    seaGeo.rotateX(-Math.PI / 2);
    seaGeo.translate(0, 0, -40);
    var seaPos = seaGeo.attributes.position;
    var seaBase = Float32Array.from(seaPos.array);
    var sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x140a08, roughness: 0.32, metalness: 0.1, flatShading: true }));
    scene3.add(sea);

    /* Rock: a squashed, roughened icosahedron and two outliers. */
    function rock(r, detail, sx, sy, sz, x, z, seed) {
      var g = new THREE.IcosahedronGeometry(r, detail);
      var p = g.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var k = 1 + 0.18 * Math.sin(p.getX(i) * 3.1 + seed) * Math.cos(p.getZ(i) * 2.7 + seed) + 0.08 * Math.sin(p.getY(i) * 7 + seed);
        p.setXYZ(i, p.getX(i) * k * sx, p.getY(i) * k * sy, p.getZ(i) * k * sz);
      }
      g.computeVertexNormals();
      var m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: ROCK, roughness: 0.95, flatShading: true }));
      m.position.set(x, 0, z);
      scene3.add(m);
      return m;
    }
    rock(3.4, 2, 1.3, 0.42, 1, 0, 0, 1.2);
    rock(1.2, 1, 1.2, 0.5, 1, 4.2, 1.6, 3.4);
    rock(0.8, 1, 1.4, 0.45, 1, -3.8, 2.2, 5.1);

    /* Tower: a lathed taper with two mahogany bands, gallery, lantern and dome. */
    var tower = new THREE.Group();
    var prof = [];
    for (var i = 0; i <= 12; i++) {
      var t = i / 12;
      prof.push(new THREE.Vector2(0.95 - 0.38 * t + 0.25 * Math.pow(1 - t, 6), t * 8.6));
    }
    var cream = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.75 });
    var dark = new THREE.MeshStandardMaterial({ color: MAHOG, roughness: 0.6, metalness: 0.2 });
    tower.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 28), cream));
    [[2.2, 0.8], [5.4, 0.7]].forEach(function (b) {
      var rr = 0.95 - 0.38 * (b[0] / 8.6) + 0.012;
      var band = new THREE.Mesh(new THREE.CylinderGeometry(rr - 0.03, rr, b[1], 28, 1, true), dark);
      band.position.y = b[0];
      tower.add(band);
    });
    var gallery = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.16, 28), dark);
    gallery.position.y = 8.65;
    tower.add(gallery);
    var rail = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.025, 6, 40), dark);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 9.05;
    tower.add(rail);
    var glass = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.05, 12, 1, true), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false }));
    glass.position.y = 9.3;
    tower.add(glass);
    var lampCore = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c2, fog: false }));
    lampCore.position.y = 9.3;
    tower.add(lampCore);
    var dome = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.7, 12), dark);
    dome.position.y = 10.17;
    tower.add(dome);
    var win = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.3), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.85 }));
    win.position.set(0, 6.6, 0.79);
    tower.add(win);
    tower.position.y = 0.9;
    scene3.add(tower);

    /* Keeper's cottage with one lit window. */
    var cottage = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.3), new THREE.MeshStandardMaterial({ color: 0xcfc3b9, roughness: 0.9 }));
    body.position.y = 0.55;
    var roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.8, 4), dark);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.15, 1, 0.68);
    roof.position.y = 1.5;
    var cw = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshBasicMaterial({ color: GOLD }));
    cw.position.set(-0.45, 0.6, 0.66);
    cottage.add(body, roof, cw);
    cottage.position.set(2.1, 0.75, 0.9);
    cottage.rotation.y = -0.35;
    scene3.add(cottage);

    /* Beam: an open cone whose alpha fades along its length and at its silhouette. Additive, no depth write. */
    var beamGeo = new THREE.ConeGeometry(3.4, 46, 40, 1, true);
    beamGeo.translate(0, -23, 0);
    beamGeo.rotateZ(Math.PI / 2);
    var beamMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(GOLD) }, uStrength: { value: 0.5 } },
      vertexShader: [
        "varying float vAlong; varying vec3 vN; varying vec3 vView;",
        "void main(){ vAlong = position.x / 46.0;",
        " vec4 mv = modelViewMatrix * vec4(position,1.0);",
        " vN = normalize(normalMatrix * normal); vView = normalize(-mv.xyz);",
        " gl_Position = projectionMatrix * mv; }"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor; uniform float uStrength;",
        "varying float vAlong; varying vec3 vN; varying vec3 vView;",
        "void main(){ float fall = pow(clamp(1.0 - vAlong, 0.0, 1.0), 2.2);",
        " float edge = pow(abs(dot(normalize(vN), normalize(vView))), 1.6);",
        " gl_FragColor = vec4(uColor * fall * edge * uStrength, 1.0);",
        " #include <colorspace_fragment>",
        "}"
      ].join("\n"),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    var beamPivot = new THREE.Group();
    beamPivot.position.set(0, 10.2, 0);
    var beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = -0.05;
    beamPivot.add(beam);
    scene3.add(beamPivot);

    /* Glow sprite at the lamp. */
    var gc = document.createElement("canvas");
    gc.width = gc.height = 128;
    var gx = gc.getContext("2d");
    var grad = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,241,194,1)");
    grad.addColorStop(0.18, "rgba(241,202,71,0.55)");
    grad.addColorStop(0.5, "rgba(241,202,71,0.12)");
    grad.addColorStop(1, "rgba(241,202,71,0)");
    gx.fillStyle = grad;
    gx.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(gc);
    glowTex.colorSpace = THREE.SRGBColorSpace;
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
    glow.scale.set(7, 7, 1);
    glow.position.set(0, 10.2, 0);
    scene3.add(glow);

    /* Stars. */
    var starGeo = new THREE.BufferGeometry();
    var sp = [];
    for (var s = 0; s < 700; s++) {
      var th = Math.random() * Math.PI - Math.PI, ph = 0.06 + Math.random() * 0.9;
      sp.push(Math.cos(th) * Math.cos(ph) * 160, Math.sin(ph) * 120 + 4, Math.sin(th) * Math.cos(ph) * 160 - 30);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf9f1f1, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.75, fog: false }));
    scene3.add(stars);

    /* Light: a dim warm sky, the lamp as a point, and a spot that turns with the beam to catch the waves. */
    scene3.add(new THREE.HemisphereLight(0x8a625a, 0x0c0403, 0.9));
    var key = new THREE.DirectionalLight(0xf9e6dc, 0.9);
    key.position.set(-24, 14, 30);
    scene3.add(key);
    var moon = new THREE.DirectionalLight(0xf9e6dc, 1.6);
    moon.position.set(-20, 10, -80);
    scene3.add(moon);
    var lamp = new THREE.PointLight(GOLD, 26, 26, 1.6);
    lamp.position.set(0, 10.2, 0.4);
    scene3.add(lamp);
    var spot = new THREE.SpotLight(GOLD, 900, 90, 0.2, 0.7, 1.4);
    spot.position.set(0, 10.2, 0);
    scene3.add(spot, spot.target);

    /* Framing: the tower sits right of centre on wide screens, centred and higher on phones. */
    var aspect = 1, lookX = 0, scroll = 0, scrollT = 0, lean = 0, leanT = 0;
    function frame() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1 ? 40 : 30;
      camera.updateProjectionMatrix();
      var dist = 46, halfW = Math.tan((camera.fov * Math.PI) / 360) * dist * aspect;
      lookX = aspect > 1.1 ? -halfW * 0.36 : 0;
    }
    var ro = new ResizeObserver(function () { frame(); render(performance.now()); });
    ro.observe(canvas);
    frame();

    var hero = canvas.closest(".hero");
    function onScroll() { scrollT = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1))); }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var fine = matchMedia("(hover: hover) and (pointer: fine)");
    function onMove(e) { if (fine.matches) leanT = (e.clientX / innerWidth - 0.5) * 2; }
    addEventListener("pointermove", onMove, { passive: true });

    var PERIOD = 10000;
    function render(time) {
      /* One white flash every ten seconds: the beam faces the camera when the ring in the card completes. */
      var a = (time % PERIOD) / PERIOD;
      beamPivot.rotation.y = -Math.PI / 2 - a * Math.PI * 2 + 0.9;
      var dir = new THREE.Vector3(Math.cos(-beamPivot.rotation.y), -0.32, Math.sin(-beamPivot.rotation.y));
      spot.target.position.set(dir.x * 30, 0, dir.z * 30);
      var facing = Math.max(0, Math.cos(beamPivot.rotation.y + Math.PI / 2));
      glow.material.opacity = 0.75 + 0.25 * Math.pow(facing, 8);
      glow.scale.setScalar(6 + 5 * Math.pow(facing, 12));

      var tt = time * 0.001, arr = seaPos.array;
      for (var i = 0; i < arr.length; i += 3) {
        var x = seaBase[i], z = seaBase[i + 2];
        arr[i + 1] = Math.sin(x * 0.32 + tt * 0.9) * 0.16 + Math.sin(z * 0.45 - tt * 1.2 + x * 0.12) * 0.12 + Math.sin((x + z) * 0.9 + tt * 1.7) * 0.04;
      }
      seaPos.needsUpdate = true;

      scroll += (scrollT - scroll) * 0.08;
      lean += (leanT - lean) * 0.04;
      var near = aspect < 1;
      camera.position.set(lookX + 1.5 + lean * 2, 2.4 + scroll * 5, (near ? 34 : 46) + scroll * 10);
      camera.lookAt(lookX + lean * 0.8, (near ? 6.5 : 5.6) + scroll * 2.5, 0);
      renderer.render(scene3, camera);
    }

    var onScreen = false;
    function sync() { renderer.setAnimationLoop(onScreen && !document.hidden ? render : null); }
    var vis = new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; sync(); });
    vis.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    if (still) { render(7200); }

    return function () {
      renderer.setAnimationLoop(null);
      vis.disconnect();
      ro.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", sync);
      scene3.traverse(function (o) {
        if (!(o.isMesh || o.isPoints || o.isSprite)) return;
        if (o.geometry) o.geometry.dispose();
        [].concat(o.material).forEach(function (m) {
          Object.keys(m).forEach(function (k) { if (m[k] && m[k].isTexture) m[k].dispose(); });
          m.dispose();
        });
      });
      renderer.dispose();
    };
  }
})();
