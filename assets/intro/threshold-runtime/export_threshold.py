"""Export the saved study non-destructively; never save the source blend.
Run with Blender --background threshold-study-v02-slow.blend --python this_file.
Driver/constraint transforms are sampled before creating a separate export scene.
The 300-second study becomes a normalized clip; narrative owns runtime timing.
"""
import bpy
import json
import hashlib
from pathlib import Path

OUT = Path(__file__).resolve().parent
source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.data.scenes['Threshold_Study_01']
bpy.context.window.scene = scene
objects = sorted([o for o in scene.objects if o.type == 'MESH'
    and any(c.name == 'Threshold_Pieces' for c in o.users_collection)
    and not o.get('preview_only', False)], key=lambda o: o.name)
assert objects, 'No threshold meshes found'
clock = bpy.data.objects.get('Threshold_Formation_Clock')
if clock:
    clock['paused'] = False
    clock['held_seconds'] = 0.0
    clock['offset_seconds'] = 0.0
# Two-and-a-half-second normalized clip with 61 poses, sampled from 300 seconds.
poses = {o.name: [] for o in objects}
for step in range(61):
    scene.frame_set(1 + step * 120)
    graph = bpy.context.evaluated_depsgraph_get()
    for obj in objects:
        poses[obj.name].append(obj.evaluated_get(graph).matrix_world.copy())
scene.frame_set(7201)
graph = bpy.context.evaluated_depsgraph_get()
meshes = {o.name: bpy.data.meshes.new_from_object(o.evaluated_get(graph), depsgraph=graph) for o in objects}
material_report = []
for mat in {m for mesh in meshes.values() for m in mesh.materials if m}:
    nodes = mat.node_tree.nodes if mat.use_nodes else []
    material_report.append({'name': mat.name, 'nodes': [n.type for n in nodes],
                            'hasPrincipled': any(n.type == 'BSDF_PRINCIPLED' for n in nodes)})
export_scene = bpy.data.scenes.new('Threshold_Runtime_Export')
bpy.context.window.scene = export_scene
export_scene.render.fps = 24
export_scene.frame_start = 1
export_scene.frame_end = 61
for original in objects:
    clone = bpy.data.objects.new(original.name + '_Runtime', meshes[original.name])
    export_scene.collection.objects.link(clone)
    clone.rotation_mode = 'QUATERNION'
    clone['source_object'] = original.name
    for step, matrix in enumerate(poses[original.name]):
        clone.location, clone.rotation_quaternion, clone.scale = matrix.decompose()
        for path in ('location', 'rotation_quaternion', 'scale'):
            clone.keyframe_insert(data_path=path, frame=step + 1)
    clone.select_set(True)
export_scene.frame_set(1)
output = OUT / 'threshold.glb'
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB',
    use_selection=True, use_active_scene=True, export_apply=False,
    export_animations=True, export_animation_mode='SCENE',
    export_frame_range=True, export_frame_step=1,
    export_cameras=False, export_lights=False,
    export_draco_mesh_compression_enable=False)
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
report = {'source': str(source), 'sourceSha256': source_hash,
          'sourceUnchanged': True, 'output': str(output), 'bytes': output.stat().st_size,
          'objects': len(objects), 'sampledPoses': 61, 'sourceSeconds': 300,
          'clipSeconds': 2.5, 'blender': bpy.app.version_string,
          'materials': material_report,
          'notes': 'Door geometry, bevels, insets and sampled motion only. No preview stars, camera, background or compositor exported. Three.js owns the starfield and early primitive transition. Runtime provides lighting.'}
(OUT / 'export-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('EXPORT_RESULT', json.dumps(report))
