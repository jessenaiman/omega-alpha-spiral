"""Five-minute live Blender study; preserve source art and other scenes.
Only modifies Threshold_Study_01 and its owned objects. Not game integration.
"""
import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector

OUT = Path('C:/SpiralDrive/omega-alpha-spiral/assets/intro/threshold-study')
s = bpy.data.scenes.get('Threshold_Study_01')
if s is None or bpy.context.scene != s:
    raise RuntimeError('Expected active Threshold_Study_01; refusing another scene')
if bpy.data.objects.get('Threshold_Formation_Clock'):
    raise RuntimeError('Slow formation already exists; inspect rather than rebuild')
backup = OUT / 'threshold-before-slow-motion.blend'
output = OUT / 'threshold-study-v02-slow.blend'
if backup.exists() or output.exists():
    raise RuntimeError('Refusing to overwrite an existing checkpoint')
if bpy.context.screen.is_animation_playing:
    bpy.ops.screen.animation_cancel(restore_frame=False)
bpy.ops.wm.save_as_mainfile(filepath=str(backup), copy=True)
other_scenes = {sc.name: sorted(o.name for o in sc.objects) for sc in bpy.data.scenes if sc != s}
s.frame_set(160)
parts = [o for o in s.objects if 'assembled_position' in o]
assert len(parts) == 17
final = {o.name: (o.location.copy(), o.rotation_euler.copy(), o.scale.copy()) for o in parts}
preview = bpy.data.collections['Threshold_Preview_Only']
fx = bpy.data.collections.new('Threshold_Slow_Sparkles')
s.collection.children.link(fx)
clock = bpy.data.objects.new('Threshold_Formation_Clock', None)
preview.objects.link(clock)
clock['paused'] = False
clock['held_seconds'] = 0.0
clock['offset_seconds'] = 0.0
clock['active_seconds'] = 0.0
clock['purpose'] = 'Preview only. Pause via pause_preview.py; game question hookup is separate.'
s.render.fps = 24
s.render.fps_base = 1.0
s.frame_start = 1
s.frame_end = 7201
s['formation_duration_seconds'] = 300
s['question_pause_contract'] = 'Freeze formation at complete question/options until an answer; no reading deadline.'
s['game_pause_integration'] = 'NOT IMPLEMENTED: Blender preview only'

def driver(owner, path, expression, variables, index=None):
    fc = owner.driver_add(path) if index is None else owner.driver_add(path, index)
    d = fc.driver
    d.type = 'SCRIPTED'
    for name, target, prop in variables:
        v = d.variables.new()
        v.name = name
        v.type = 'SINGLE_PROP'
        v.targets[0].id = target
        v.targets[0].data_path = prop
    d.expression = expression
    return fc

cv = [('p', clock, '["paused"]'), ('h', clock, '["held_seconds"]'), ('o', clock, '["offset_seconds"]')]
driver(clock, '["active_seconds"]', 'max(0,min(300,h if p else (frame-1)/24-o))', cv)
tv = [('t', clock, '["active_seconds"]')]

def smooth(a, b):
    u = f'max(0,min(1,(t-{a:.5f})/{b-a:.5f}))'
    return f'({u}*{u}*(3-2*{u}))'

rng = random.Random(472)
cam = s.camera
q = cam.matrix_world.to_quaternion()
right, up, forward = (q @ Vector(v) for v in [(1,0,0), (0,1,0), (0,0,-1)])
center = Vector((0,0,2.4))
for ob in parts:
    target, rotation, scale = final[ob.name]
    ob.animation_data_clear()
    phase = rng.uniform(0, math.tau)
    speed = rng.choice([-1,1]) * rng.uniform(.003, .009)
    rx, rz, depth = rng.uniform(3.0, 5.7), rng.uniform(1.7, 3.6), rng.uniform(.4, 1.6)
    start, end = rng.uniform(268, 282), rng.uniform(293, 300)
    ob['gather_start_seconds'], ob['gather_end_seconds'] = start, end
    ob['gather'] = 0.0
    ob['materialize'] = 0.0
    driver(ob, '["gather"]', smooth(start, end), tv)
    driver(ob, '["materialize"]', smooth(225, 283), tv)
    vv = tv + [('g', ob, '["gather"]'), ('m', ob, '["materialize"]')]
    for axis in range(3):
        drift = (f'({center[axis]:.6f}+{right[axis]*rx:.6f}*cos(t*{speed:.6f}+{phase:.6f})'
                 f'+{up[axis]*rz:.6f}*sin(t*{speed*.79:.6f}+{phase*1.37:.6f})'
                 f'+{forward[axis]*depth:.6f}*sin(t*{speed*.61:.6f}+{phase*.7:.6f}))')
        driver(ob, 'location', f'(1-g)*{drift}+g*{target[axis]:.6f}', vv, axis)
        r0, rs = rng.uniform(-2.5, 2.5), rng.uniform(-.013, .013)
        driver(ob, 'rotation_euler', f'(1-g)*({r0:.6f}+t*{rs:.6f})+g*{rotation[axis]:.6f}', vv, axis)
        driver(ob, 'scale', f'{scale[axis]:.6f}*(0.018+0.982*m)', vv, axis)

# Metallic faces receive actual moving specular light, not only emission.
for name in ['Threshold_Ink_Ceramic', 'Threshold_Cold_Phosphor_Face', 'Threshold_Worn_Silver_Edge']:
    mat = bpy.data.materials.get(name)
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Metallic'].default_value = .82
    p.inputs['Roughness'].default_value = .20 if 'Edge' in name else .27
    p.inputs['Emission Strength'].default_value = .035

palette = [(0.55,.78,1.0), (1.0,.53,.15), (1.0,.16,.07)]
materials = []
for i, col in enumerate(palette):
    mat = bpy.data.materials.new(f'Threshold_Twinkle_{i}')
    mat.diffuse_color = (*col, 1)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*col,1)
    p.inputs['Emission Color'].default_value = (*col,1)
    driver(p.inputs['Emission Strength'], 'default_value', f'2.5+4*pow(0.5+0.5*sin(frame/24*0.43+{i*2.1}),8)', [])
    materials.append(mat)
    light = bpy.data.lights.new(f'Threshold_Star_Reflection_{i}', 'AREA')
    light.energy = 230
    light.color = col
    light.shape = 'DISK'
    light.size = .35
    ob = bpy.data.objects.new(light.name, light)
    fx.objects.link(ob)
    ob.location = center + right*((i-1)*3.8) - forward*4 + up*2
    ob.rotation_euler = (center-ob.location).to_track_quat('-Z','Y').to_euler()
    for axis in range(3):
        origin = ob.location[axis]
        driver(ob, 'location', f'{origin:.6f}+{right[axis]*1.2:.6f}*sin(t*0.017+{i*2.1})', tv, axis)

# Fine camera-facing spark crosses; independent drift, phase and scale.
# A small subset follows the forming fragments without inheriting their tiny scale.
verts = [(-1,0,0),(0,.12,0),(1,0,0),(0,-.12,0),(-.1,0,0),(0,.85,0),(.1,0,0),(0,-.85,0)]
for i in range(80):
    me = bpy.data.meshes.new(f'Threshold_SparkMesh_{i:02d}')
    me.from_pydata(verts, [], [(0,1,2,3),(4,5,6,7)])
    me.materials.append(materials[i%3])
    ob = bpy.data.objects.new(f'Threshold_Spark_{i:02d}', me)
    fx.objects.link(ob)
    ob['preview_only'] = True
    ob.rotation_euler = q.to_euler()
    phase = rng.uniform(0, math.tau)
    r = rng.uniform(.009,.035)
    if i < len(parts):
        follow = ob.constraints.new('COPY_LOCATION')
        follow.target = parts[i]
        r = .025
    else:
        x, z, d = rng.uniform(-6.5,6.5), rng.uniform(-3.6,3.6), rng.uniform(-2,4)
        origin = center + right*x + up*z + forward*d
        for axis in range(3):
            driver(ob, 'location', f'{origin[axis]:.6f}+{right[axis]*.42:.6f}*sin(t*.012+{phase})+{up[axis]*.29:.6f}*cos(t*.008+{phase})', tv, axis)
    for axis in range(3):
        driver(ob, 'scale', f'{r}*(0.45+0.55*pow(0.5+0.5*sin(frame/24*.31+{phase}),6))', [], axis)

# Render glow; source plate remains unchanged.
tree = bpy.data.node_groups.new('Threshold_Starlight_Compositor', 'CompositorNodeTree')
if hasattr(s, 'compositing_node_group'):
    s.compositing_node_group = tree
    tree.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    composite = tree.nodes.new('NodeGroupOutput')
else:
    s.use_nodes = True
    tree = s.node_tree
    composite = next((n for n in tree.nodes if n.type == 'COMPOSITE'), None)
    if composite is None:
        composite = tree.nodes.new('CompositorNodeComposite')
nodes, links = tree.nodes, tree.links
render_node = nodes.new('CompositorNodeRLayers')
glow = nodes.new('CompositorNodeGlare')
glow.name = 'Threshold_Subtle_Starlight_Glow'
if hasattr(glow, 'glare_type'):
    glow.glare_type = 'FOG_GLOW'
    glow.quality = 'MEDIUM'
else:
    glow.inputs['Type'].default_value = 'Fog Glow'
    glow.inputs['Quality'].default_value = 'Medium'
if hasattr(glow, 'threshold'):
    glow.threshold = 2.0
    glow.size = 7
    glow.mix = -.65
else:
    for name, value in [('Threshold', 2.0), ('Strength', .35), ('Size', .25)]:
        socket = glow.inputs.get(name)
        if socket is not None:
            socket.default_value = value
links.new(render_node.outputs['Image'], glow.inputs['Image'])
links.new(glow.outputs['Image'], composite.inputs['Image'])
for marker in list(s.timeline_markers):
    s.timeline_markers.remove(marker)
for label, seconds in [('SPARKS',0),('DRIFT',90),('MATERIALIZING',225),('LATE GATHER',268),('THRESHOLD',300)]:
    s.timeline_markers.new(label, frame=1+seconds*24)
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.region_3d.view_perspective = 'CAMERA'
        space.region_3d.view_camera_zoom = 9
        space.shading.type = 'MATERIAL'
        space.shading.use_scene_lights = True
        space.shading.use_scene_world = True
        if hasattr(space.shading, 'use_compositor'):
            space.shading.use_compositor = 'CAMERA'
        area.tag_redraw()
s.frame_set(1)
for name, objects in other_scenes.items():
    assert sorted(o.name for o in bpy.data.scenes[name].objects) == objects
bpy.ops.wm.save_as_mainfile(filepath=str(output), copy=True)
print(json.dumps({'scene':s.name,'blend':str(output),'backup':str(backup),'pieces':len(parts),'sparkles':80,'duration_seconds':300,'frames':[s.frame_start,s.frame_end],'game_integration':False,'blender':bpy.app.version_string,'binary':bpy.app.binary_path}))
