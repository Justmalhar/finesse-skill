/*
  Perigee launch page.
  A classic script on purpose: <script type="module"> is blocked on file://, dynamic import() is not.
  GSAP, ScrollTrigger and three.js load from jsDelivr at pinned versions, after first paint.
  Review hooks: ?motion=reduce forces the reduced path, ?at=<0..1> jumps to that scroll progress,
  ?shot renders the hero scene alone (used to capture poster.jpg).
*/
(() => {
  "use strict";

  const GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/index.js";
  const ST_URL = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/ScrollTrigger.js";
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js";

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduce = root.dataset.motion === "reduce";
  const shot = params.has("shot");
  const at = params.has("at") ? clamp01(parseFloat(params.get("at")) || 0) : null;

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- Header: translucent with a shadow only after scroll ---------- */
  const nav = document.querySelector(".nav");
  const syncNav = () => nav.toggleAttribute("data-scrolled", scrollY > 8);
  addEventListener("scroll", syncNav, { passive: true });
  syncNav();

  /* ---------- Rolling digits (signature G30) ---------- */
  const rollDigits = [...document.querySelectorAll("[data-roll] .roll__d")];
  const rollLive = document.querySelector("[data-roll-live]");
  let rollValue = -1;
  function setRoll(n) {
    if (n === rollValue) return;
    rollValue = n;
    const s = String(n).padStart(2, "0");
    rollDigits.forEach((d, i) => d.style.setProperty("--d", s[i]));
  }

  /* ---------- How it works: one progress value drives the viewfinder ---------- */
  const fig = document.querySelector(".vf");
  const trails = fig.querySelector(".vf__trails");
  const driftOut = fig.querySelector("[data-drift]");
  const reticle = fig.querySelector(".vf__ret");
  const RET_START = { x: -150, y: 92 };
  let lastStep = 0;

  function drawHow(p) {
    const s1 = ease(clamp01(p / 0.28));
    const s2 = ease(clamp01((p - 0.36) / 0.26));
    const s3 = ease(clamp01((p - 0.7) / 0.24));
    const f = p < 0.33 ? s1 : 1 - s2;
    // Zero-length dashes with round caps draw as dots, so the trail collapses into the star.
    trails.style.strokeDasharray = `${Math.max(f, 0.0005).toFixed(4)} 2`;
    driftOut.textContent = `${(30 * f).toFixed(1)}°`;
    fig.style.setProperty("--ra", `${(-30 * s2).toFixed(2)}deg`);
    // The reticle spirals in onto the pole.
    const a = s3 * Math.PI * 0.9, k = 1 - s3;
    const x = k * (RET_START.x * Math.cos(a) - RET_START.y * Math.sin(a));
    const y = k * (RET_START.x * Math.sin(a) + RET_START.y * Math.cos(a));
    reticle.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    setRoll(Math.round(90 * (1 - s3)));
    const step = p < 1 / 3 ? 1 : p < 2 / 3 ? 2 : 3;
    fig.dataset.step = step;
    fig.toggleAttribute("data-aligned", s3 >= 0.999);
    if (step !== lastStep || (s3 >= 0.999) !== fig.hasAttribute("data-was-aligned")) {
      lastStep = step;
      fig.toggleAttribute("data-was-aligned", s3 >= 0.999);
      rollLive.textContent = step === 3 && s3 >= 0.999 ? "Aligned on the pole" : "";
    }
  }

  // Discrete fallback (reduced motion, or the CDN fails): each step shows its finished state.
  const STEP_END = { 1: 0.3, 2: 0.66, 3: 1 };
  function discreteSteps() {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) drawHow(STEP_END[e.target.dataset.step]);
    }, { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll(".step").forEach((s) => io.observe(s));
  }

  /* ---------- Pre-order form: validate, busy, success, error ---------- */
  const form = document.querySelector(".form");
  const email = form.querySelector("input");
  const help = form.querySelector(".help");
  const submit = form.querySelector("button");
  const helpIdle = help.innerHTML;
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  function setHelp(tone, html) {
    if (tone) help.dataset.tone = tone; else delete help.dataset.tone;
    help.innerHTML = html;
  }
  email.addEventListener("blur", () => { if (email.value && !email.validity.valid) invalid(); });
  email.addEventListener("input", () => {
    if (email.getAttribute("aria-invalid") === "true" && email.validity.valid) {
      email.removeAttribute("aria-invalid");
      setHelp(null, helpIdle);
    }
  });
  function invalid() {
    email.setAttribute("aria-invalid", "true");
    setHelp("error", `${icon("i-alert")}<span>Enter an email like name@domain.com so we can confirm your pre-order.</span>`);
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submit.getAttribute("aria-busy") === "true") return;
    if (!email.validity.valid) { invalid(); email.focus(); return; }
    submit.setAttribute("aria-busy", "true");
    // ponytail: no checkout backend in this static demo; the busy and success states are wired for one.
    setTimeout(() => {
      submit.removeAttribute("aria-busy");
      submit.disabled = true;
      email.disabled = true;
      submit.querySelector(".btn__idle").textContent = "Pre-ordered";
      setHelp("ok", `${icon("i-check")}<span>Reserved for ${email.value.replace(/[<>&"]/g, "")}. We will write when it ships in March.</span>`);
    }, 900);
  });

  /* ---------- ?at review hook ---------- */
  function jumpToAt() {
    if (at === null) return;
    scrollTo({ top: at * (root.scrollHeight - innerHeight), behavior: "instant" });
  }

  /* ---------- Boot ---------- */
  if (reduce) {
    discreteSteps();
    drawHow(1);
    document.fonts.ready.then(jumpToAt);
    return;
  }

  // Everything heavy waits for load, so it never competes with the headline or the poster.
  const afterPaint = (fn) => (document.readyState === "complete" ? setTimeout(fn, 0) : addEventListener("load", () => setTimeout(fn, 0), { once: true }));
  afterPaint(() => {
    const libs = Promise.all([import(GSAP_URL), import(ST_URL)]);
    const scene = startScene();
    libs.then(([g, st]) => {
      initMotion(g.gsap, st.ScrollTrigger, scene);
      document.fonts.ready.then(() => {
        st.ScrollTrigger.refresh();
        jumpToAt();
        st.ScrollTrigger.update();
      });
    }).catch(() => {
      discreteSteps();
      jumpToAt();
    });
  });

  function initMotion(gsap, ScrollTrigger, scenePromise) {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Moment 2: the viewfinder sequence. The stage is CSS sticky; GSAP scrubs one progress value.
      const proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1, ease: "none",
        onUpdate: () => drawHow(proxy.p),
        scrollTrigger: { trigger: ".how", start: "top top", end: "bottom bottom", scrub: 0.5 },
      });
      drawHow(0);

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        // Moment 1: hero depth. The scene camera rises as the hero leaves; the headline never moves.
        ScrollTrigger.create({
          trigger: ".hero", start: "top top", end: "bottom top",
          onUpdate: (self) => scenePromise.then((s) => s && s.setScroll(self.progress)),
        });
        // Moment 3: the dial and the tracker drift at different rates. Displacement stays under 15%.
        gsap.utils.toArray("[data-depth]").forEach((layer) => {
          const d = Number(layer.dataset.depth) * 7.5;
          gsap.fromTo(layer, { yPercent: -d }, {
            yPercent: d, ease: "none",
            scrollTrigger: { trigger: ".order", start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
    });
    addEventListener("pagehide", () => ctx.revert(), { once: true });
  }

  /* ---------- three.js hero scene ---------- */
  function startScene() {
    const canvas = document.querySelector(".hero__canvas");
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    if (lowPower || !window.WebGL2RenderingContext) return Promise.resolve(null);
    return import(THREE_URL).then((THREE) => {
      const scene = mountScene(THREE, canvas);
      addEventListener("pagehide", scene.dispose, { once: true });
      return scene;
    }).catch(() => null);
  }

  function mountScene(THREE, canvas) {
    const D2R = Math.PI / 180;
    const phone = matchMedia("(max-width: 767px)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: shot });
    renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
    renderer.setClearColor(0x06080d, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 900);
    const CAM = new THREE.Vector3(0, 0.3, 8.2); // low, looking up: the rig stands against the sky
    const LOOK = new THREE.Vector3(0.2, 9.4, -30);

    // Seeded randomness: the sky is the same on every load, so the poster matches the live scene.
    let seed = 20260321;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
    // Altitude above the horizon, azimuth from due south (the view direction) toward the west (screen right).
    const altAz = (alt, az) => new THREE.Vector3(Math.sin(az * D2R) * Math.cos(alt * D2R), Math.sin(alt * D2R), -Math.cos(az * D2R) * Math.cos(alt * D2R));
    const LAT = 36;
    const pole = altAz(LAT, 180 - 58).normalize(); // north celestial pole: behind the viewer, up and to the right

    /* Sky dome: zenith to horizon, with a thin band of airglow. Raw ShaderMaterial output is display sRGB, so colours use setRGB, not hex. */
    const R = 400;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(R + 60, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        uniforms: {
          uZenith: { value: new THREE.Color().setRGB(0.014, 0.019, 0.034) },
          uHorizon: { value: new THREE.Color().setRGB(0.075, 0.095, 0.14) },
          uGlow: { value: new THREE.Color().setRGB(0.035, 0.075, 0.065) },
        },
        vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `
          uniform vec3 uZenith, uHorizon, uGlow; varying vec3 vDir;
          void main(){
            float h = vDir.y;
            vec3 c = mix(uHorizon, uZenith, pow(smoothstep(-0.02, 0.75, h), 0.55));
            c += uGlow * exp(-pow((h - 0.035) / 0.05, 2.0));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    dome.renderOrder = -2;
    dome.frustumCulled = false;
    scene.add(dome);

    /* Points: field stars, Milky Way grain, diffuse glow, H-alpha nebulae. One shader, additive. */
    const sky = new THREE.Group();
    scene.add(sky);
    const pointsMaterial = (falloff, twinkle) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uDpr: { value: renderer.getPixelRatio() }, uTime: { value: 0 }, uR: { value: R }, uFall: { value: falloff }, uTw: { value: twinkle } },
      vertexShader: `
        attribute float aSize; attribute vec3 aColor; attribute float aAlpha; attribute float aSeed;
        uniform float uDpr, uTime, uR, uTw; varying vec3 vColor; varying float vAlpha;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          float alt = wp.y / uR;
          float ext = smoothstep(-0.01, 0.16, alt);
          float tw = 1.0 + uTw * 0.22 * sin(uTime * (1.7 + aSeed * 2.3) + aSeed * 61.0) * (1.0 - smoothstep(0.0, 0.5, alt) * 0.6);
          gl_Position = projectionMatrix * viewMatrix * wp;
          gl_PointSize = aSize * uDpr * mix(0.75, 1.0, ext);
          vColor = mix(aColor * vec3(1.0, 0.86, 0.72), aColor, ext);
          vAlpha = aAlpha * tw * mix(0.25, 1.0, ext);
        }`,
      fragmentShader: `
        uniform float uFall; varying vec3 vColor; varying float vAlpha;
        void main(){
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = exp(-d * d * uFall) * vAlpha;
          a += exp(-d * d * uFall * 0.12) * vAlpha * 0.12 * step(0.6, vAlpha);
          if (a < 0.002) discard;
          gl_FragColor = vec4(vColor, a);
        }`,
    });
    function addPoints(n, fill, material) {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), alpha = new Float32Array(n), sd = new Float32Array(n);
      let k = 0;
      for (let i = 0; i < n; i++) {
        const s = fill(i);
        if (!s) continue;
        pos.set([s.dir.x * R, s.dir.y * R, s.dir.z * R], k * 3);
        col.set(s.color, k * 3);
        size[k] = s.size; alpha[k] = s.alpha; sd[k] = rand();
        k++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos.subarray(0, k * 3), 3));
      g.setAttribute("aColor", new THREE.BufferAttribute(col.subarray(0, k * 3), 3));
      g.setAttribute("aSize", new THREE.BufferAttribute(size.subarray(0, k), 1));
      g.setAttribute("aAlpha", new THREE.BufferAttribute(alpha.subarray(0, k), 1));
      g.setAttribute("aSeed", new THREE.BufferAttribute(sd.subarray(0, k), 1));
      const p = new THREE.Points(g, material);
      p.frustumCulled = false;
      sky.add(p);
      return p;
    }
    // Blackbody colour, softened toward white the way a lens and sensor render it.
    function kelvin(t) {
      t /= 100;
      let r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
      let g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
      let b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
      const c = [r, g, b].map((v) => Math.min(255, Math.max(0, v)) / 255);
      return c.map((v) => 0.45 + 0.55 * v);
    }
    const starTemp = () => {
      const r = rand();
      return r < 0.12 ? 2900 + rand() * 900 : r < 0.42 ? 3800 + rand() * 1500 : r < 0.8 ? 5300 + rand() * 1900 : 7200 + rand() * 9000;
    };
    // Field stars: a magnitude law gives many faint stars and a few bright ones.
    addPoints(60000, () => {
      const z = rand() * 2 - 1, t = rand() * Math.PI * 2, rr = Math.sqrt(1 - z * z);
      const dir = new THREE.Vector3(rr * Math.cos(t), z, rr * Math.sin(t));
      const m = 7.6 + 2.4 * Math.log10(rand() || 1e-6);
      const b = Math.pow(10, -0.4 * (m - 7.6));
      const lb = Math.log10(b);
      return { dir, color: kelvin(starTemp()), size: 1.8 + 1.25 * lb + (lb > 2.4 ? 2.5 : 0), alpha: Math.min(1, 0.36 + 0.36 * lb) };
    }, pointsMaterial(9, 1));

    // Milky Way: a great circle through the core, rising from the southern horizon toward the upper right.
    const core = altAz(11, 15);
    const upper = altAz(42, 86);
    const gN = new THREE.Vector3().crossVectors(core, upper).normalize();
    const gT = new THREE.Vector3().crossVectors(gN, core).normalize();
    const galDir = (l, b) => core.clone().multiplyScalar(Math.cos(l) * Math.cos(b)).addScaledVector(gT, Math.sin(l) * Math.cos(b)).addScaledVector(gN, Math.sin(b));
    const clump = (l, b) => {
      const n = Math.sin(l * 23.0 + Math.sin(b * 41.0) * 2.1) * Math.sin(l * 7.3 - b * 33.0) * 0.5 + 0.5;
      const m = Math.sin(l * 51.0 + b * 77.0) * 0.5 + 0.5;
      return 0.25 + 0.75 * (0.7 * n * n + 0.3 * m);
    };
    const dust = (l, b, bulge) => {
      const lane = 0.006 + 0.016 * Math.sin(l * 3.1 + 0.4) + 0.01 * Math.sin(l * 9.0);
      const w = 0.012 + 0.03 * bulge;
      const lane2 = -0.03 + 0.02 * Math.sin(l * 5.0);
      let k = 1 - 0.94 * Math.exp(-Math.pow((b - lane) / w, 2));
      if (l > -0.2 && l < 0.6) k *= 1 - 0.6 * Math.exp(-Math.pow((b - lane2) / (w * 0.6), 2));
      return k;
    };
    const sampleBand = (spread) => {
      const l = rand() < 0.42 ? gauss() * 0.33 : -1.4 + rand() * 4.2;
      const bulge = Math.exp(-Math.pow(l / 0.32, 2));
      const b = gauss() * (0.028 + 0.07 * bulge) * spread;
      return { l, b, bulge };
    };
    const warm = [1.0, 0.84, 0.66], cool = [0.78, 0.84, 1.0];
    const mix3 = (a, c, t) => a.map((v, i) => v + (c[i] - v) * t);
    addPoints(130000, () => {
      const { l, b, bulge } = sampleBand(1);
      const k = clump(l, b) * dust(l, b, bulge);
      const c = mix3(cool, warm, Math.min(1, 0.15 + bulge));
      return { dir: galDir(l, b), color: c, size: 1.3 + rand() * 1.4, alpha: (0.14 + 0.6 * rand()) * k * (0.8 + 1.0 * bulge) };
    }, pointsMaterial(7, 0));
    addPoints(9000, () => {
      const { l, b, bulge } = sampleBand(1.25);
      const k = dust(l, b, bulge);
      const c = mix3(cool, warm, Math.min(1, 0.2 + bulge * 1.2));
      return { dir: galDir(l, b), color: c, size: 26 + rand() * 64, alpha: (0.01 + 0.014 * rand()) * k * (0.6 + 1.8 * bulge) };
    }, pointsMaterial(3.2, 0));
    // H-alpha emission clouds strung along the band: the source of the page's one pink.
    const nebulae = [[-0.05, 0.02], [0.12, -0.03], [0.32, 0.01], [0.55, 0.035], [0.9, -0.02], [1.35, 0.03], [1.8, -0.01], [-0.4, 0.02]];
    addPoints(nebulae.length * 40, (i) => {
      const [nl, nb] = nebulae[i % nebulae.length];
      const l = nl + gauss() * 0.035, b = nb + gauss() * 0.022;
      return { dir: galDir(l, b), color: [1.0, 0.36, 0.62], size: 6 + rand() * 22, alpha: 0.025 + rand() * 0.04 };
    }, pointsMaterial(3, 0));
    // The pole star, so the axis has something to point at.
    addPoints(1, () => ({ dir: pole.clone(), color: kelvin(6000), size: 6, alpha: 1 }), pointsMaterial(9, 1));

    /* Ridges: three silhouettes, lighter with distance. */
    function ridge(d, base, amp, freq, phase, color) {
      const shape = new THREE.Shape();
      const W = d * 2.4, n = 220;
      shape.moveTo(-W, CAM.y - d);
      for (let i = 0; i <= n; i++) {
        const x = -W + (2 * W * i) / n, u = (x / d) * freq + phase;
        const h = 0.55 * (1 - Math.abs(Math.sin(u))) + 0.3 * (1 - Math.abs(Math.sin(u * 2.3 + 1.7))) + 0.15 * Math.sin(u * 5.1 + 0.3);
        shape.lineTo(x, CAM.y + Math.tan((base + amp * h) * D2R) * d);
      }
      shape.lineTo(W, CAM.y - d);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
      m.position.z = CAM.z - d;
      scene.add(m);
    }
    ridge(240, -0.4, 3.6, 1.1, 0.4, 0x080b11);
    ridge(130, -2.0, 4.2, 1.6, 2.1, 0x05070b);
    ridge(55, -6.0, 5.0, 2.3, 4.2, 0x030406);

    /* Studio light for the product: a PMREM environment from a few soft boxes, plus a key and a rim. */
    const accent = new THREE.Color(0xff65ab);
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.016, 0.03), side: THREE.BackSide })));
    const box = (w, h, color, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })); m.position.copy(p); m.lookAt(0, 0, 0); envScene.add(m); };
    box(10, 4, new THREE.Color(1.6, 1.8, 2.4), new THREE.Vector3(-6, 9, 6));
    box(3, 8, accent.clone().multiplyScalar(0.35), new THREE.Vector3(9, 2, -6));
    box(6, 3, new THREE.Color(0.9, 1.0, 1.3), new THREE.Vector3(7, 7, 5));
    box(8, 2, new THREE.Color(0.25, 0.3, 0.45), new THREE.Vector3(0, -3, 9));
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(envScene, 0.03).texture;
    scene.environment = envTex;
    const key = new THREE.DirectionalLight(0xc9d7ff, 2.4); key.position.set(3, 7, 7);
    const rim = new THREE.DirectionalLight(0xff8fc0, 0.3); rim.position.set(6, 3, -5);
    const fillL = new THREE.HemisphereLight(0x2a3a58, 0x050608, 0.7);
    scene.add(key, rim, fillL);

    /* The product. Units are about 10 cm. Local +Z of the mount is the polar axis. */
    const mat = {
      body: new THREE.MeshPhysicalMaterial({ color: 0x6b717d, metalness: 0.6, roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
      dark: new THREE.MeshPhysicalMaterial({ color: 0x17191e, metalness: 0.8, roughness: 0.3 }),
      knurl: new THREE.MeshStandardMaterial({ color: 0x24272d, metalness: 0.85, roughness: 0.42 }),
      pink: new THREE.MeshPhysicalMaterial({ color: accent, metalness: 0.55, roughness: 0.3, clearcoat: 0.5 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x05060c, metalness: 0.2, roughness: 0.04, clearcoat: 1 }),
      steel: new THREE.MeshStandardMaterial({ color: 0x8b9099, metalness: 1, roughness: 0.28 }),
      matte: new THREE.MeshStandardMaterial({ color: 0x141518, metalness: 0.1, roughness: 0.62 }),
      carbon: new THREE.MeshPhysicalMaterial({ color: 0x15171b, metalness: 0.3, roughness: 0.38, clearcoat: 0.6 }),
      led: new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(2.2), toneMapped: false }),
    };
    const along = (geo) => { geo.rotateX(Math.PI / 2); return geo; }; // Y-axis geometry onto Z
    function lathe(points, segs = 128) {
      return along(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segs));
    }
    function roundedProfile(R0, h, r, steps = 8) {
      const pts = [[0.0001, h / 2]];
      for (let i = 0; i <= steps; i++) { const a = (Math.PI / 2) * (i / steps); pts.push([R0 - r + Math.sin(a) * r, h / 2 - r + Math.cos(a) * r]); }
      for (let i = 0; i <= steps; i++) { const a = Math.PI / 2 + (Math.PI / 2) * (i / steps); pts.push([R0 - r + Math.sin(a) * r, -h / 2 + r + Math.cos(a) * r]); }
      pts.push([0.0001, -h / 2]);
      return pts.reverse();
    }
    function knurled(r, h, ridges) {
      const g = new THREE.CylinderGeometry(r, r, h, ridges * 2, 1, false);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), rr = Math.hypot(x, z);
        if (rr < r * 0.99) continue;
        const a = Math.atan2(z, x), seg = Math.round(((a + Math.PI) / (2 * Math.PI)) * ridges * 2);
        const k = seg % 2 ? 1.0 : 0.965;
        p.setXYZ(i, x * k, p.getY(i), z * k);
      }
      g.computeVertexNormals();
      return along(g);
    }
    function roundedBox(w, h, d, r) {
      const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, iw = w - 2 * r, ih = h - 2 * r;
      s.moveTo(x, y - r); s.lineTo(x + iw, y - r); s.quadraticCurveTo(x + iw + r, y - r, x + iw + r, y);
      s.lineTo(x + iw + r, y + ih); s.quadraticCurveTo(x + iw + r, y + ih + r, x + iw, y + ih + r);
      s.lineTo(x, y + ih + r); s.quadraticCurveTo(x - r, y + ih + r, x - r, y + ih);
      s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
      const g = new THREE.ExtrudeGeometry(s, { depth: d - 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 });
      g.translate(0, 0, -(d - 0.06) / 2);
      return g;
    }
    const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };

    const rig = new THREE.Group();
    rig.position.set(1.4, 0.05, 1.0);
    scene.add(rig);

    // Tripod: head, three carbon legs that run out of frame, leg locks.
    mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 48), mat.dark, rig, 0, 0, 0);
    mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 48), mat.body, rig, 0, 0.12, 0);
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Group();
      leg.rotation.y = (i / 3) * Math.PI * 2 + 0.5;
      rig.add(leg);
      const tilt = new THREE.Group(); tilt.position.set(0.24, -0.05, 0); tilt.rotation.z = 0.36; leg.add(tilt);
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 2.4, 24), mat.carbon, tilt, 0, -1.2, 0);
      mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.16, 24), mat.dark, tilt, 0, -0.5, 0);
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 24), mat.carbon, tilt, 0, -3.4, 0);
      mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.14, 24), mat.dark, tilt, 0, -2.3, 0);
    }
    // Pan base and altitude post.
    mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.42, 32), mat.dark, rig, 0, 0.38, 0);

    // The mount, oriented so its local +Z is the polar axis.
    const mount = new THREE.Group();
    mount.position.set(0, 0.95, 0);
    rig.add(mount);
    rig.updateMatrixWorld(true);
    const mw = new THREE.Vector3(); mount.getWorldPosition(mw);
    mount.lookAt(mw.clone().add(pole));

    const H = 0.38, BR = 0.56;
    mesh(lathe(roundedProfile(BR, H, 0.075)), mat.body, mount);
    // Machined groove and the sidereal ring on the front face.
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.006, 8, 128), mat.dark); groove.position.z = H / 2; mount.add(groove);
    mesh(lathe([[0.355, H / 2 - 0.01], [0.43, H / 2 - 0.01], [0.43, H / 2 + 0.018], [0.42, H / 2 + 0.028], [0.355, H / 2 + 0.028]]), mat.pink, mount);
    // Back plate and the altitude hinge down to the pan base.
    const plate = mesh(roundedBox(0.62, 1.05, 0.08, 0.08), mat.dark, mount, 0, -0.32, -H / 2 - 0.05);
    plate.rotation.set(0, 0, 0);
    const hinge = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.78, 32), mat.body, mount, 0, -0.8, -H / 2 - 0.05);
    hinge.rotation.z = Math.PI / 2;
    mesh(knurled(0.14, 0.1, 18), mat.knurl, mount, 0.44, -0.8, -H / 2 - 0.05).rotation.y = Math.PI / 2;
    // Polar camera window and status light, both off the rotating disc.
    const lensAt = new THREE.Vector2(-0.33, 0.33);
    mesh(lathe([[0.0001, 0.012], [0.062, 0.012], [0.072, 0.0], [0.072, -0.02]]), mat.dark, mount, lensAt.x, lensAt.y, H / 2 + 0.006);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.6), mat.glass);
    glass.rotation.x = Math.PI / 2; glass.position.set(lensAt.x, lensAt.y, H / 2 - 0.012); mount.add(glass);
    mesh(new THREE.SphereGeometry(0.014, 16, 8), mat.led, mount, 0.34, -0.34, H / 2 + 0.002);

    // The RA disc: knurled, it carries the clamp, the ball head and the camera.
    const ra = new THREE.Group(); ra.position.z = H / 2 + 0.028; mount.add(ra);
    mesh(knurled(0.34, 0.09, 72), mat.knurl, ra, 0, 0, 0.045);
    mesh(lathe([[0.0001, 0.02], [0.24, 0.02], [0.26, 0.0], [0.26, -0.01]]), mat.body, ra, 0, 0, 0.09);
    mesh(new THREE.BoxGeometry(0.5, 0.13, 0.08), mat.dark, ra, 0, 0, 0.15);
    mesh(new THREE.BoxGeometry(0.06, 0.06, 0.08), mat.pink, ra, 0, 0.32, 0.06); // index mark
    mesh(knurled(0.05, 0.07, 12), mat.knurl, ra, 0.29, 0, 0.15).rotation.y = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 32).rotateX(Math.PI / 2), mat.dark, ra, 0, 0, 0.26);
    mesh(new THREE.SphereGeometry(0.12, 48, 24), mat.steel, ra, 0, 0, 0.42);
    const ballTop = new THREE.Vector3(0, 0, 0.56);

    // The camera, aimed at the Milky Way core. We see its back and its screen.
    const cam = new THREE.Group(); cam.position.copy(ballTop); cam.scale.setScalar(0.82); ra.add(cam);
    rig.updateMatrixWorld(true);
    const cw = new THREE.Vector3(); cam.getWorldPosition(cw);
    cam.lookAt(cw.clone().add(core.clone().multiplyScalar(100)));
    cam.translateY(0.36);
    mesh(roundedBox(1.25, 0.82, 0.5, 0.08), mat.matte, cam, 0, 0, 0);
    mesh(roundedBox(0.34, 0.86, 0.4, 0.1), mat.matte, cam, -0.5, -0.02, 0.08); // grip
    mesh(roundedBox(0.5, 0.2, 0.36, 0.05), mat.matte, cam, 0.12, 0.47, 0.02); // viewfinder hump
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 24), mat.steel, cam, -0.42, 0.44, -0.02);
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 32), mat.dark, cam, 0.47, 0.44, -0.04);
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 24).rotateX(Math.PI / 2), mat.dark, cam, -0.1, -0.44, 0);
    const lensZ = 0.25;
    mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 64).rotateX(Math.PI / 2), mat.steel, cam, 0.1, -0.02, lensZ + 0.04);
    mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.62, 64).rotateX(Math.PI / 2), mat.matte, cam, 0.1, -0.02, lensZ + 0.39);
    mesh(knurled(0.315, 0.2, 60), mat.knurl, cam, 0.1, -0.02, lensZ + 0.32);
    mesh(new THREE.CylinderGeometry(0.33, 0.31, 0.1, 64).rotateX(Math.PI / 2), mat.dark, cam, 0.1, -0.02, lensZ + 0.74);
    mesh(new THREE.TorusGeometry(0.305, 0.008, 8, 64), mat.pink, cam, 0.1, -0.02, lensZ + 0.7);
    // Rear screen: a live-view of a star field, drawn once into a canvas texture.
    const lcd = document.createElement("canvas"); lcd.width = 320; lcd.height = 210;
    const c2 = lcd.getContext("2d");
    const grd = c2.createLinearGradient(0, 0, 320, 210); grd.addColorStop(0, "#0a1020"); grd.addColorStop(1, "#05070e");
    c2.fillStyle = grd; c2.fillRect(0, 0, 320, 210);
    c2.fillStyle = "rgba(255,226,190,0.08)";
    for (let i = 0; i < 70; i++) { c2.beginPath(); c2.arc(40 + i * 3.6 + gauss() * 14, 190 - i * 2.4 + gauss() * 14, 10 + rand() * 18, 0, 7); c2.fill(); }
    for (let i = 0; i < 420; i++) { const s = rand(); c2.fillStyle = `rgba(235,240,255,${0.3 + s * 0.7})`; c2.fillRect(rand() * 320, rand() * 210, s > 0.96 ? 2.4 : 1.2, s > 0.96 ? 2.4 : 1.2); }
    c2.strokeStyle = "rgba(255,255,255,0.55)"; c2.lineWidth = 2;
    c2.strokeRect(150, 95, 20, 20);
    c2.fillStyle = "rgba(255,101,171,0.9)"; c2.fillRect(12, 12, 10, 10);
    c2.fillStyle = "rgba(255,255,255,0.5)"; c2.fillRect(28, 14, 60, 6); c2.fillRect(232, 14, 76, 6); c2.fillRect(12, 190, 120, 6);
    const lcdTex = new THREE.CanvasTexture(lcd); lcdTex.colorSpace = THREE.SRGBColorSpace; lcdTex.anisotropy = 4;
    const screen = mesh(new THREE.PlaneGeometry(0.78, 0.51), new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false }), cam, 0.12, -0.04, -0.258);
    screen.rotation.y = Math.PI;
    mesh(new THREE.BoxGeometry(0.84, 0.57, 0.01), mat.glass, cam, 0.12, -0.04, -0.248);

    /* Framing: the rig sits right of the copy on wide screens, below it on phones. */
    const focus = new THREE.Vector3();
    mount.getWorldPosition(focus); focus.y += 0.35;
    let width = 0, height = 0, scrollTarget = 0, scrollNow = 0;
    function frame() {
      const aspect = width / height;
      camera.fov = aspect < 1 ? 46 : 34;
      camera.aspect = aspect;
      camera.clearViewOffset();
      camera.position.set(CAM.x, CAM.y + scrollNow * 0.55, CAM.z + scrollNow * 0.9);
      camera.lookAt(LOOK.x, LOOK.y + scrollNow * 1.6, LOOK.z);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const v = focus.clone().project(camera);
      const sx = aspect < 1 ? 0.56 : 0.71, sy = aspect < 1 ? 0.73 : 0.52;
      camera.setViewOffset(width, height, ((v.x + 1) / 2 - sx) * width, ((1 - v.y) / 2 - sy) * height - scrollNow * height * 0.06, width, height);
    }

    const mats = sky.children.map((p) => p.material);
    const T0 = 0; // sky angle at load: positions above are as defined
    const render = (time) => {
      const t = shot ? 0 : time / 1000;
      const theta = -(T0 + t * 0.0045);
      sky.quaternion.setFromAxisAngle(pole, theta);
      ra.rotation.z = theta;
      scrollNow += (scrollTarget - scrollNow) * 0.09;
      for (const m of mats) m.uniforms.uTime.value = t;
      frame();
      renderer.render(scene, camera);
    };

    let onScreen = true, first = true;
    const sync = () => renderer.setAnimationLoop(onScreen && !document.hidden ? loop : null);
    function loop(time) {
      render(time);
      if (first) { first = false; canvas.dataset.live = "true"; }
    }
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    const ro = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      render(performance.now());
    });
    ro.observe(canvas);
    sync();

    return {
      setScroll(p) { scrollTarget = p; },
      dispose() {
        renderer.setAnimationLoop(null);
        io.disconnect(); ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        scene.traverse((o) => {
          if (!(o.isMesh || o.isPoints)) return;
          o.geometry.dispose();
          for (const m of [o.material].flat()) {
            for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
            m.dispose();
          }
        });
        envTex.dispose(); pmrem.dispose(); lcdTex.dispose();
        renderer.dispose();
      },
    };
  }
})();
