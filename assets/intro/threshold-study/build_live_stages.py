"""Visible, bounded steps for the doorway study. Existing scenes stay intact."""
import bpy
from pathlib import Path
from mathutils import Vector

SOURCE = Path('C:/SpiralDrive/omega-alpha-spiral/assets/intro/threshold-study/build_threshold.py')
KEY = 'omega_threshold_live_build'

def stage_one():
    if KEY in bpy.app.driver_namespace:
        raise RuntimeError('Live study already started; inspect before rerunning.')
    code = SOURCE.read_text(encoding='utf-8').split('# Wide clear opening')[0]
    ns = {'__name__': '__threshold_study__'}
    exec(compile(code, str(SOURCE), 'exec'), ns)
    bpy.app.driver_namespace[KEY] = ns
    scene, meshes, pieces = ns['scene'], ns['meshes'], ns['pieces']
    examples = []
    for kind, loc in [('bar',(-1.45,0,0)),('corner',(-.25,0,-.35)),('chip',(1.35,0,0))]:
        ob = bpy.data.objects.new('Kit_Preview_'+kind, meshes[kind])
        pieces.objects.link(ob)
        ob.location=loc
        mod=ob.modifiers.new('Visible_edge_bevel','BEVEL')
        mod.width=.012
        mod.segments=1
        mod.material=2
        examples.append(ob)
    ns['examples']=examples
    for area in bpy.context.window.screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active
            space.region_3d.view_perspective='PERSP'
            space.region_3d.view_location=(0,0,0)
            space.region_3d.view_distance=5.8
            space.region_3d.view_rotation=Vector((2.2,-9,3)).to_track_quat('Z','Y')
            space.shading.type='SOLID'
            space.shading.color_type='MATERIAL'
            space.shading.show_cavity=True
            space.overlay.show_overlays=False
            area.tag_redraw()
    ns['step']=1
    return {'step':1,'scene':scene.name,'visible_kit':[o.name for o in examples], 'original_scene_preserved':ns['original'].name}

def stage_two():
    ns=bpy.app.driver_namespace[KEY]
    if ns.get('step')!=1:
        raise RuntimeError('Expected kit stage')
    source=SOURCE.read_text(encoding='utf-8')
    code=source.split('# Wide clear opening')[1].split('# Modest deep-space points')[0]
    # Only our temporary kit previews are removed, never any user object.
    for ob in ns['examples']:
        bpy.data.objects.remove(ob, do_unlink=True)
    exec(compile('# Wide clear opening'+code,str(SOURCE),'exec'),ns)
    ns['scene'].frame_set(1)
    for area in bpy.context.window.screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_location=(0,0,2.4)
            area.spaces.active.region_3d.view_distance=15
            area.tag_redraw()
    ns['step']=2
    return {'step':2,'scene':ns['scene'].name,'fragment_count':len(ns['created']),'frame':1}

def stage_three():
    ns=bpy.app.driver_namespace[KEY]
    if ns.get('step')!=2:
        raise RuntimeError('Expected scattered stage')
    code=SOURCE.read_text(encoding='utf-8').split('# Modest deep-space points')[1]
    exec(compile('# Modest deep-space points'+code,str(SOURCE),'exec'),ns)
    ns['step']=3
    # Leave animation stopped at the assembled frame; owner can scrub or play.
    return ns['result']
