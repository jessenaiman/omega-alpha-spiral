"""Create a door-only study COPY; never save over the owner's original scene."""
import bpy
import hashlib
import json
from pathlib import Path

out = Path(__file__).resolve().parent
source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
output = out / 'threshold-door-only.blend'
assert not output.exists(), 'Refusing to overwrite the door-only authoring copy'
s = bpy.data.scenes['Threshold_Study_01']
bpy.context.window.scene = s
others = {sc.name: sorted(o.name for o in sc.objects) for sc in bpy.data.scenes if sc != s}
removed = []
for obj in list(s.objects):
    if obj.type == 'MESH' and obj.get('preview_only', False):
        assert obj.name.startswith('Threshold_'), 'Unowned preview object'
        removed.append(obj.name)
        bpy.data.objects.remove(obj, do_unlink=True)
# Clear the unused plate datablocks only when no scene still references them.
for collection, name in [(bpy.data.meshes, 'Threshold_Cosmic_Background_mesh'), (bpy.data.materials, 'Threshold_Existing_Intro_Plate')]:
    block = collection.get(name)
    if block is not None and block.users == 0:
        collection.remove(block)
s.render.film_transparent = True
s['background_contract'] = 'Door-only authoring. Cosmic background and twinkling particles belong to Three.js.'
s['early_shape_contract'] = 'Three.js tiny primitives transition into these authored meshes. No reading-time assembly.'
s.frame_set(s.frame_end)
assert others == {sc.name: sorted(o.name for o in sc.objects) for sc in bpy.data.scenes if sc != s}
assert not any(o.type == 'MESH' and o.get('preview_only', False) for o in s.objects)
bpy.ops.wm.save_as_mainfile(filepath=str(output))
# Reopen the exact saved target, not just an in-memory success check.
bpy.ops.wm.open_mainfile(filepath=str(output))
s = bpy.data.scenes['Threshold_Study_01']
bpy.context.window.scene = s
assert s.render.film_transparent
assert not any(o.type == 'MESH' and o.get('preview_only', False) for o in s.objects)
assert others == {sc.name: sorted(o.name for o in sc.objects) for sc in bpy.data.scenes if sc != s}
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
report = {'source': str(source), 'sourceSha256': source_hash, 'sourceUnchanged': True, 'output': str(output), 'reopenedVerified': True, 'removedPreviewMeshes': removed, 'doorMeshes': sum(o.type == 'MESH' for o in s.objects), 'filmTransparent': s.render.film_transparent, 'otherScenesUnchanged': True}
(out / 'door-only-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('DOOR_ONLY', json.dumps(report))
# Compact transparent still for a factual door-only visual check. Save file remains
# at its original quality settings; these lightweight render settings are temporary.
s.render.resolution_x = 960
s.render.resolution_y = 540
s.render.resolution_percentage = 100
s.cycles.samples = 12
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGBA'
s.render.filepath = str(out / 'door-only-preview.png')
bpy.ops.render.render(write_still=True)
