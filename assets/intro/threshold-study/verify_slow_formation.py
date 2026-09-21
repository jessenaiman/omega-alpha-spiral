import bpy, json
from pathlib import Path
BASE=Path('C:/SpiralDrive/omega-alpha-spiral/assets/intro/threshold-study')
s=bpy.context.scene
assert s.name=='Threshold_Study_01'
clock=s.objects['Threshold_Formation_Clock']
parts=sorted([o for o in s.objects if 'assembled_position' in o],key=lambda o:o.name)
exec(compile((BASE/'pause_preview.py').read_text(),str(BASE/'pause_preview.py'),'exec'))

def sample(seconds):
    s.frame_set(1+round(seconds*24))
    bpy.context.view_layer.update()
    return {'seconds':seconds,'active_seconds':float(clock['active_seconds']),'parts':{o.name:{'location':list(o.location),'rotation':list(o.rotation_euler),'scale':list(o.scale),'gather':float(o['gather'])} for o in parts}}

clock['paused']=False
clock['offset_seconds']=0.0
clock.update_tag()
samples=[sample(t) for t in [0,90,225,260,280,300]]
assert all(abs(x['active_seconds']-x['seconds'])<.001 for x in samples)
assert all(p['gather']==0 for x in samples[:4] for p in x['parts'].values())
assert all(p['gather']>.999 for p in samples[-1]['parts'].values())
assert all((o.location-__import__('mathutils').Vector(o['assembled_position'])).length<.0001 for o in parts)
assert samples[0]['parts']!=samples[1]['parts']
sample(245)
set_formation_paused(True,s)
before={o.name:(list(o.location),list(o.rotation_euler),list(o.scale)) for o in parts}
s.frame_set(1+275*24)
bpy.context.view_layer.update()
after={o.name:(list(o.location),list(o.rotation_euler),list(o.scale)) for o in parts}
assert before==after, 'Formation moved while paused'
assert abs(clock['active_seconds']-245)<.001
resume=set_formation_paused(False,s)
assert abs(resume['active_seconds']-245)<.001, 'Resume jumped forward'
s.frame_set(1+276*24)
assert abs(clock['active_seconds']-246)<.001
invalid=[]
for ob in s.objects:
    if ob.animation_data:
        invalid += [ob.name+':'+d.data_path for d in ob.animation_data.drivers if not d.driver.is_valid]
assert not invalid, invalid
clock['paused']=False
clock['held_seconds']=0.0
clock['offset_seconds']=0.0
clock.update_tag()
s.frame_set(1)
report={'samples':samples,'pause_test':'245 seconds held over 30 timeline seconds; no transform change','resume_test':'245 seconds resumed without jump, then advanced to 246','invalid_object_drivers':invalid,'duration_seconds':(s.frame_end-s.frame_start)/24,'blender':bpy.app.version_string,'game_question_hookup':False}
(BASE/'slow-formation-verification.json').write_text(json.dumps(report,indent=2))
# Keep pause instructions inside the saved study as well as on disk.
text=bpy.data.texts.get('Threshold_Pause_Preview.py') or bpy.data.texts.new('Threshold_Pause_Preview.py')
text.clear()
text.write((BASE/'pause_preview.py').read_text())
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'threshold-study-v02-slow.blend'),copy=True)
print(json.dumps({k:v for k,v in report.items() if k!='samples'}))
