---
name: stack
description: Three.js scene discipline for omega-alpha-spiral — renderer setup, color/colorspace, shaders, resource disposal, scroll/vr cameras, texturing, render-loop hygiene, and glitch triage. Trigger on scenes, meshes, shaders, materials, cameras, textures, scroll/animation bindings, render-glitches, or memory/performance complaints.
---

# Stack — Three.js Scene Discipline

Hard-won patterns for the scroll-driven Three.js experience in this repo. Anything proven against Three `0.186.0` (the pinned version — check `node_modules/three/package.json`) that isn't here belongs in this skill's `learnings.md`.

## How to run this skill

1. **Start:** read `learnings.md` beside this file if it exists — past bugs recur in new skins. Also read `src/main.ts` and `src/core/` layout first so fixes land in the owning module.
2. **Do** the work using the sections below.
3. **End:** append a dated bullet to `learnings.md` — symptom → cause → fix — for anything that took more than one attempt. Delete disproven bullets instead of keeping them around.

## Ground rules that override everything

- **Trust the installed version, not memory.** Three.js change/migration notes in `node_modules/three/` or the release notes beat this file when they disagree. Log the correction in `learnings.md` with the version.
- **A scene that renders is a feature, not an accident.** Every bug fix must be verifiable against an actual frame (Playwright canvas-inspection in `tests/`, `npm run inspect:canvas`, or a manual run) — not "looks right in my head."

## Renderer & scene setup

- One `WebGLRenderer` per page. Multiple canvases on the same page: share one renderer via scissor/viewport, or destroy + recreate on route change — never stack two renderers over one gl context.
- Cap pixel ratio: `Math.min(devicePixelRatio, 2)` before sizing, and re-derive it whenever the canvas is resized or a device-switch event fires.
- Handle the context properly: listen for `webglcontextlost` / `webglcontextrestored` and pause the loop on the former — a silent dead canvas after a tab/driver event is a classic "works then stops" report.
- If the scene supports fallback, keep it simple: entry point that throws to a visible error surface (like the existing `[data-game-error]` box in `src/main.ts`) rather than a gracefully-broken black canvas.

## Colors, colorspace & tone mapping

- This Three version manages color by default. Set `colorSpace = SRGBColorSpace` on **color** maps (`map`, `emissiveMap`, `envMap`…); leave data textures (`roughnessMap`, `normalMap`, `aoMap`, `metalnessMap`) in `NoColorSpace` (linear). The classic symptom of a mis-set color map is washed-out or too-dark/too-grey surfaces.
- Prefer `renderer.outputColorSpace = SRGBColorSpace` + `toneMapping` (ACESFilmic usually) + `toneMappingExposure` over baking brightness into textures.
- Color vertices/lights in linear, not hex-as-sent: `new THREE.Color(0x…)` is created in sRGB and converted by Three — don't convert manually or you'll double-convert and go pink/green.

## Shaders

- A failed shader compile fails **silently** in bundled production paths: the mesh is missing, ghosted, or black, and the only evidence is a `THREE.WebGLProgram` error in the console. Check the console first after any GLSL edit — before touching scene code.
- Edit uniforms in place (`uniforms.uColor.value = x`). Replacing the whole uniforms object orphans the GPU binding and the update silently no-ops.
- `onBeforeCompile` string-patching is the brittle path. Pin to a stable chunk name AND assert the injection landed: `if (!shader.includes('your-marker')) throw new Error('shader patch missed')` — a quiet no-op patch is worse than a loud failure.
- Keep fragment shaders branch-light for mobile GPUs (this repo targets browsers on laptops down to phones): prefer `mix`/`step`/smoothstep compositions over divergent `if`/`else` trees.

## Textures & assets

- Size and compress for the scene's actual use: power-of-two when mipmapping is needed; KTX2 via `THREE.KTX2Loader` for big surfaces, else breakpoint-sized JPEG/WebP. A 4K plate shown at 500px is a memory tax you can see in Lighthouse.
- Set `anisotropy` (typically 4–8) on planet/ground/albedo surfaces viewed at grazing angles or texture shimmer shows up.
- **Preload before reveal.** A texture popping one frame late reads as a flash; gate scene reveal on the asset load complete event (see `loader.loadAsync`/`LoadingManager.onLoad`).
- Cross-origin: use a `LoadingManager` with `setURLModifier` only when you must; otherwise standard `TextureLoader` is fine for same-origin assets in this repo (`assets/`). Never let a cross-origin canvas bleed into `getImageData`/pixel-inspection assumptions in tests.

## Render loop & performance hygiene

- **No allocation inside the tick.** Reuse `Vector3`/`Quaternion`/`Matrix4`/`Color` scratch objects declared once outside the loop; `new` in rAF is a GC-hitch generator you only notice on scroll-driven pages.
- Static scenes: render on demand via a dirty flag (the current no-loop `resize()`-only render in `src/main.ts` is a valid pattern). Continuous `setAnimationLoop` only while things move.
- Prefer `renderer.setAnimationLoop(fn)` over a manual rAF chain — it survives context loss/restore better — and null it out on teardown.
- Keep an eye on `renderer.info.render.calls` and `renderer.info.memory.textures/geometries`: call growth → batching/instancing opportunity; geometry/texture growth with no new content → leaks (see Disposal).

## Disposal — the leak class

Removing an object from the scene frees **nothing**. On teardown (planet swap, route change, tab-visibility teardown, HMR-triggered cleanup):

- `geometry.dispose()`; `material.dispose()` for each material in any array; then **every** texture on the material (`map`, `normalMap`, `roughnessMap`, `emissiveMap`, …).
- `WebGLRenderTarget`s and EffectComposer passes need an explicit `.dispose()` — a render target that isn't disposed pins GPU memory until page unload.
- Kill the loop (`renderer.setAnimationLoop(null)` / cancel your rAF id) and remove the resize/scroll listeners. A zombie loop rendering to a dead canvas is the most common MPA / route-change hang.
- Prove it: snapshot `renderer.info.memory` before and after teardown — counts should return to (or below) baseline.

## Cameras & scroll-driven motion

- **One source of truth.** Derive camera state from normalized scroll/progress values (0–1 per section), never from accumulated deltas — accumulation drifts and breaks the scrub on refresh mid-page.
- **Ease the interpolation, not the mapping.** Damp the camera's chase toward its target (`pos.lerp(target, 1 - Math.pow(0.001, dt))` style), keep scroll→target mapping raw and reversible.
- Paths are keyframes: per-waypoint position + orientation. Interpolate positions with lerp and orientations with `Quaternion.slerp` — never lerp Euler angles (gimbal flips).
- Decouple read from write: read scroll/pointer in the event/observer, consume the latest value inside the rAF tick. Never call render (or camera math) from inside the scroll handler.

## Debugging a visual glitch — fixed order

1. **Console** — shader compile errors, texture 404s, WebGL warnings.
2. **Isolate the material** — does it reproduce with a plain `MeshBasicMaterial`? That splits material vs geometry/camera cleanly.
3. **`renderer.info`** — calls/memory for duplicates or leaks.
4. **Camera near/far + object scale/position** — z-fighting, near-plane clipping, objects vanishing "at distance".
5. **Read the scene code** — only now, with the above eliminated.
6. If a fix sticks, write it into `learnings.md` so the next occurrence is a lookup, not a rediscovery.

## This repo's specifics

- Three `0.186.0`, vanilla TS + Vite 8; renderer currently `antialias` + `high-performance`, refresh-on-resize only (no loop yet) — validating any loop change against the Playwright canvas tests in `tests/`.
- `lil-gui` (`0.21.0`) is the inspector harness — prefer debug toggles behind a GUI flag, don't ship GUI in the production path.
- GLTF work flows through `@gltf-transform/cli`; keep authored materials cheap (merge, dedupe) before they hit the runtime.