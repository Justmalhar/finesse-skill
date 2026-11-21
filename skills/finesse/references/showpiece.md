# Showpiece

Read this when the user runs `/finesse showpiece`, or the brief asks for parallax, scroll storytelling, GSAP or a three.js scene.
Marketing register only. Verified against GSAP 3.15, `@gsap/react` 2.1, three r187 and Next.js 16.

## When it fits

Fits: a launch page, a portfolio, a product reveal, a campaign. The page is seen once or twice and the motion is part of the pitch.

Does not fit: dashboards, settings, docs, checkout, any page people return to daily, or a brief with no assets worth showing. Effects cannot rescue weak content; fix the copy and imagery first.

## Budgets and floors

| Rule | Value |
|---|---|
| Budget per page | 1 hero scene, at most 3 scroll-driven moments (hero parallax counts as one, each pin counts as one, the scene's idle motion does not), at most 2 pinned sections. A CSS `position: sticky` section driving a scrubbed timeline is a pin. |
| Pin length | at most 3 viewport heights of scroll per pinned section (`end: "+=300%"` at most) |
| Parallax | layers move at 0.8x to 1.2x scroll speed, displacement at most 15% of the element's height; imagery and depth layers only; body text never moves against its container; off under 768 px unless tested |
| Scroll | native scroll stays in control: no scroll-jacking, no whole-page snap, smooth-scroll libraries off by default |
| three.js | 1 canvas per page, DPR capped at 2 (1.5 on phones), dynamic import after first paint, paused offscreen and in hidden tabs, full disposal on unmount, `aria-hidden` canvas, poster fallback |
| Load | hero headline in HTML and visible without JavaScript; libraries never block LCP; LCP 2.5 s or less, CLS 0.1 or less, 60 fps on a mid-range laptop |
| Copy over a scene | a shade behind the text (a gradient from the ground colour) or a clear zone the scene keeps out of; check 4.5:1 against the brightest region of the scene and the poster, not the average |
| Cleanup | every GSAP context reverted, every ScrollTrigger killed on unmount |
| Reduced motion | remove parallax, pinning scrub, loops and the live scene; show the final state and the poster |

**Licensing.** GSAP and all its plugins (ScrollTrigger, SplitText, ScrollSmoother, MorphSVG and the rest) are free under the GSAP Standard License, including commercial use. The license bars only tools that build animations visually without code in competition with Webflow. Check gsap.com/standard-license for changes.

**Simple cases first.** Use CSS scroll-driven animations (`animation-timeline: view()` or `scroll()`) with a static fallback. They run in Chrome 115, Safari 26 and Firefox 159 and later. Use GSAP ScrollTrigger when you need pinning, a scrubbed multi-step timeline, or older browsers.

## Pattern catalogue

| Pattern | For | Budget | Main pitfall |
|---|---|---|---|
| Layered parallax hero | Depth behind a headline | 2 to 4 image layers, 15% max displacement | Moving the headline itself, or layers revealing their edges (oversize them by the displacement) |
| Pinned scrubbed sequence | A product explained in 3 to 5 steps | 1 pin, at most 3 viewport heights | Pins that trap the reader; missing `pinSpacing` causing overlap; no fallback layout |
| Headline reveal by line | One hero or section title | Once per page, 500 to 800 ms total | Splitting before fonts load; screen readers hearing fragments (SplitText `aria: "auto"` handles this) |
| Horizontal scroll section | A gallery or timeline of 4 to 8 items | Counts as a pin | Unreachable by keyboard; on phones, use a native overflow row instead |
| Scroll-linked three.js camera or object | Turning a product as you read | The one scene | Reading scroll inside the render loop every frame; set a progress value from ScrollTrigger and lerp toward it |
| Cursor-reactive element | A hero object that leans toward the pointer | Max 8 deg tilt or 12 px shift | Running on touch, or on text; gate with `(hover: hover) and (pointer: fine)` |
| Image reveal with clip-path | Feature images entering | Max 1 reveal style per page | Animating `width` or `height` instead of `clip-path: inset()` |
| Marquee | Logos or short proof | 1 per page | No pause control; under reduced motion it must stop; duplicate set needs `aria-hidden` |

Headline reveal uses `SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 100, stagger: 0.06 }) })`. Return the tween from `onSplit` so re-splits clean it up. Import with `import { SplitText } from "gsap/SplitText"` and register it.

## (a) GSAP parallax in React

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ParallaxHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((layer) => {
          gsap.to(layer, {
            yPercent: Number(layer.dataset.depth) * 15,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero">
      <img data-depth="0.6" className="hero__layer" src="/hero-far.avif" alt="" width={1600} height={1000} />
      <img data-depth="1" className="hero__layer" src="/hero-near.avif" alt="" width={1600} height={1000} />
      <h1 className="hero__title">Field notes from 40 alpine huts</h1>
    </section>
  );
}
```

`data-depth` runs from 0 to 1, so the nearest layer moves 15% of its height. `useGSAP` reverts its context on unmount, which kills the ScrollTriggers. The headline never moves.

## (b) CSS scroll-driven alternative

```css
.hero__layer {
  transform: none;
}

@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .hero__layer {
      animation: hero-drift linear both;
      animation-timeline: view();
      animation-range: exit;
    }
  }
}

@keyframes hero-drift {
  to {
    transform: translateY(calc(var(--depth, 1) * 15%));
  }
}
```

Set `--depth` (0 to 1) on each layer. Set `animation-timeline` after the `animation` shorthand, which resets it. Unsupported browsers get the static layout.

## (c) three.js hero scene

The client component shows the poster first and loads three.js only after paint, and only when the device can afford it. Four cores or fewer means most phones and budget laptops, which drop frames under a live scene while the page scrolls; they keep the poster. Probe WebGL with `"WebGL2RenderingContext" in window`: calling `getContext` on a spare canvas creates a second context, which counts against the browser's limit on live contexts until it is garbage collected.

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = navigator.hardwareConcurrency <= 4;
    const webgl = "WebGL2RenderingContext" in window;
    if (!canvas || reduce || lowPower || !webgl) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    import("./hero-scene")
      .then(({ mountScene }) => {
        if (cancelled) return;
        dispose = mountScene(canvas, "#2f6fd6");
        setLive(true);
      })
      .catch(() => setLive(false));

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div className="scene">
      <img className="scene__poster" src="/scene-poster.avif" alt="" width={1600} height={900} fetchPriority="high" />
      <canvas ref={canvasRef} className="scene__canvas" data-live={live} aria-hidden="true" />
    </div>
  );
}
```

```ts
import * as THREE from "three";

export function mountScene(canvas: HTMLCanvasElement, color: string): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const phone = matchMedia("(max-width: 767px)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.32, 160, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }),
  );
  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(3, 4, 5);
  scene.add(mesh, light, new THREE.AmbientLight(0xffffff, 0.4));

  const render = (time: number) => {
    mesh.rotation.y = time * 0.0002;
    renderer.render(scene, camera);
  };

  let onScreen = false;
  const sync = () => renderer.setAnimationLoop(onScreen && !document.hidden ? render : null);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", sync);

  const ro = new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  });
  ro.observe(canvas);

  return () => {
    renderer.setAnimationLoop(null);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", sync);
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line)) return;
      obj.geometry.dispose();
      for (const material of [obj.material].flat()) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose();
        }
        material.dispose();
      }
    });
    renderer.dispose();
  };
}
```

The canvas sits over the poster. When `data-live` is true, fade the canvas in and the poster out together (`.scene:has([data-live="true"]) .scene__poster { opacity: 0 }`): the renderer is transparent, so a poster left visible shows through the scene. Colours come in as hex because `THREE.Color` does not parse `oklch()`.

**Custom shaders.** Built-in materials go through the renderer's colour management; a `ShaderMaterial` writes its output straight to the canvas. `THREE.Color` stores linear values, so a uniform made from a hex colour renders too dark. End the fragment shader with `#include <colorspace_fragment>`, or in a `RawShaderMaterial` (no includes) pass sRGB values from `color.getRGB(target, THREE.SRGBColorSpace)`. Compare the rendered colour with the token beside it on screen.

**Without a bundler.** In static HTML, load pinned ES modules from a CDN with dynamic `import()` inside a classic script, since `<script type="module">` is blocked on `file://`. The scene code lives in that same classic script: a local `import("./hero-scene.js")` is a module load from `file://` and fails the same way. CDN URLs: `https://cdn.jsdelivr.net/npm/gsap@3.15.0/index.js`, `https://cdn.jsdelivr.net/npm/gsap@3.15.0/ScrollTrigger.js`, `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js`. The React examples port directly: replace `useGSAP` with `gsap.context()` and call `revert()` on teardown.

**WebGPU.** `WebGPURenderer` (import every class from `three/webgpu`, then `await renderer.init()`) falls back to WebGL 2 on its own. Use it when you need TSL node materials or compute; otherwise `WebGLRenderer` is the smaller, simpler default. Never import from both `three` and `three/webgpu` in one bundle.

## Next.js App Router

- GSAP, `useGSAP` and three.js code live in files marked `"use client"`. The page stays a Server Component that renders the headline and imports the client component.
- `next/dynamic` with `ssr: false` is allowed only inside a Client Component. It renders nothing on the server, so pass a `loading` poster, or use the `import()` inside `useEffect` pattern above.
- Keep three.js out of the shared bundle: import it only from the dynamically loaded module.
- Serve the poster through `next/image` with `loading="eager"` and `fetchPriority="high"` when it is the LCP element. `priority` is deprecated since Next.js 16.

## Verify

1. Throttle to 4x CPU and Fast 4G in DevTools Performance. Record a scroll through every moment; frames stay at 60 fps on a mid-range laptop with no long tasks over 50 ms during scroll.
2. Lighthouse mobile: LCP 2.5 s or less, CLS 0.1 or less. The LCP element is the headline or the poster, never the canvas.
3. Turn on reduced motion: no parallax, no pin scrub, no live scene, poster visible, content complete.
4. Disable JavaScript: headline and content visible, no hidden sections.
5. Mount and unmount the page 5 times (client navigation). `ScrollTrigger.getAll().length` returns to 0 and the WebGL context count does not grow.
6. Keyboard through every pinned and horizontal section; focus is never off screen.
7. Check 320, 390, 768, 1024 and 1440 px widths; no horizontal scroll.

Steps 1, 2 and 5 need DevTools throttling, Lighthouse and client navigation. A headless session or a static page without a router may not be able to run them. Report each one you could not run as "not run" under `Open`, with the reason; never drop it silently.
