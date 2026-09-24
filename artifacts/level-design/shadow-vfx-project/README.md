# Shadow Floor Two — NixieFX

This local NixieFX project contains two editable Three.js effect sources in `particle-data/effects/`. The game-loadable output is `out/vfx/`. Both effects were validated and exported with installed `nixie-fx` 0.1.7; the export manifest reports `three3d: supported` for each. They are not yet attached to the live Floor One starter at port 5210.

## Effects

1. `shadow-syntax-ash` — A low-rate stream of sharp cyan and amber square fragments at **two repaired code-bar joins**, never under the hero or across a traversable line. A world-space box emitter, at most 44 particles, with slow upward drift and a short fade. It makes Omega's old blocks visibly shed revised instructions without filling the map with noise.
2. `shadow-route-splice` — A short, angular sixteen-particle burst at the **one shifting diagonal seam**. It is an advance warning: fire the burst, then shift the visible bar and its collider about 250 ms later. A block's position change must remain readable with reduced motion and with particles disabled. Keep the other two routes open.

Both use procedural square billboards; no texture or external API is required. The palette inherits Stage One cyan and Shadow's amber character profile. The two effects share the scene's existing camera and WebGL renderer; they do not require PixiJS, CSS animation, or another full-screen post pass.

## Runtime contract for the Floor Two scene

- Load only the exported bundle through `loadVfxExportBundle({ manifest, effectsByPath }, { requiredBackend: 'three3d' })`.
- Construct one `ThreeVfxRenderer({ scene, camera, captureDebugTransforms: false })`. Create at most two syntax-ash instances at authored repair positions with different deterministic seeds. Create one route-splice instance with `autoStart: false` at the seam; call `setTransform({ position })` and `restart()` on the telegraph event. Its authored time-zero burst fires on restart; do not also call `emitBurst()` for that event.
- Call `vfx.update(deltaSeconds)` **once** per host frame, before the scene render. Pause it when gameplay pauses. Destroy it when Floor Two is released. The particles never own or alter collision, choice state, or dialogue.
- In reduced-motion mode, stop syntax ash and keep the seam's geometry/light telegraph while suppressing the particle burst. The player and three exits remain readable.

## Visual review

Open `https://nixiefx.com/editor/`, choose **Open Folder**, and select this directory (the one containing `vfx-editor.prj`). The editor saves effect JSON locally. The in-app browser loaded the editor launcher, but its folder picker did not open during this pass, so an owner motion review is still pending.

After an edit, run `nixie-fx validate <this-project-folder>` and `nixie-fx export <this-project-folder>` using the installed package CLI. Review the editor's Three backend and the exported `support.backends.three3d` report before integrating.
