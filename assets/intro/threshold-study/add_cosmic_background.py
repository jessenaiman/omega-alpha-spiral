"""Use the existing approved intro plate behind the live study; no source art edits."""
import bpy
from mathutils import Vector
from pathlib import Path

s=bpy.data.scenes.get('Threshold_Study_01')
if s is None:
    raise RuntimeError('Expected live threshold study. No other scene will be modified.')
if bpy.context.screen.is_animation_playing:
    bpy.ops.screen.animation_cancel(restore_frame=False)
bpy.context.window.scene=s
image_path=Path('C:/SpiralDrive/omega-alpha-spiral/assets/intro/optical-variations/optical-a-distant.webp')
if not image_path.is_file():
    raise RuntimeError('Approved intro image missing')
image=bpy.data.images.load(str(image_path),check_existing=True)
image.pack()
s.render.resolution_x=image.size[0]
s.render.resolution_y=image.size[1]
s.render.resolution_percentage=100
camera=s.camera
if camera is None:
    raise RuntimeError('Study camera missing')
# Construct a plate in camera coordinates, beyond all doorway fragments.
frame=camera.data.view_frame(scene=s)
distance=40.0
local=[p*(distance/abs(p.z))*1.002 for p in frame]
verts=[camera.matrix_world @ p for p in local]
name='Threshold_Cosmic_Background'
ob=bpy.data.objects.get(name)
if ob is None:
    mesh=bpy.data.meshes.new(name+'_mesh')
    mesh.from_pydata(verts,[],[(0,1,2,3)])
    mesh.update()
    uv=mesh.uv_layers.new(name='PlateUV')
    xmin,xmax=min(p.x for p in local),max(p.x for p in local)
    ymin,ymax=min(p.y for p in local),max(p.y for p in local)
    for loop in mesh.loops:
        p=local[loop.vertex_index]
        uv.data[loop.index].uv=((p.x-xmin)/(xmax-xmin),(p.y-ymin)/(ymax-ymin))
    ob=bpy.data.objects.new(name,mesh)
    bpy.data.collections['Threshold_Preview_Only'].objects.link(ob)
    mat=bpy.data.materials.new('Threshold_Existing_Intro_Plate')
    mat.use_nodes=True
    nodes=mat.node_tree.nodes
    nodes.clear()
    tex=nodes.new('ShaderNodeTexImage')
    tex.image=image
    tex.interpolation='Linear'
    emit=nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value=1.0
    output=nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(tex.outputs['Color'],emit.inputs['Color'])
    mat.node_tree.links.new(emit.outputs[0],output.inputs['Surface'])
    mesh.materials.append(mat)
ob['preview_only']=True
ob['source_image']=str(image_path)
ob['purpose']='Existing intro plate; static background, not a new art asset'
if hasattr(ob,'visible_shadow'):
    ob.visible_shadow=False
s.view_settings.view_transform='Standard'
# Show the end state briefly to judge the overlay; timing pass follows separately.
s.frame_set(160)
for a in bpy.context.window.screen.areas:
    if a.type=='VIEW_3D':
        a.spaces.active.region_3d.view_perspective='CAMERA'
        a.spaces.active.shading.type='MATERIAL'
        a.spaces.active.shading.use_scene_world=True
        a.spaces.active.shading.use_scene_lights=True
        a.tag_redraw()
result={'scene':s.name,'background_object':ob.name,'image':image.filepath,'image_dimensions':list(image.size),'frame':s.frame_current,'original_scene_objects':[o.name for o in bpy.data.scenes['Scene'].objects]}
