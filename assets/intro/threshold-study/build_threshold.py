"""Author the approved three-piece doorway study in a NEW scene.
Run in the visible Blender through MCP. No existing scene/object is removed.
Frames 1-48: scattered; 49-144: gather; 145-192: threshold hold.
"""
import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector

OUT = Path('C:/SpiralDrive/omega-alpha-spiral/assets/intro/threshold-study')
OUT.mkdir(parents=True, exist_ok=True)
NAME = 'Threshold_Study_01'
if bpy.data.scenes.get(NAME):
    raise RuntimeError('Study already exists; inspect it instead of duplicating or replacing it.')
original = bpy.context.scene
original_objects = [o.name for o in original.objects]
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
scene['purpose'] = 'Issue 34: terminal fragments become a doorway; first asset study, no narrative changes'
scene['original_scene'] = original.name
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1280
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 192
scene.world = bpy.data.worlds.new('Threshold_World')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.005, 0.009, 0.025, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.23
scene.view_settings.view_transform = 'AgX'

pieces = bpy.data.collections.new('Threshold_Pieces')
scene.collection.children.link(pieces)
stage = bpy.data.collections.new('Threshold_Preview_Only')
scene.collection.children.link(stage)

def material(name, color, metallic=0.0, roughness=0.45, emission=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = emission
    return m

shell = material('Threshold_Ink_Ceramic', (0.025, 0.045, 0.065), 0.45, 0.33)
face = material('Threshold_Cold_Phosphor_Face', (0.23, 0.40, 0.46), 0.35, 0.38, 0.10)
edge = material('Threshold_Worn_Silver_Edge', (0.36, 0.43, 0.47), 0.65, 0.30)
blue = material('Threshold_Signal_BlueWhite', (0.32, 0.73, 0.95), 0.05, 0.36, 2.8)
amber = material('Threshold_Signal_Amber', (1.0, 0.40, 0.09), 0.12, 0.35, 2.0)

# 2D X/Z silhouettes extruded along Y. Counterclockwise profiles.
profiles = {
    'bar': [(-0.11,-0.75),(0.11,-0.75),(0.11,0.75),(-0.11,0.75)],
    'corner': [(0,0),(0.78,0),(0.78,0.19),(0.19,0.19),(0.19,0.79),(0,0.79)],
    'chip': [(-0.29,-0.27),(0.15,-0.30),(0.32,-0.11),(0.23,0.04),(0.30,0.31),(-0.26,0.26)],
}
meshes = {}
for kind, poly in profiles.items():
    n = len(poly)
    depth = 0.14 if kind != 'chip' else 0.07
    verts = [(x, -depth/2, z) for x,z in poly] + [(x, depth/2, z) for x,z in poly]
    faces = [tuple(range(n)), tuple(reversed(range(n,2*n)))]
    faces += [(i, i+n, (i+1)%n+n, (i+1)%n) for i in range(n)]
    mesh = bpy.data.meshes.new('Threshold_Kit_' + kind)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for m in (shell, face, edge):
        mesh.materials.append(m)
    mesh.polygons[0].material_index = 1
    meshes[kind] = mesh

rng = random.Random(472)
created = []

def make_piece(kind, name, target, rot=(0,0,0), scale=(1,1,1), signal=False):
    ob = bpy.data.objects.new(name, meshes[kind])
    pieces.objects.link(ob)
    ob['kit_piece'] = kind
    ob['assembled_position'] = list(target)
    ob['preview_only'] = False
    bevel = ob.modifiers.new('Tiny_single_segment_edge', 'BEVEL')
    bevel.width = 0.012
    bevel.segments = 1
    bevel.affect = 'EDGES'
    bevel.material = 2
    ob.scale = scale
    # Initial scattering does not obscure the final open center.
    side = -1 if target[0] < 0 else 1
    scattered = (target[0] + side*rng.uniform(1.1,3.7), rng.uniform(-1.6,2.5), target[2] + rng.uniform(-1.3,1.6))
    spin = tuple(rot[i] + rng.uniform(-0.9,0.9) for i in range(3))
    start = rng.randint(48,69)
    end = rng.randint(119,144)
    ob.location = scattered
    ob.rotation_euler = spin
    ob.keyframe_insert('location', frame=1)
    ob.keyframe_insert('rotation_euler', frame=1)
    ob.location = Vector(scattered) + Vector((0.09*side,0.08,0.12))
    ob.keyframe_insert('location', frame=start)
    ob.keyframe_insert('rotation_euler', frame=start)
    ob.location = target
    ob.rotation_euler = rot
    ob.keyframe_insert('location', frame=end)
    ob.keyframe_insert('rotation_euler', frame=end)
    ob.keyframe_insert('location', frame=192)
    ob.keyframe_insert('rotation_euler', frame=192)
    if signal and kind == 'bar':
        # Inset terminal-cursor stripe shares the parent animation.
        me = bpy.data.meshes.new(name + '_inset_mesh')
        me.from_pydata([(-.022,-.073,-.57),(.022,-.073,-.57),(.022,-.073,.48),(-.022,-.073,.48)], [], [(0,1,2,3)])
        me.materials.append(amber if target[0] < 0 else blue)
        line = bpy.data.objects.new(name + '_phosphor_inset', me)
        pieces.objects.link(line)
        line.parent = ob
        line['preview_only'] = False
    created.append(ob)
    return ob

# Wide clear opening, discontinuous jambs and intentionally mismatched joins.
make_piece('corner','Threshold_Left_Foot',(-1.62,0,0.20),signal=False)
make_piece('bar','Threshold_Left_Lower',(-1.53,0.035,1.82),scale=(1,1,1.07),signal=True)
make_piece('bar','Threshold_Left_Upper',(-1.49,-0.035,3.39),rot=(0,0.018,0.016),scale=(1,1,0.90),signal=True)
make_piece('corner','Threshold_Left_Crown',(-1.62,0.015,4.58),rot=(0,math.pi/2,0))
make_piece('bar','Threshold_Lintel_A',(-0.52,0.015,4.48),rot=(0,math.pi/2,0),scale=(0.95,1,0.70),signal=True)
make_piece('bar','Threshold_Lintel_B',(0.64,0.09,4.53),rot=(0,math.pi/2,0.02),scale=(0.90,1,0.60),signal=True)
make_piece('corner','Threshold_Right_Crown',(1.63,0,4.56),rot=(0,math.pi,0))
make_piece('bar','Threshold_Right_Upper',(1.54,0.055,3.24),scale=(1,1,1.04),signal=True)
make_piece('bar','Threshold_Right_Lower',(1.60,-0.04,1.54),rot=(0,-0.02,-0.016),scale=(1,1,0.92),signal=True)
# The right foot deliberately remains missing, echoed by a loose nearby corner.
for i, target in enumerate([(-2.4,-0.8,.48),(2.8,.7,3.95),(-2.9,1.2,4.62),(2.15,-1.1,.58),(-3.5,2.0,2.1),(3.65,1.7,1.85),(.85,1.5,5.6),(-.9,2.4,-.35)]):
    kind = 'corner' if i == 3 else 'chip'
    ob = make_piece(kind, 'Threshold_Stranded_%02d'%i, target, rot=(rng.uniform(-.6,.6),rng.uniform(-1.2,1.2),rng.uniform(-.5,.5)), scale=(.65,.65,.65) if kind=='corner' else (1,1,1))
    ob['role'] = 'stranded fragment; not collision'

# Modest deep-space points in the PREVIEW collection, not exported as kit.
star = material('Threshold_Preview_Starlight',(0.28,0.40,0.62),0,1,1.1)
verts, faces = [], []
for i in range(65):
    x,y,z = rng.uniform(-14,14),rng.uniform(5,9),rng.uniform(-7,14)
    r = rng.uniform(.008,.026)
    j=len(verts)
    verts += [(x-r,y,z),(x,y,z+r),(x+r,y,z),(x,y,z-r)]
    faces.append((j,j+1,j+2,j+3))
me=bpy.data.meshes.new('Threshold_Preview_Points_mesh')
me.from_pydata(verts,[],faces)
me.materials.append(star)
stars=bpy.data.objects.new('Threshold_Preview_Points',me)
stage.objects.link(stars)
stars['preview_only']=True

def point_at(ob, target):
    ob.rotation_euler = (Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

cam_data = bpy.data.cameras.new('Threshold_Study_Camera')
cam = bpy.data.objects.new('Threshold_Study_Camera',cam_data)
stage.objects.link(cam)
cam.location=(6.1,-14.8,7.1)
point_at(cam,(0,0,2.4))
cam_data.type='PERSP'
cam_data.lens=48
scene.camera=cam
for name,loc,power,col,size in [
    ('Threshold_Key',(-3,-4,7),1100,(.52,.74,1),6),
    ('Threshold_Rim',(4,2,5),1550,(.35,.64,1),4),
    ('Threshold_Amber',(-4,0,2),900,(1,.33,.08),3),
]:
    ld=bpy.data.lights.new(name,'AREA')
    ld.energy=power
    ld.color=col
    ld.shape='DISK'
    ld.size=size
    lo=bpy.data.objects.new(name,ld)
    stage.objects.link(lo)
    lo.location=loc
    point_at(lo,(0,0,2.5))

scene.timeline_markers.new('SCATTERED',frame=1)
scene.timeline_markers.new('GATHER',frame=60)
scene.timeline_markers.new('THRESHOLD',frame=144)
scene.frame_set(160)
# Frame the new study in the visible viewport, without mouse/keyboard control.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active
            space.region_3d.view_perspective='CAMERA'
            space.overlay.show_overlays=False
            space.shading.type='MATERIAL'
            space.shading.use_scene_world=False
            space.shading.use_scene_lights=False
            space.clip_end=250

assert [o.name for o in original.objects] == original_objects, 'Original objects changed'
scene.render.filepath=str(OUT/'threshold-assembled.png')
blend_path=OUT/'threshold-study-v01.blend'
if blend_path.exists():
    raise RuntimeError('Refusing to overwrite existing study file')
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), copy=True)
result = {
    'scene':scene.name,'original_scene':original.name,'original_objects_preserved':original_objects,
    'kit_meshes':list(meshes.keys()),'pieces':len(created),'scene_objects':len(scene.objects),
    'frames':[scene.frame_start,scene.frame_end],'current_frame':scene.frame_current,
    'blend_file':str(blend_path),'preview_only_collection':stage.name,
    'notes':'Asset study only; no reference textures, no narrative changes, no gameplay integration.'
}
(OUT/'build-report.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
