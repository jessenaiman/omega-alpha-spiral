"""Save the door separately, then build three editable Dreamweaver paths."""

import math
import bpy
from mathutils import Vector

OUTPUT = r"C:\SpiralDrive\omega-alpha-spiral\artifacts\intro-threshold\dreamweaver-strands.blend"
DOOR = r"C:\SpiralDrive\omega-alpha-spiral\artifacts\intro-threshold\door.blend"


def material(name, rgb):
    result = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    result.use_nodes = True
    result.diffuse_color = (*rgb, 1)
    shader = next(node for node in result.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Metallic"].default_value = 0.05
    shader.inputs["Roughness"].default_value = 0.36
    shader.inputs["Emission Color"].default_value = (*rgb, 1)
    shader.inputs["Emission Strength"].default_value = 2.5
    return result


def route(name, points, rgb, reveal):
    scene = bpy.context.scene
    collection = bpy.data.collections.new("DW_" + name.upper())
    scene.collection.children.link(collection)
    root = bpy.data.objects.new(name + "_STRAND_ROOT", None)
    collection.objects.link(root)
    root.empty_display_size = 0.18
    root["dreamweaver"] = name
    root["leads_to"] = "Art_PortalOpening"
    data = bpy.data.curves.new(name + "_editable_path", "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = 0.012
    data.bevel_resolution = 3
    spline_type = next(item.identifier for item in bpy.types.Spline.bl_rna.properties["type"].enum_items if item.identifier == "POLY")
    spline = data.splines.new(spline_type)
    spline.points.add(len(points) - 1)
    for vertex, coords in zip(spline.points, points):
        vertex.co = (*coords, 1)
    data.materials.append(material(name + " | filament", rgb))
    obj = bpy.data.objects.new(name + "_FINE_FILAMENT", data)
    collection.objects.link(obj)
    obj.parent = root
    data.bevel_factor_end = 0
    data.keyframe_insert(data_path="bevel_factor_end", frame=1)
    data.keyframe_insert(data_path="bevel_factor_end", frame=reveal)
    data.bevel_factor_end = 1
    data.keyframe_insert(data_path="bevel_factor_end", frame=reveal + 28)
    return obj


def build():
    if bpy.data.filepath not in (DOOR, OUTPUT):
        bpy.ops.wm.save_as_mainfile(filepath=DOOR)
    if bpy.data.filepath != OUTPUT:
        bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
    old_scene = bpy.context.scene
    if old_scene.name != "DreamweaverStrands":
        scene = bpy.data.scenes.new("DreamweaverStrands")
        bpy.context.window.scene = scene
        bpy.data.scenes.remove(old_scene)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Darkness before the paths")
    scene.world.use_nodes = True
    background = next(node for node in scene.world.node_tree.nodes if node.type == "BACKGROUND")
    background.inputs["Color"].default_value = (.0004,.0005,.001,1)
    background.inputs["Strength"].default_value = .04
    existing = {collection.name for collection in scene.collection.children}
    if "DW_LIGHT" in existing:
        print("Strands already exist in", OUTPUT)
        return

    # All three lines start near the player and end at the door coordinates.
    light = [(-3.0, -12.0, .07), (-.73, -.32, .07)]
    shadow = [(-.05,-12,.07),(-.7,-9.3,.08),(.38,-7.2,.07),(-.9,-5.1,.08),(.35,-2.9,.07),(0,-.32,.07)]
    ambition = []
    for i in range(81):
        t = i / 80
        # Continuous bend toward the target; no hard corner or closing loop.
        x = 3.05 * (1-t)**3 + 3.45 * 3*(1-t)**2*t + 1.8 * 3*(1-t)*t*t + .73*t**3
        y = -12 * (1-t)**3 - 8.8 * 3*(1-t)**2*t - 3.4 * 3*(1-t)*t*t - .32*t**3
        ambition.append((x, y, .07 + .14*math.sin(math.pi*t)))

    route("Light", light, (.67,.86,1.0), 32)["path_grammar"] = "one exact straight line"
    route("Shadow", shadow, (1.0,.43,.10), 46)["path_grammar"] = "irregular straight segments; sharp turns"
    route("Ambition", ambition, (.96,.09,.15), 60)["path_grammar"] = "continuous curve bending toward the doorway"

    reference = bpy.data.collections.new("DOORWAY_REFERENCE_ONLY")
    scene.collection.children.link(reference)
    reference_mat = material("Door reference | dim silver", (.15,.19,.23))
    outline = bpy.data.curves.new("Door opening envelope", "CURVE")
    outline.dimensions = "3D"
    outline.bevel_depth = .006
    spline = outline.splines.new(next(item.identifier for item in bpy.types.Spline.bl_rna.properties["type"].enum_items if item.identifier == "POLY"))
    envelope = [(-1.3,0,0),(-1.3,0,3.5),(1.3,0,3.5),(1.3,0,0)]
    spline.points.add(len(envelope)-1)
    for point, xyz in zip(spline.points, envelope):
        point.co = (*xyz, 1)
    outline.materials.append(reference_mat)
    outline_obj = bpy.data.objects.new("Reference_Doorway_ActualDoorInDoorBlend", outline)
    reference.objects.link(outline_obj)
    outline_obj["source_blend"] = DOOR

    # A review camera shows their actual scale against the door and floor.
    review = bpy.data.collections.new("DW_REVIEW_CAMERA")
    scene.collection.children.link(review)
    camera_data = bpy.data.cameras.new("DreamweaverReview")
    camera_data.type = "PERSP"
    camera_data.lens = 29
    camera = bpy.data.objects.new("DreamweaverReview", camera_data)
    review.objects.link(camera)
    camera.location = (0, -18, 8.4)
    camera.rotation_euler = (Vector((0, -4.7, .35)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    scene.frame_start = 1
    scene.frame_end = 110
    scene.frame_set(100)
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_perspective = "CAMERA"
            area.spaces.active.shading.color_type = "MATERIAL"
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
    print("Door file:", DOOR)
    print("Strand file:", OUTPUT)
