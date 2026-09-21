"""Blender-only formation pause/resume. Does not connect to game questions.
Run this file, then set_formation_paused(True) or set_formation_paused(False).
Sparkle brightness may breathe while formation position/rotation/scale holds.
"""
import bpy


def set_formation_paused(paused, scene=None):
    scene = scene or bpy.context.scene
    if scene.name != 'Threshold_Study_01':
        raise RuntimeError('Pause helper only owns Threshold_Study_01')
    clock = scene.objects['Threshold_Formation_Clock']
    wall_seconds = (scene.frame_current - 1) / (scene.render.fps / scene.render.fps_base)
    if paused and not clock['paused']:
        clock['held_seconds'] = max(0.0, min(300.0, wall_seconds - clock['offset_seconds']))
        clock['paused'] = True
    elif not paused and clock['paused']:
        clock['offset_seconds'] = wall_seconds - clock['held_seconds']
        clock['paused'] = False
    clock.update_tag()
    scene.frame_set(scene.frame_current)
    bpy.context.view_layer.update()
    return {'paused': bool(clock['paused']), 'active_seconds': float(clock['active_seconds'])}
