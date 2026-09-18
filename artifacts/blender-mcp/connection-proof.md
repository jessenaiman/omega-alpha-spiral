# Astra + Blender MCP Connection Proof

Date: 2026-09-18

## Experience Contract

Move one authored player across one room, collect one authored object, and reach one authored exit. Keep the Blender source editable, export one GLB, expose named runtime state, and prove the journey through real browser controls.

## Client Connections

| Client | Proof | Result |
|---|---|---|
| OpenCode | `opencode mcp list` | `blender` connected |
| Claude Code | `claude mcp list` | `blender` connected |
| Codex | `codex mcp list` | `blender` enabled |
| Hermes | `hermes mcp test blender` | connected; 26 tools discovered |

OpenCode also reported the unrelated `gbrain` server as failed. Blender was unaffected.

## MCP Proof Ladder

| Rung | Official tool or boundary | Observed proof |
|---|---|---|
| Discover | MCP `tools/list` | 26 tools with schemas and annotations |
| API reference | `get_python_api_docs` | `bpy.ops.wm.save_as_mainfile`; `copy=True` confirmed |
| Baseline inspect | `get_blendfile_summary_path_info`, `get_objects_summary` | unsaved scene, 16 objects, flat collection |
| Preserve | `execute_blender_code` | baseline `.blend`, 106,079 bytes, active path unchanged |
| Build | `execute_blender_code` | 4 collections, 36 objects, 30 meshes, 6 materials |
| Independent inspect | `get_objects_summary`, `get_object_detail_summary` | player hierarchy and gem material/transform confirmed |
| Dedicated render | `render_thumbnail_to_path` | successful render in Blender MCP temp directory |
| Publish source | `execute_blender_code` | editable `.blend`, 114,760 bytes |
| Durable render | `execute_blender_code` | PNG, 284,896 bytes |
| Runtime export | `execute_blender_code` | GLB, 48,852 bytes, `glTF` magic |
| Asset inspect | `gltf-transform inspect` | glTF 2.0, Blender 5.2.40 exporter, 30 meshes, 6 materials |
| Runtime import | Three.js `GLTFLoader` | all contract nodes loaded; no console/page errors |
| Journey | Playwright real key presses | 6 steps, 1 gem, exit reached |

## Shared Vocabulary Demonstrated

| Term | Concrete proof in the fixture |
|---|---|
| Scene | `SCN_BasicMCPRoom` |
| Collection | `ENVIRONMENT`, `GAMEPLAY`, `LIGHTING`, `CAMERAS` |
| Object | `ACT_HeroBody`, `PICKUP_Gem`, `CAM_Isometric` |
| Data-block | `ACT_HeroBody_MESH`, `MAT_Energy`, `CAM_Isometric_DATA` |
| Parent/root | `ACT_HeroRoot` owns body, head, and eyes |
| Source asset | `assets/basic/source/basic-mcp-room.blend` |
| Runtime asset | `assets/basic/demo-kit.glb` |
| Runtime contract | `ACT_HeroRoot`, `PICKUP_Gem`, `EXIT_PortalRoot` |
| Commanded state | requested grid tile |
| Observed state | interpolated player transform reached arrival threshold |

The first rebuild exposed 73 Mesh data-blocks for 30 mesh objects. Cleanup now removes orphan Mesh, Camera, and Light data-blocks; the final source reports exactly 30 meshes, 1 camera, and 3 lights.

## Runtime Evidence

`artifacts/blender-mcp/basic-runtime-state.json` records:

- `loaded: true`
- tile `(3, 3)` after 6 real key presses
- 1 collected gem
- exit reached
- 30 named runtime meshes
- bounds approximately `4.32 × 1.20 × 3.90`
- 29 draw calls
- 348 triangles

The first completed-state screenshot caught state/visual divergence: completion flipped before the interpolated hero reached the exit. Completion now waits for observed transform arrival, and the same journey test passes.

## Verification

| Command | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run test:unit` | 101/101 pass |
| `npm run test:browser` | 11/11 pass |
| `npm run build` | pass; GLB emitted |

## Evidence Files

- `artifacts/blender-mcp/basic-scene.png` — Blender render
- `artifacts/blender-mcp/basic-runtime-complete.png` — completed Three.js journey
- `artifacts/blender-mcp/basic-runtime-state.json` — runtime state and counters
- `assets/basic/source/basic-kit-baseline.blend` — preserved baseline
- `assets/basic/source/basic-mcp-room.blend` — editable final source
- `assets/basic/demo-kit.glb` — runtime export
- `artifacts/research/astra-blender-mcp.md` — cited primary-source research

## Remaining Boundary

The end-to-end proof used a headless Blender bridge. That bridge was stopped after the proof, and a fresh GUI Blender session did not autostart a replacement on port 9876. UI-only tools therefore remain unproven: Blender-window/area screenshots, workspace switching, and viewport focusing.

## Primary Sources

- OpenAI, [Building games with Astra](https://developers.openai.com/blog/how-to-build-games-with-astra)
- Blender Foundation, [MCP Server](https://www.blender.org/lab/mcp-server/)
- OpenAI, [Model Context Protocol](https://developers.openai.com/codex/mcp)
