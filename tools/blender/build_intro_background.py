"""Separate dark-space floor and star layer for the intro; no galaxies."""

import random
import bpy
from mathutils import Vector

OUTPUT = r"C:\SpiralDrive\omega-alpha-spiral\artifacts\intro-threshold\background-void.blend"


def glow_material(name, rgb, strength):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    result.diffuse_color = (*rgb, 1)
    shader = next(node for node in result.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Emission Color"].default_value = (*rgb, 1)
    shader.inputs["Emission Strength"].default_value = strength
    shader.inputs["Roughness"].default_value = 1
    return result


def make():
    if bpy.data.filepath != OUTPUT:
        bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
    old = bpy.context.scene
    if old.name != "IntroVoidBackground":
        scene = bpy.data.scenes.new("IntroVoidBackground")
        bpy.context.window.scene = scene
        bpy.data.scenes.remove(old)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Near black, before creation")
    scene.world.use_nodes = True
    background = next(node for node in scene.world.node_tree.nodes if node.type == "BACKGROUND")
    background.inputs["Color"].default_value = (.0002,.0003,.0006,1)
    background.inputs["Strength"].default_value = .02
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.frame_start = 1
    scene.frame_end = 120
    collection = bpy.data.collections.new("VOID_FLOOR_AND_DEPTH")
    scene.collection.children.link(collection)

    grid_color = glow_material("Floor | barely present silver", (.10,.15,.19), .3)
    data = bpy.data.curves.new("Transparent floor implied by hairlines", "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = .005
    poly = next(item.identifier for item in bpy.types.Spline.bl_rna.properties["type"].enum_items if item.identifier == "POLY")
    for x in (-8,-5,-3,-1,1,3,5,8):
        spline = data.splines.new(poly)
        spline.points.add(1)
        spline.points[0].co = (x,-16,.012,1)
        spline.points[1].co = (x,2,.012,1)
    for y in (-16,-13,-10,-7,-4,-1,2):
        spline = data.splines.new(poly)
        spline.points.add(1)
        spline.points[0].co = (-8,y,.012,1)
        spline.points[1].co = (8,y,.012,1)
    data.materials.append(grid_color)
    floor = bpy.data.objects.new("VoidFloor_ThinGrid", data)
    collection.objects.link(floor)

    rng = random.Random(472)
    vertices, faces = [], []
    for index in range(150):
        x = rng.uniform(-20,20)
        y = rng.uniform(-12,24)
        z = rng.uniform(2.8,19)
        radius = rng.uniform(.006,.022)
        start = len(vertices)
        vertices.extend([(x-radius,y,z),(x+radius,y,z),(x,y-radius,z),(x,y+radius,z),(x,y,z-radius),(x,y,z+radius)])
        faces.extend([tuple(start+v for v in f) for f in ((0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5))])
    stars_data = bpy.data.meshes.new("Distant star points")
    stars_data.from_pydata(vertices, [], faces)
    stars_data.update()
    stars_data.materials.append(glow_material("Stars | distant, unsentimental", (.45,.53,.65), 1.0))
    stars = bpy.data.objects.new("VoidStars_SmallMergedMesh", stars_data)
    collection.objects.link(stars)

    for obj, first, last in ((stars,28,62),(floor,42,78)):
        obj.scale = (.001,.001,.001)
        obj.keyframe_insert(data_path="scale", frame=1)
        obj.keyframe_insert(data_path="scale", frame=first)
        obj.scale = (1,1,1)
        obj.keyframe_insert(data_path="scale", frame=last)

    camera_data = bpy.data.cameras.new("VoidReview")
    camera_data.type = "PERSP"
    camera_data.lens = 28
    camera = bpy.data.objects.new("VoidReview", camera_data)
    collection.objects.link(camera)
    camera.location = (0,-18,8.4)
    camera.rotation_euler = (Vector((0,-4.7,.35))-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    scene.frame_set(100)
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_perspective = "CAMERA"
            area.spaces.active.shading.type = "MATERIAL"
            area.spaces.active.shading.use_scene_world = True
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
    print("Background file:", OUTPUT, "objects:", len(scene.objects))
