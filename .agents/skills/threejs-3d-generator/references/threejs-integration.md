# Three.js Integration: Authored GLB

Use this after an asset is modeled in Blender and exported by
`scripts/blender_asset_workflow.py export` or Blender MCP. The reference-view
manifest, .blend, GLB, and in-game capture are separate evidence: no one file
proves the final appearance.

## Import

```ts
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const gltf = await new GLTFLoader().loadAsync("/assets/models/door/model.glb");
const door = gltf.scene;
scene.add(door);
```

Match the Blender scale, pivot, and orientation to the game camera. Keep the
detailed mesh visual-only and use a simple Box3 or authored proxy for collision.
Do not derive gameplay collision from every small code shard.

## Amplify Simple Shapes

Start with lighting and PBR materials. Animate only named emissive parts, not
the whole door, so the silhouette and path remain clear. For example:

```ts
const strip = door.getObjectByName("DoorSignal") as THREE.Mesh | undefined;
const signal = strip?.material as THREE.MeshStandardMaterial | undefined;
if (signal) signal.emissiveIntensity = 0.7 + 0.15 * Math.sin(elapsed * 1.8);
```

Add a small shader plane inside the aperture only if material animation cannot
express the effect. Keep it transparent, depth-write off, and behind the hero.
A portal shader must not replace the frame, threshold, or navigable geometry.
Use instancing for repeated pixel blocks and dispose geometry, textures, and
materials when the scene ends.

## Animation

For authored Blender clips, use the exported names and update with delta seconds:

```ts
const mixer = new THREE.AnimationMixer(door);
const clip = gltf.animations.find((item) => item.name === "open");
if (clip) mixer.clipAction(clip).play();
// In the game loop: mixer.update(deltaSeconds);
```

Check scale, bounds, triangle/material/texture counts, clip names, root motion,
and mobile legibility in the running game. Compare a capture with the approved
design card. A GLB export or a successful load is only an intake check.
