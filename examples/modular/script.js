(function () {
  "use strict";
  var root = document.documentElement;
  var q = new URLSearchParams(location.search);
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CDN = {
    three: "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
    gsap: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/index.js",
    st: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/ScrollTrigger.js"
  };

  /* One panel layout drives the SVG (generated from it) and the three.js model. Units are millimetres. */
  var LAYOUT = {"knobs":[[-130,-68,9,"Tune","osc",0.5],[-105,-68,7,"Wave","osc",0.2],[-82,-68,7,"PW","osc",0.62],[-48,-68,9,"Tune","osc",0.55],[-25,-68,7,"Fine","osc",0.47],[-2,-68,7,"Wave","osc",0.8],[32,-68,7,"VCO 1","mix",0.75],[54,-68,7,"VCO 2","mix",0.6],[76,-68,7,"Noise","mix",0.12],[-122,-20,14,"Cutoff","vcf",0.42],[-86,-20,8,"Res","vcf",0.7],[-62,-20,8,"Env","vcf",0.55],[-38,-20,8,"Key","vcf",0.3],[-4,-20,7,"A","env",0.05],[18,-20,7,"D","env",0.45],[40,-20,7,"S","env",0.3],[62,-20,7,"R","env",0.25],[92,-20,8,"Level","vca",0.8],[-130,32,7,"1","seq",0.3],[-102,32,7,"2","seq",0.55],[-74,32,7,"3","seq",0.3],[-46,32,7,"4","seq",0.72],[-18,32,7,"5","seq",0.42],[10,32,7,"6","seq",0.3],[38,32,7,"7","seq",0.85],[66,32,7,"8","seq",0.5],[104,32,9,"Tempo","seq",0.5],[132,32,7,"Swing","seq",0.2]],"jacks":[[112,-88],[128,-88],[144,-88],[112,-72],[128,-72],[144,-72],[112,-56],[128,-56],[144,-56],[112,-40],[128,-40],[144,-40],[112,-24],[128,-24],[144,-24]],"steps":[-130,-102,-74,-46,-18,10,38,66]};
  var ZONES = [["osc", -150, -96, 170, 46, "OSC 1"], ["mix", 20, -96, 72, 46, "MIX"], ["vcf", -150, -46, 128, 46, "FILTER"], ["env", -18, -46, 96, 46, "ENV"], ["vca", 82, -46, 20, 46, "VCA"], ["seq", -150, 4, 300, 92, "SEQUENCER"], ["patch", 100, -100, 56, 90, "PATCH"]];
  var FINISH = {
    slate: { body: "#33393f", zone: "#292e35", cap: "#13161a", skirt: "#07090c", ink: "#d3d8de", led: "#402d30" },
    bone: { body: "#dcd7cd", zone: "#cdc7ba", cap: "#1c2024", skirt: "#07090c", ink: "#262f38", led: "#b5959a" }
  };
  var ACCENT = "#f8417d", WOOD = "#865634";
  var STEP_MS = 60000 / 118 / 2; /* the hero runs pattern 01 at 118 BPM in eighths */

  /* Step clock: lights the LEDs on every drawn panel; the 3D model reads the same index. */
  var step = 0, stepListeners = [];
  if (!reduce) {
    setInterval(function () {
      if (document.hidden) return;
      step = (step + 1) % 8;
      document.querySelectorAll("[data-led]").forEach(function (led) { led.classList.toggle("is-on", Number(led.dataset.led) === step); });
      stepListeners.forEach(function (fn) { fn(step); });
    }, STEP_MS);
  } else {
    document.querySelectorAll('[data-led="0"]').forEach(function (led) { led.classList.add("is-on"); });
  }

  /* ---------- Hero scene ---------- */
  var scene3d = null;
  var canvas = document.querySelector("[data-scene]");
  var lowPower = (navigator.hardwareConcurrency || 8) <= 4;
  var webgl = "WebGL2RenderingContext" in window;
  if (canvas && !reduce && !lowPower && webgl && !q.has("poster")) {
    var start = function () {
      Promise.all([import(CDN.three), document.fonts ? document.fonts.ready : Promise.resolve()])
        .then(function (res) {
          scene3d = mountScene(res[0], canvas);
          canvas.dataset.live = "true";
        })
        .catch(function () { canvas.dataset.live = "false"; });
    };
    if (document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
  }

  function mountScene(THREE, canvas) {
    var phone = matchMedia("(max-width: 767px)").matches;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(26, 1, 10, 5000);
    var rig = new THREE.Group();
    var synth = new THREE.Group();
    rig.add(synth);
    scene.add(rig);

    var finish = FINISH[root.dataset.finish === "bone" ? "bone" : "slate"];
    var mats = {
      body: new THREE.MeshStandardMaterial({ color: finish.body, roughness: 0.55, metalness: 0.25 }),
      cap: new THREE.MeshStandardMaterial({ color: finish.cap, roughness: 0.42, metalness: 0.1 }),
      skirt: new THREE.MeshStandardMaterial({ color: finish.skirt, roughness: 0.6, metalness: 0.1 }),
      ink: new THREE.MeshStandardMaterial({ color: "#f2f4f6", roughness: 0.5 }),
      wood: new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.72, metalness: 0 }),
      jack: new THREE.MeshStandardMaterial({ color: "#a0a5ab", roughness: 0.3, metalness: 0.85 }),
      hole: new THREE.MeshStandardMaterial({ color: "#050607", roughness: 0.9 })
    };

    /* Panel face: zones, legends and knob scales drawn into a canvas texture. */
    var face = document.createElement("canvas");
    var PX = 6;
    face.width = 320 * PX; face.height = 210 * PX;
    var tex = new THREE.CanvasTexture(face);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    function drawFace(f) {
      var g = face.getContext("2d");
      g.setTransform(PX, 0, 0, PX, 160 * PX, 105 * PX);
      g.fillStyle = f.body; g.fillRect(-160, -105, 320, 210);
      ZONES.forEach(function (z) {
        g.fillStyle = f.zone;
        g.beginPath(); g.roundRect(z[1], z[2], z[3], z[4], 3); g.fill();
        g.fillStyle = f.ink; g.font = "600 5px Syne, sans-serif";
        g.fillText(z[5], z[1] + 4, z[2] + 8);
      });
      g.strokeStyle = f.ink; g.lineWidth = 0.45; g.globalAlpha = 0.7;
      LAYOUT.knobs.forEach(function (k) {
        for (var i = 0; i <= 10; i++) {
          var a = (-135 + 27 * i) * Math.PI / 180, r1 = k[2] + 3.5, r2 = k[2] + (i % 5 ? 4.8 : 6);
          g.beginPath();
          g.moveTo(k[0] + Math.sin(a) * r1, k[1] - Math.cos(a) * r1);
          g.lineTo(k[0] + Math.sin(a) * r2, k[1] - Math.cos(a) * r2);
          g.stroke();
        }
      });
      g.globalAlpha = 1;
      g.font = "500 3.4px Manrope, sans-serif"; g.textAlign = "center"; g.fillStyle = f.ink;
      LAYOUT.knobs.forEach(function (k) { g.fillText(k[3], k[0], k[1] + k[2] + 10.5); });
      g.textAlign = "start";
      g.font = "600 5px Syne, sans-serif"; g.fillText("FIELDFORM", -150, 101);
      g.fillStyle = ACCENT; g.font = "600 7px Syne, sans-serif"; g.textAlign = "end"; g.fillText("M8", 150, 101.5);
      tex.needsUpdate = true;
    }
    drawFace(finish);

    var H = 44;
    var body = new THREE.Mesh(new THREE.BoxGeometry(320, H, 210), mats.body);
    body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true;
    synth.add(body);
    var top = new THREE.Mesh(new THREE.PlaneGeometry(320, 210), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.2 }));
    top.rotation.x = -Math.PI / 2; top.position.y = H + 0.05; top.receiveShadow = true;
    synth.add(top);
    [-168, 168].forEach(function (x) {
      var cheek = new THREE.Mesh(new THREE.BoxGeometry(16, H + 14, 218), mats.wood);
      cheek.position.set(x, (H + 14) / 2, 0); cheek.castShadow = true; cheek.receiveShadow = true;
      synth.add(cheek);
    });

    var geo = {};
    function cyl(r1, r2, h, seg) {
      var key = [r1, r2, h, seg].join("/");
      return geo[key] || (geo[key] = new THREE.CylinderGeometry(r1, r2, h, seg || 40));
    }
    var indGeo = new THREE.BoxGeometry(1, 0.6, 1);
    LAYOUT.knobs.forEach(function (k) {
      var x = k[0], z = k[1], r = k[2];
      var skirt = new THREE.Mesh(cyl(r + 2, r + 2.6, 3), mats.skirt);
      skirt.position.set(x, H + 1.5, z); skirt.castShadow = true;
      var cap = new THREE.Mesh(cyl(r * 0.92, r, r > 10 ? 13 : 10), mats.cap);
      cap.position.set(x, H + 3 + (r > 10 ? 6.5 : 5), z); cap.castShadow = true;
      var ind = new THREE.Mesh(indGeo, mats.ink);
      var a = (-135 + 270 * k[5]) * Math.PI / 180, len = r - 2;
      ind.scale.set(1, 1, len);
      ind.position.set(x + Math.sin(a) * len / 2, cap.position.y + (r > 10 ? 6.5 : 5) + 0.3, z - Math.cos(a) * len / 2);
      ind.rotation.y = -a;
      synth.add(skirt, cap, ind);
    });

    var keyGeo = new THREE.BoxGeometry(18, 5, 14);
    var keys = [], leds = [];
    LAYOUT.steps.forEach(function (x) {
      var key = new THREE.Mesh(keyGeo, mats.cap);
      key.position.set(x, H + 2.5, 77); key.castShadow = true;
      var ledMat = new THREE.MeshStandardMaterial({ color: finish.led, emissive: ACCENT, emissiveIntensity: 0, roughness: 0.3 });
      var led = new THREE.Mesh(cyl(2.6, 2.6, 1.6, 20), ledMat);
      led.position.set(x, H + 0.8, 58);
      synth.add(key, led);
      keys.push(key); leds.push(ledMat);
    });
    [104, 132].forEach(function (x, i) {
      var b = new THREE.Mesh(cyl(7, 7, 4), i ? new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.4 }) : mats.cap);
      b.position.set(x, H + 2, 77); b.castShadow = true;
      synth.add(b);
    });
    LAYOUT.jacks.forEach(function (j) {
      var nut = new THREE.Mesh(cyl(4.6, 4.6, 2.4, 6), mats.jack);
      nut.position.set(j[0], H + 1.2, j[1]);
      var hole = new THREE.Mesh(cyl(2, 2, 0.4, 16), mats.hole);
      hole.position.set(j[0], H + 2.5, j[1]);
      synth.add(nut, hole);
    });

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.45 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    rig.add(ground);

    scene.add(new THREE.HemisphereLight(0xe4ebf7, 0x1c2027, 1.9));
    var key = new THREE.DirectionalLight(0xfff6ee, 3.4);
    key.position.set(-260, 620, 380); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -360, right: 360, top: 360, bottom: -360, near: 10, far: 2000 });
    key.shadow.radius = 6;
    scene.add(key);
    var rim = new THREE.DirectionalLight(ACCENT, 2.2);
    rim.position.set(420, 160, -460);
    scene.add(rim);

    synth.rotation.y = -0.42;

    /* Pointer lean (max 8 degrees) and scroll turn, both eased toward a target every frame. */
    var px = 0, py = 0, tx = 0, ty = 0, scroll = 0, tscroll = 0;
    var fine = matchMedia("(hover: hover) and (pointer: fine)");
    function onMove(e) {
      if (!fine.matches) return;
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    }
    addEventListener("pointermove", onMove, { passive: true });

    stepListeners.push(function (s) {
      leds.forEach(function (m, i) { m.emissiveIntensity = i === s ? 4 : 0; });
      keys.forEach(function (k, i) { k.position.y = H + 2.5 - (i === s ? 1.2 : 0); });
    });

    var size = { w: 0, h: 0 };
    function frameCamera() {
      var w = size.w, h = size.h, narrow = w < 768;
      camera.aspect = w / h;
      camera.fov = narrow ? 16 : 22;
      camera.position.set(0, 780, 1060);
      var look = narrow ? new THREE.Vector3(0, 0, 10) : new THREE.Vector3(-215 * Math.min(1.25, w / h / 1.6), 34, -10);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
    }
    function render(time) {
      px += (tx - px) * 0.06; py += (ty - py) * 0.06; scroll += (tscroll - scroll) * 0.1;
      synth.rotation.y = -0.42 + px * 0.14 + scroll * 0.7 + Math.sin(time * 0.00025) * 0.03;
      rig.rotation.x = py * 0.05;
      synth.position.y = Math.sin(time * 0.0009) * 2 - scroll * 60;
      renderer.render(scene, camera);
    }
    var onScreen = true;
    function sync() { renderer.setAnimationLoop(onScreen && !document.hidden ? render : null); }
    var io = new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; sync(); });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    var ro = new ResizeObserver(function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      size.w = w; size.h = h;
      renderer.setSize(w, h, false);
      frameCamera();
      renderer.render(scene, camera);
    });
    ro.observe(canvas);

    return {
      setScroll: function (p) { tscroll = p; },
      setFinish: function (name) {
        var f = FINISH[name];
        mats.body.color.set(f.body); mats.cap.color.set(f.cap);
        leds.forEach(function (m) { m.color.set(f.led); });
        drawFace(f);
      },
      dispose: function () {
        renderer.setAnimationLoop(null); io.disconnect(); ro.disconnect();
        removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", sync);
        scene.traverse(function (o) {
          if (!o.isMesh) return;
          o.geometry.dispose();
          [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
        });
        renderer.dispose();
      }
    };
  }

  /* ---------- Signal path: five stages on one scope ---------- */
  var N = 200, NOTES = [0, 0, 12, 0, 7, 0, 10, 12];
  function norm(a) { var m = 0; a.forEach(function (v) { m = Math.max(m, Math.abs(v)); }); return a.map(function (v) { return v / (m || 1) * 0.88; }); }
  var waves = (function () {
    var f = 3.6 / N, seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
    var cv = [], osc = [], mix = [], vcf = [], vca = [];
    for (var i = 0; i < N; i++) {
      cv.push((NOTES[Math.floor(i / N * 8)] / 12) * 1.6 - 0.8);
      var ph = (i * f) % 1, ph2 = (i * f * 1.012) % 1;
      osc.push((2 * ph - 1) * 0.55 + (ph2 < 0.5 ? 0.45 : -0.45));
    }
    osc.forEach(function (v) { mix.push(Math.tanh(v * 1.8) + rnd() * 0.16); });
    var s = [0, 0, 0, 0], a = 0.22, k = 2.6;
    for (var pass = 0; pass < 2; pass++) {
      for (var j = 0; j < N; j++) {
        var u = Math.tanh(mix[j] - k * s[3]);
        s[0] += a * (u - s[0]); s[1] += a * (s[0] - s[1]); s[2] += a * (s[1] - s[2]); s[3] += a * (s[2] - s[3]);
        if (pass) vcf.push(s[3]);
      }
    }
    vcf.forEach(function (v, i) {
      var t = i / N * 40, env;
      if (t < 3) env = 0; else if (t < 5) env = (t - 3) / 2; else if (t < 30) env = 0.35 + 0.65 * Math.exp(-(t - 5) / 7); else env = (0.35 + 0.65 * Math.exp(-25 / 7)) * Math.exp(-(t - 30) / 3.5);
      vca.push(v * env);
    });
    return [norm(cv), norm(osc), norm(mix), norm(vcf), norm(vca)];
  })();
  var STAGE_NAMES = ["Sequencer: pitch voltage", "Oscillators: saw plus square", "Mixer: driven, with noise", "Ladder filter: corners rounded, resonance rings", "Envelope and VCA: the note speaks"];
  var flat = waves[0].map(function () { return 0; });
  function toPath(arr) {
    var d = "";
    for (var i = 0; i < arr.length; i++) d += (i ? "L" : "M") + (i / (arr.length - 1) * 400).toFixed(1) + " " + (100 - arr[i] * 90).toFixed(1);
    return d;
  }
  function lerpArr(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
  var trace = document.querySelector("[data-trace]"), ghost = document.querySelector("[data-ghost]");
  var readout = document.querySelector("[data-readout-t]");
  var stepBtns = document.querySelectorAll("[data-step]");
  var chain = document.querySelectorAll("[data-chain]");
  var lastIdx = -1;
  function setStage(s) {
    s = Math.max(0, Math.min(4, s));
    var i = Math.min(3, Math.floor(s)), t = s - i;
    t = t * t * (3 - 2 * t);
    var cur = lerpArr(waves[i], waves[i + 1], t);
    var prev = i === 0 ? lerpArr(flat, waves[0], t) : lerpArr(waves[i - 1], waves[i], t);
    trace.setAttribute("d", toPath(cur));
    ghost.setAttribute("d", toPath(prev));
    var idx = Math.round(s);
    if (idx !== lastIdx) {
      lastIdx = idx;
      readout.textContent = STAGE_NAMES[idx];
      stepBtns.forEach(function (b) { if (Number(b.dataset.step) === idx) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      chain.forEach(function (c) { var n = Number(c.dataset.chain); c.classList.toggle("is-on", n === idx); c.classList.toggle("is-past", n < idx); });
    }
  }
  var stageNow = Number(q.get("stage") || 0);
  setStage(stageNow);

  var pinTrigger = null;
  function tweenStage(to) {
    var from = stageNow, t0 = performance.now(), dur = reduce ? 0 : 500;
    (function tick(now) {
      var p = dur ? Math.min(1, (now - t0) / dur) : 1;
      var e = 1 - Math.pow(1 - p, 3);
      stageNow = from + (to - from) * e;
      setStage(stageNow);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  stepBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var n = Number(b.dataset.step);
      if (pinTrigger) {
        var y = pinTrigger.start + (pinTrigger.end - pinTrigger.start) * (n / 4);
        scrollTo({ top: y + 1, behavior: reduce ? "auto" : "smooth" });
      } else tweenStage(n);
    });
  });

  /* GSAP: one pin for the signal path (desktop, full motion only) and the hero scene's scroll turn. */
  if (!reduce && !q.has("static")) {
    Promise.all([import(CDN.gsap), import(CDN.st)]).then(function (m) {
      var gsap = m[0].gsap || m[0].default, ScrollTrigger = m[1].ScrollTrigger || m[1].default;
      gsap.registerPlugin(ScrollTrigger);
      var mm = gsap.matchMedia();
      mm.add("(min-width: 1100px) and (min-height: 720px)", function () {
        pinTrigger = ScrollTrigger.create({
          trigger: "[data-path]", start: "center center", end: "+=240%", pin: true, scrub: true,
          onUpdate: function (self) { stageNow = self.progress * 4; setStage(stageNow); }
        });
        return function () { pinTrigger = null; };
      });
      ScrollTrigger.create({
        trigger: ".hero", start: "top top", end: "bottom top",
        onUpdate: function (self) { if (scene3d) scene3d.setScroll(self.progress); }
      });
    }).catch(function () { /* Without GSAP the steps stay clickable and nothing pins. */ });
  }

  /* ---------- Panel tour: a control and its zone light together ---------- */
  var art = document.querySelector("[data-panel-art]");
  function hot(zone, on) {
    if (on) art.dataset.hot = zone; else delete art.dataset.hot;
    art.querySelectorAll(".p-zone").forEach(function (z) { z.classList.toggle("is-hot", on && z.dataset.zone === zone); });
    art.querySelectorAll("[data-callout]").forEach(function (c) { c.classList.toggle("is-hot", on && c.dataset.callout === zone); });
    document.querySelectorAll(".control").forEach(function (c) { c.classList.toggle("is-hot", on && c.dataset.zone === zone); });
  }
  document.querySelectorAll(".control").forEach(function (c) {
    c.addEventListener("pointerenter", function () { hot(c.dataset.zone, true); });
    c.addEventListener("pointerleave", function () { hot(c.dataset.zone, false); });
  });

  /* ---------- Sounds: Web Audio sketches of six patterns ---------- */
  var TRACKS = [{"t":"Tram Depot","bpm":118,"root":45,"n":[0,0,12,0,7,0,10,12],"acc":[1,0,0,0,1,0,0,1],"kind":"saw"},{"t":"Night Ferry","bpm":92,"root":38,"n":[0,3,7,10,7,3,12,10],"acc":[1,0,0,0,0,0,1,0],"kind":"square"},{"t":"Acid Ledger","bpm":128,"root":40,"n":[0,12,0,3,0,15,12,7],"acc":[1,0,1,0,0,1,0,0],"kind":"acid"},{"t":"Glass Arp","bpm":140,"root":48,"n":[0,7,12,16,19,16,12,7],"acc":[1,0,0,0,1,0,0,0],"kind":"triangle"},{"t":"Low Mains","bpm":84,"root":31,"n":[0,0,0,5,0,0,3,7],"acc":[0,0,0,0,0,0,0,0],"kind":"low"},{"t":"Step Eight","bpm":122,"root":41,"n":[0,12,0,10,0,8,0,7],"acc":[1,0,1,0,1,0,1,0],"kind":"noise"}];
  var PATCH = {
    saw: { w: ["sawtooth", "sawtooth"], det: 7, cut: 900, q: 4, env: 2.5, a: 0.004, d: 0.18, g: 0.16 },
    square: { w: ["square", "square"], det: -1200, cut: 600, q: 2, env: 1.2, a: 0.04, d: 0.35, g: 0.13 },
    acid: { w: ["sawtooth"], det: 0, cut: 380, q: 16, env: 7, a: 0.003, d: 0.15, g: 0.16, slide: [2, 6] },
    triangle: { w: ["triangle", "triangle"], det: 1200, cut: 4200, q: 1, env: 0.5, a: 0.004, d: 0.22, g: 0.22 },
    low: { w: ["square"], det: 0, cut: 300, q: 3, env: 0.8, a: 0.01, d: 0.5, g: 0.2 },
    noise: { w: ["sawtooth"], det: 0, cut: 1200, q: 6, env: 3, a: 0.002, d: 0.08, g: 0.16, noise: 0.25 }
  };
  var STEPS = 64, ac = null, master = null, noiseBuf = null, playing = null;
  function audio() {
    if (ac) return ac;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    var comp = ac.createDynamicsCompressor();
    master = ac.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function voice(tr, i, t, len) {
    var p = PATCH[tr.kind], acc = tr.acc[i % 8], note = tr.root + tr.n[i % 8];
    var vcf = ac.createBiquadFilter(); vcf.type = "lowpass"; vcf.Q.value = p.q;
    var vca = ac.createGain(); vca.gain.value = 0;
    vcf.connect(vca); vca.connect(master);
    var oscs = p.w.map(function (w, k) {
      var o = ac.createOscillator(); o.type = w;
      var f = hz(note);
      if (p.slide && p.slide.indexOf(i % 8) >= 0) { o.frequency.setValueAtTime(hz(tr.root + tr.n[(i + 7) % 8]), t); o.frequency.exponentialRampToValueAtTime(f, t + len * 0.6); }
      else o.frequency.value = f;
      if (k === 1) o.detune.value = p.det;
      o.connect(vcf); o.start(t); o.stop(t + len + 0.6);
      return o;
    });
    if (p.noise) {
      var n = ac.createBufferSource(); n.buffer = noiseBuf;
      var ng = ac.createGain(); ng.gain.value = p.noise;
      n.connect(ng); ng.connect(vcf); n.start(t); n.stop(t + len + 0.2);
    }
    var peak = p.cut * (1 + p.env * (acc ? 1.6 : 1));
    vcf.frequency.setValueAtTime(peak, t);
    vcf.frequency.exponentialRampToValueAtTime(p.cut, t + p.d + 0.02);
    var g = p.g * (acc ? 1.35 : 1);
    vca.gain.setValueAtTime(0, t);
    vca.gain.linearRampToValueAtTime(g, t + p.a);
    vca.gain.setTargetAtTime(g * 0.35, t + p.a, p.d / 2);
    vca.gain.setTargetAtTime(0, t + len * 0.9, tr.kind === "low" ? 0.2 : 0.04);
    return oscs;
  }
  function stopTrack() {
    if (!playing) return;
    clearInterval(playing.timer); cancelAnimationFrame(playing.raf);
    var row = playing.row;
    row.classList.remove("is-playing");
    row.style.setProperty("--p", 0);
    row.querySelectorAll(".pattern i").forEach(function (b) { b.classList.remove("is-on"); });
    var btn = row.querySelector(".play");
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Play " + playing.tr.t);
    if (master) { master.gain.setTargetAtTime(0, ac.currentTime, 0.02); master.gain.setTargetAtTime(0.9, ac.currentTime + 0.15, 0.01); }
    playing = null;
  }
  function playTrack(row, tr) {
    stopTrack();
    audio();
    if (ac.state === "suspended") ac.resume();
    var len = 60 / tr.bpm / 2, t0 = ac.currentTime + 0.08, next = 0;
    var bars = row.querySelectorAll(".pattern i");
    var btn = row.querySelector(".play");
    row.classList.add("is-playing");
    btn.setAttribute("aria-pressed", "true");
    btn.setAttribute("aria-label", "Stop " + tr.t);
    playing = { row: row, tr: tr };
    playing.timer = setInterval(function () {
      while (next < STEPS && t0 + next * len < ac.currentTime + 0.12) { voice(tr, next, t0 + next * len, len); next++; }
    }, 25);
    (function ui() {
      if (!playing || playing.row !== row) return;
      var el = ac.currentTime - t0, s = Math.floor(el / len);
      row.style.setProperty("--p", Math.max(0, Math.min(1, el / (len * STEPS))).toFixed(4));
      bars.forEach(function (b, i) { b.classList.toggle("is-on", s >= 0 && i === s % 8); });
      if (s >= STEPS) { stopTrack(); return; }
      playing.raf = requestAnimationFrame(ui);
    })();
  }
  document.querySelectorAll("[data-track]").forEach(function (row) {
    var tr = TRACKS[Number(row.dataset.track)];
    row.querySelector(".play").addEventListener("click", function () {
      if (playing && playing.row === row) stopTrack(); else playTrack(row, tr);
    });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") stopTrack(); });

  /* ---------- Preorder ---------- */
  var form = document.querySelector("[data-order]");
  var email = form.querySelector("#order-email"), help = form.querySelector("#order-help"), submit = form.querySelector("button");
  var idleHelp = help.innerHTML, shown = false, busy = false;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  form.querySelectorAll('input[name="finish"]').forEach(function (r) {
    if (r.value === (root.dataset.finish || "slate")) r.checked = true;
    r.addEventListener("change", function () {
      if (r.value === "bone") root.dataset.finish = "bone"; else delete root.dataset.finish;
      if (scene3d) scene3d.setFinish(r.value);
    });
  });
  function face(name) {
    submit.querySelectorAll("[data-face]").forEach(function (f) { var on = f.dataset.face === name; f.classList.toggle("is-on", on); f.setAttribute("aria-hidden", String(!on)); });
  }
  function say(tone, html) { help.dataset.tone = tone; help.innerHTML = html; }
  function check() {
    var v = email.value.trim();
    if (EMAIL.test(v)) { email.removeAttribute("aria-invalid"); say("", idleHelp); return true; }
    email.setAttribute("aria-invalid", "true");
    say("error", '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>' + (v ? "That address looks incomplete, for example name@example.com." : "Add an email so we can hold your unit."));
    return false;
  }
  email.addEventListener("blur", function () { if (email.value.trim()) { shown = true; check(); } });
  email.addEventListener("input", function () { if (shown) check(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    shown = true;
    if (!check()) { email.focus(); return; }
    busy = true;
    submit.setAttribute("aria-busy", "true"); submit.setAttribute("aria-disabled", "true");
    face("busy");
    /* No shop behind this example: the reservation is simulated. ?order=fail shows the failure path. */
    setTimeout(function () {
      busy = false;
      submit.removeAttribute("aria-busy"); submit.removeAttribute("aria-disabled");
      if (q.get("order") === "fail") { face("idle"); say("error", '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>The reservation did not go through. Nothing was saved; try again in a minute.'); return; }
      var fin = form.querySelector('input[name="finish"]:checked').value;
      face("done");
      say("ok", '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Held: one M8 in ' + (fin === "bone" ? "Bone" : "Slate") + ". Confirmation is on its way; nothing is charged until March.");
      setTimeout(function () { face("idle"); }, 2000);
    }, 900);
  });

  /* ---------- One reveal style ---------- */
  var rev = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !root.classList.contains("static")) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (r) { io.observe(r); });
  } else rev.forEach(function (r) { r.classList.add("is-in"); });
})();
