# Astra + Official Blender MCP: Practical Workflow

Research date: 2026-09-18

## Scope and evidence labels

This note describes a practical Codex/Astra workflow with Blender Foundation's official Blender MCP, from scene inspection through a `.glb` smoke test in Three.js. It uses current first-party OpenAI and Blender material. The final Three.js import check cites the official Three.js repository because neither OpenAI nor Blender defines `GLTFLoader` behavior.

- **Documented**: stated by a first-party page or reference manual.
- **Source-derived**: inferred from the official implementation at commit [`ff54e4d`](https://projects.blender.org/lab/blender_mcp/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643); it is not a public behavior guarantee.
- **Recommended**: a conservative workflow synthesized from the evidence.

## Bottom line

The productive loop is:

1. State the intended experience and measurable completion condition.
2. Preserve the source scene and inspect its structure before editing.
3. Make one named, reversible change.
4. Re-inspect structured state and a visual artifact.
5. Save a copy, render, and export to explicit paths.
6. Verify each artifact independently, then load the `.glb` in the actual Three.js runtime.
7. Keep Blender source and runtime export separate; a successful render is not proof of a successful game asset.

This mirrors OpenAI's published Astra work: start from the desired experience, let the agent propose implementation, give it repeatable inspection surfaces, and iterate against rendered output plus structured state rather than prompts alone.[1][2] The architecture article also preserves the prior Blender scene before rebuilding and validates in Blender before transfer to another engine.[2]

## Which Blender MCP

Use Blender Foundation's project:

- Lab page: <https://www.blender.org/lab/mcp-server/>
- Repository: <https://projects.blender.org/lab/blender_mcp>
- Latest inspected release: `v1.0.3`, tag timestamp 2026-09-11, minimum Blender `5.1.0`.[4][5]
- The Lab page was published 2026-03-30 and modified 2026-09-11 according to Blender's WordPress API.[6]

Do not confuse it with `ahujasid/mcp-for-blender`. That repository describes itself as a third-party integration not made by Blender.[7]

## Client/server architecture

```text
Codex / ChatGPT desktop / IDE
          |
          | MCP over stdio (usual local setup)
          v
   blender-mcp Python process
          |
          | local TCP socket
          v
 Blender MCP add-on inside Blender
          |
          | bpy on Blender's main thread
          v
      active .blend scene
```

**Documented:** Codex supports local MCP servers over stdio and stores their configuration in `config.toml`; CLI, IDE, and desktop clients on one Codex host share that configuration.[3] The official Blender project describes its MCP server as the bridge between an MCP client and the Blender add-on.[4]

**Source-derived:** The server defaults to `localhost:9876`; `BLENDER_MCP_HOST` and `BLENDER_MCP_PORT` override those values. Requests and responses are UTF-8 JSON terminated by a null byte. The add-on executes received Python in Blender's main thread, while its socket work is non-blocking.[8][9]

The practical consequence is that there are two policy boundaries:

- Codex decides whether to invoke an MCP tool.
- Blender then executes the tool's Python with Blender-process privileges.

Codex's workspace sandbox does not turn the Blender process into a sandbox.

## Setup and first connection

1. Install the add-on linked by the official Lab page in Blender 5.1 or newer, enable it, and start its bridge server.[4][5]
2. Configure the official stdio server in Codex, using the command supplied by the package or add-on instructions. Codex supports `codex mcp add <name> -- <stdio-command>` and project-local `.codex/config.toml` in trusted projects.[3]
3. Prefer an explicit approval policy. `default_tools_approval_mode = "writes"` prompts for tools not marked read-only; a per-tool override can force `execute_blender_code` to prompt.[3]
4. Confirm the server appears in `codex mcp list` or `/mcp`, then invoke a read-only scene-summary tool before any edit.[3][10]

Suggested policy shape:

```toml
[mcp_servers.blender]
command = "uv"
args = ["run", "blender-mcp"]
default_tools_approval_mode = "writes"
tool_timeout_sec = 300

[mcp_servers.blender.tools.execute_blender_code]
approval_mode = "prompt"
```

The exact launch command depends on how the official server was installed. Do not copy a command from the similarly named community server.

## Validation surfaces

No one surface is enough. Use all applicable layers:

| Surface | What it proves | What it does not prove |
| --- | --- | --- |
| Scene summaries | Object, collection, datablock, path, linked-library, and missing-file state | Visual correctness |
| Object detail | Transform, hierarchy, materials, modifiers, and object identity | Final shading or runtime compatibility |
| Blender screenshot | UI state and viewport appearance at one moment | Saved state, export validity, or animation over time |
| Rendered image | Camera, render engine, lights, materials, and geometry produced an image | Correct `.glb`, game performance, or interaction |
| File checks | Artifact exists, is non-empty, and has expected format markers | Semantic correctness |
| Three.js load | `GLTFLoader` parsed the deployed asset and created a scene | Art direction, scale, collisions, or frame budget |
| Browser screenshot and counters | Runtime appearance, draw calls, triangles, errors, and loading state | Blender source editability |

OpenAI's game workflow exposes named test scenes plus state and performance counters, then uses browser tests, screenshots, and real-control journey tests. The article explicitly notes that screenshots alone miss failures such as collision readiness and position jumps.[1] The same pattern applies here: create repeatable Blender checkpoints and a small runtime inspection API instead of relying on visual memory.

## Shared vocabulary

Use these terms consistently in prompts and validation output.[10]

| Term | Meaning in this workflow |
| --- | --- |
| Scene | Top-level Blender container; a `.blend` can contain several |
| View Layer | Controls collection visibility and selectability for a view/render |
| Collection | Organizational tree to which objects are linked |
| Object | Transform-bearing instance that references underlying data |
| Datablock | Mesh, material, image, camera, action, or other underlying data |
| Active object | The one object operators treat as primary |
| Selection | A set separate from the active object; many operators require both |
| Mode | Object/Edit/Sculpt/etc.; operator behavior depends on it |
| Context | Current scene, view layer, active area, mode, active object, and selection |
| Dependency graph | Evaluated scene state; update it before reading computed results after edits |
| World/local/object space | Distinct coordinate systems; do not use them interchangeably |
| Origin | Object transform reference; mesh vertices are relative to it |
| Shared data | Multiple objects referencing one datablock; edits affect every user |
| Source asset | Editable `.blend` plus external dependencies |
| Runtime asset | Exported `.glb` consumed by the game |
| Artifact | A saved copy, render, report, or export with an explicit path |

Blender's bundled MCP instructions say to inspect first, preserve naming and structure, confirm destructive edits, inspect progressively, and prefer dedicated tools. They call `execute_blender_code` a last resort and require explicit handling of mode, active object, selection, shared data, and dependency-graph updates.[10]

## Smallest proof ladder

Each rung should stop on failure. Keep all outputs in a disposable proof directory, never over the original asset.

### 0. Establish the safety boundary

- Work on a copy or disposable VM/account without sensitive files.
- Record the source `.blend` path and whether it is already saved.
- Choose unique absolute paths for the saved copy, render, and `.glb`.
- Disable external network access unless the task specifically needs it.

### 1. Inspect without changing state

Call the dedicated summary tools:

- `get_blendfile_summary_path_info`
- `get_blendfile_summary_datablocks`
- `get_blendfile_summary_of_linked_libraries`
- `get_blendfile_summary_missing_files`
- `get_objects_summary`
- `get_object_detail_summary` for only the relevant objects
- a screenshot tool when UI context matters

Record scene name, object count/types, collection hierarchy, active object, mode, units, render engine, current filepath, missing files, linked libraries, and target object identity. This is the baseline contract.

### 2. Make one reversible named edit

There is no dedicated general edit tool, so use `execute_blender_code` only after inspection. A useful smoke edit is a uniquely named cube with a custom property, placed away from existing content. Return structured data rather than relying on printed output:

```python
import bpy

name = "MCP_PROOF_CUBE"
if bpy.data.objects.get(name):
    raise RuntimeError(f"Refusing name collision: {name}")

if bpy.context.mode != "OBJECT":
    bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
obj = bpy.context.object
obj.name = name
obj["mcp_proof"] = "2026-09-18"
bpy.context.view_layer.update()

result = {
    "name": obj.name,
    "type": obj.type,
    "location": list(obj.location),
    "marker": obj["mcp_proof"],
}
```

The unique name makes the edit discoverable and removable. It is not safe to delete an existing object to make room for the proof.

### 3. Re-inspect the edit

Use `get_objects_summary` and `get_object_detail_summary("MCP_PROOF_CUBE")`. Verify the returned name, type, transform, collection, dimensions, and data name. The dedicated detail tool does not expose custom properties in the inspected revision, so its independent structural observations are the useful proof here. Capture a viewport screenshot if useful. Do not accept the code tool's own return value as the only proof.

### 4. Save a copy

The official MCP currently has no dedicated save tool, so saving requires `execute_blender_code` and explicit approval. Blender 5.2 documents `bpy.ops.wm.save_as_mainfile`; `copy=True` writes the current state without making that copy the active file.[11]

```python
import bpy
import os

target = os.path.abspath(r"C:\path\to\proof\scene-proof.blend")
if os.path.exists(target):
    raise RuntimeError(f"Refusing overwrite: {target}")

op = bpy.ops.wm.save_as_mainfile(
    filepath=target,
    copy=True,
    check_existing=False,
)
result = {
    "operator": sorted(op),
    "active_blend": bpy.data.filepath,
    "copy_path": target,
    "exists": os.path.isfile(target),
    "bytes": os.path.getsize(target) if os.path.isfile(target) else 0,
}
```

Require `FINISHED`, `exists: true`, and a non-zero size. Confirm that the active source path did not unexpectedly change.

### 5. Render an artifact

Call `render_viewport_to_path("scene-proof.png")`, then validate the returned path, non-zero size, and decoded image dimensions. Inspect the image.

**Source-derived:** despite its name, this tool invokes `bpy.ops.render.render(write_still=True)` using the current scene and temporarily changes `scene.render.filepath`. It strips the requested directory and writes the basename under Blender's temporary `blender_mcp` directory.[12] Therefore, treat its returned `filepath` as authoritative; do not assume the caller's directory was used. The current implementation marks this file-writing tool read-only, so `writes` approval mode alone may not prompt for it.[12]

### 6. Export an uncompressed GLB

Use a unique absolute output path and the documented Blender 5.2 glTF operator. Start without Draco, meshopt, or gltfpack so Three.js needs no extra decoder:

```python
import bpy
import os

target = os.path.abspath(r"C:\path\to\proof\scene-proof.glb")
if os.path.exists(target):
    raise RuntimeError(f"Refusing overwrite: {target}")

op = bpy.ops.export_scene.gltf(
    filepath=target,
    check_existing=False,
    export_format="GLB",
    export_yup=True,
    export_apply=False,
    export_animations=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
)

with open(target, "rb") as handle:
    magic = handle.read(4)

result = {
    "operator": sorted(op),
    "path": target,
    "exists": os.path.isfile(target),
    "bytes": os.path.getsize(target) if os.path.isfile(target) else 0,
    "magic_ascii": magic.decode("ascii", errors="replace"),
}
```

Require `FINISHED`, a non-zero file, and GLB magic `glTF`. Blender documents `.glb` as the binary single-file form and exposes controls for +Y up, modifiers, animations, cameras, lights, and custom properties.[13][14] `export_apply=True` can prevent shape-key export, so it should not be enabled casually.[14]

Before export, decide whether the runtime needs cameras, lights, animations, custom properties, and unapplied modifiers. Non-mesh data may need conversion, and material/shader behavior must be checked in the target engine.[13]

### 7. Load it in Three.js

Serve the asset through the application's normal dev server and perform a real loader smoke test:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltf = await new GLTFLoader().loadAsync('/assets/scene-proof.glb');
const meshes = [];
gltf.scene.traverse((node) => {
  if (node.isMesh) meshes.push(node.name);
});

if (!meshes.includes('MCP_PROOF_CUBE')) {
  throw new Error(`Expected proof mesh; got: ${meshes.join(', ')}`);
}

scene.add(gltf.scene);
```

The official Three.js docs define `GLTFLoader` as an explicit addon import and show `loadAsync()` followed by `scene.add(gltf.scene)`.[15] Then validate in-browser console errors, mesh names/count, bounds/scale, materials/textures, animation clips, draw calls, triangles, and a screenshot from a repeatable camera.

### 8. Clean up only after proof

Remove `MCP_PROOF_CUBE` from the working scene only if cleanup is requested. Keep the proof copy, render, `.glb`, and runtime test results as evidence. Never use cleanup as a reason to overwrite the source file.

## Practical Astra prompting

A compact prompt should describe the outcome, boundaries, observations, and stop condition rather than prescribe every implementation step:

```text
Using the official Blender MCP, inspect the current scene before editing it.
Do not overwrite the active .blend or delete existing data. Add one uniquely
named reversible proof object, validate it through scene summaries and a render,
save a copy to <absolute .blend path>, export an uncompressed GLB to <absolute
.glb path>, and verify that the app's Three.js GLTFLoader can load it. Report
the observed object counts, artifact paths and sizes, GLB magic, runtime mesh
names, and any material/scale differences. Stop after the proof passes or at
the first failed rung; do not broaden the scene edit.
```

OpenAI's Astra guidance favors specific workflow skills with short descriptions and progressive disclosure, warns against contradictory or itinerary-like skill sets, and recommends defining completion because Astra may otherwise return after a first pass.[16] For this workflow, one short Blender asset-pipeline skill is preferable to overlapping modeling, rendering, exporting, and game-import skills that compete for control.

## Security caveats

- Blender's official Lab page warns that generated code is executed without guards protecting against deletion or data exfiltration and recommends a virtual machine or a system without sensitive information.[4]
- **Source-derived:** the add-on's `WeakSandboxForLLM` says it is not a real sandbox and can be bypassed. It blocks only `sys.exit()` and a small operator list; it does not provide filesystem or network isolation.[17]
- **Source-derived:** `execute_blender_code` has access to `bpy` and carries MCP `destructiveHint=True`.[18]
- Codex can prompt for MCP tools that advertise side effects, but an approval is a decision gate, not containment. OpenAI also states that MCP/app traffic is outside the command network proxy.[19]
- **Source-derived:** the local add-on protocol has no visible authentication or encryption layer. Keep it on loopback; do not set `BLENDER_MCP_HOST` to a network interface without a separate trusted tunnel and access control.[8][9]
- Tool annotations are advisory metadata. The render implementation writes a file while currently advertising read-only behavior, so per-tool prompting or a disposable environment is safer than trusting annotations alone.[12]
- Treat `.blend` files and external assets as active content. Blender's save/open APIs expose script-execution controls, and linked files, drivers, handlers, and add-ons expand the trust boundary.[11]

## Known gaps and unresolved questions

- The proof ladder was subsequently executed against a live headless Blender instance. Save, render, export, and Three.js import evidence is recorded in `artifacts/blender-mcp/connection-proof.md`; GUI-only MCP tools remain unproven.
- The official server has dedicated inspection and render tools but no dedicated save or glTF export tool in the inspected revision. Those operations therefore require arbitrary Python and a broader trust grant than ideal.
- The Lab page offers release `v1.0.3`, while the inspected default-branch manifest and `pyproject.toml` still report `1.0.2`. Confirm the installed add-on/server pair rather than inferring it from one metadata file.[5][20]
- OpenAI's three cited Astra articles do not expose publication or update dates in their fetched page content. They were accessed 2026-09-18; HTTP cache metadata was not treated as publication metadata.
- The Three.js citation is a narrow first-party exception to the requested OpenAI/Blender source set, necessary to substantiate the requested Three.js import step.
- A loaded GLB does not establish acceptable game performance. Define project-specific limits for triangle count, draw calls/material batches, texture memory, animation count, and bounding dimensions before declaring the asset production-ready.

## Sources

1. OpenAI, [Building games with Astra](https://developers.openai.com/blog/how-to-build-games-with-astra), publication/update date not displayed, accessed 2026-09-18.
2. OpenAI, [Architectural visualization with Astra](https://developers.openai.com/blog/architectural-visualization-with-astra), publication/update date not displayed, accessed 2026-09-18.
3. OpenAI, [Model Context Protocol](https://developers.openai.com/codex/mcp), accessed 2026-09-18.
4. Blender Foundation, [MCP Server](https://www.blender.org/lab/mcp-server/), published 2026-03-30, modified 2026-09-11, accessed 2026-09-18.
5. Blender Foundation, [blender_mcp releases](https://projects.blender.org/lab/blender_mcp/releases), `v1.0.3` tag timestamp 2026-09-11, inspected 2026-09-18.
6. Blender Foundation, [WordPress page metadata for `mcp-server`](https://www.blender.org/wp-json/wp/v2/pages?slug=mcp-server), accessed 2026-09-18.
7. Ahuja et al., [mcp-for-blender README](https://github.com/ahujasid/mcp-for-blender#readme), third-party project, accessed 2026-09-18.
8. Blender Foundation, [`connection.py` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/mcp/blmcp/tools_helpers/connection.py), updated 2026-09-11.
9. Blender Foundation, [`mcp_to_blender_server.py` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/addon/blender_mcp_addon/mcp_to_blender_server.py), updated 2026-09-11.
10. Blender Foundation, [`prompts.yml` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/mcp/blmcp/data/prompts.yml), updated 2026-09-11.
11. Blender Foundation, [Blender 5.2 `bpy.ops.wm` API](https://docs.blender.org/api/5.2/bpy.ops.wm.html), accessed 2026-09-18.
12. Blender Foundation, [`render_viewport_to_path_toolcode.py` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/mcp/blmcp/tools/render_viewport_to_path_toolcode.py), updated 2026-09-11.
13. Blender Foundation, [Blender 5.2 glTF 2.0 manual](https://docs.blender.org/manual/en/5.2/addons/scene_gltf2.html), accessed 2026-09-18.
14. Blender Foundation, [Blender 5.2 `bpy.ops.export_scene` API](https://docs.blender.org/api/5.2/bpy.ops.export_scene.html), accessed 2026-09-18.
15. Three.js, [official `GLTFLoader` documentation source](https://github.com/mrdoob/three.js/blob/dev/docs/pages/GLTFLoader.html), accessed 2026-09-18.
16. OpenAI, [Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra), publication/update date not displayed, accessed 2026-09-18.
17. Blender Foundation, [`weak_sandbox.py` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/addon/blender_mcp_addon/weak_sandbox.py), updated 2026-09-11.
18. Blender Foundation, [`execute_blender_code.py` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/mcp/blmcp/tools/execute_blender_code.py), updated 2026-09-11.
19. OpenAI, [Agent approvals and security](https://developers.openai.com/codex/agent-approvals-security), accessed 2026-09-18.
20. Blender Foundation, [`mcp/pyproject.toml` at `ff54e4d`](https://projects.blender.org/lab/blender_mcp/src/commit/ff54e4d8f6b09502f2f466189cca0e52b4a91643/mcp/pyproject.toml), updated 2026-09-11.
