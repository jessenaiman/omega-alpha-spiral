# Asset-work checkpoint before intro UI work

The design owner asked the lead to check in the outstanding asset work separately and focus on the boot-up. This checkpoint preserves the previous agent's work; it does not certify completion of its 3D pipeline.

Included: HF image driver, comparison notes, and existing probe/driver outputs. Generated `__pycache__` files are excluded.

Checks performed: Python AST parsing of `hf_image_to_glb.py` passed. The staged whitespace check flagged only a trailing blank line in the original OBJ-formatted probe; preserve its bytes as research evidence. No remote generation service was rerun by the lead.

Known issue: `artifacts/3d-assets/probe/frogleo-floor-one-concept-2.glb` is 304454 bytes of OBJ text (starts with `# https://github.com/mikedh/trimesh` and vertex records), not a binary GLB. The original filename and research report are preserved as received; do not load or ship it as GLB. During checkpoint preparation the other worker replaced its `.obj` driver output: the two current files under `artifacts/3d-assets/t2-driver/` have binary `glTF` headers (167468 and 19193296 bytes). Those headers were checked, not their full renderability. The upstream probe report's other claims are not independently verified.

Follow-up belongs to the asset workstream: validate formats from bytes, accurately classify/export artifacts, and reconcile report claims. This does not block the procedural boot-up visual pass in #32.
