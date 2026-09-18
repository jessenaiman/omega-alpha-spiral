import bpy
from mathutils import Vector


def make_collection(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj, collection):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def make_material(name, color, roughness=0.55, metallic=0.0, emission=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    for socket in bsdf.inputs:
        if socket.name == "Base Color":
            socket.default_value = (*color, 1.0)
        elif socket.name == "Roughness":
            socket.default_value = roughness
        elif socket.name == "Metallic":
            socket.default_value = metallic
        elif socket.name == "Emission Color" and emission:
            socket.default_value = (*emission[0], 1.0)
        elif socket.name == "Emission Strength" and emission:
            socket.default_value = emission[1]
    return material


def add_cube(name, collection, location, scale, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name + "_MESH"
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new("Soft_Edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    move_to_collection(obj, collection)
    return obj


def add_empty(name, collection, location):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.location = location
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.3
    return obj


def aim_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for datablocks in (bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
    for datablock in list(datablocks):
        datablocks.remove(datablock)
for collection in list(bpy.data.collections):
    bpy.data.collections.remove(collection)
for material in list(bpy.data.materials):
    bpy.data.materials.remove(material)

scene = bpy.context.scene
scene.name = "SCN_BasicMCPRoom"
environment = make_collection("ENVIRONMENT")
gameplay = make_collection("GAMEPLAY")
lighting = make_collection("LIGHTING")
cameras = make_collection("CAMERAS")

mat_floor = make_material("MAT_Floor", (0.08, 0.12, 0.18), roughness=0.72)
mat_floor_alt = make_material("MAT_FloorAccent", (0.11, 0.20, 0.27), roughness=0.58)
mat_wall = make_material("MAT_Wall", (0.18, 0.21, 0.28), roughness=0.65)
mat_hero = make_material("MAT_Hero", (0.12, 0.38, 0.92), roughness=0.32, metallic=0.18)
mat_hero_dark = make_material("MAT_HeroDark", (0.03, 0.07, 0.16), roughness=0.42)
mat_energy = make_material(
    "MAT_Energy",
    (0.03, 0.55, 0.72),
    roughness=0.18,
    metallic=0.1,
    emission=((0.05, 0.9, 1.0), 4.0),
)

for x in range(4):
    for y in range(4):
        tile = add_cube(
            "GEO_Tile_{:02d}_{:02d}".format(x, y),
            environment,
            (x + 0.5, y + 0.5, 0.0),
            (0.48, 0.48, 0.08),
            mat_floor_alt if (x + y) % 2 else mat_floor,
            bevel=0.025,
        )
        tile["grid_x"] = x
        tile["grid_y"] = y

for index, location, scale in (
    (0, (-0.1, 1.0, 0.6), (0.12, 1.0, 0.6)),
    (1, (-0.1, 3.0, 0.6), (0.12, 1.0, 0.6)),
    (2, (4.1, 1.0, 0.6), (0.12, 1.0, 0.6)),
    (3, (4.1, 3.0, 0.6), (0.12, 1.0, 0.6)),
    (4, (1.0, 4.1, 0.6), (1.0, 0.12, 0.6)),
    (5, (3.0, 4.1, 0.6), (1.0, 0.12, 0.6)),
):
    add_cube("GEO_Wall_{:02d}".format(index), environment, location, scale, mat_wall, bevel=0.04)

hero_root = add_empty("ACT_HeroRoot", gameplay, (0.5, 0.5, 0.1))
hero_root["runtime_role"] = "player"
hero_body = add_cube("ACT_HeroBody", gameplay, (0.0, 0.0, 0.34), (0.20, 0.16, 0.28), mat_hero, bevel=0.07)
hero_body.parent = hero_root
hero_body.location = (0.0, 0.0, 0.34)
hero_head = add_cube("ACT_HeroHead", gameplay, (0.0, 0.0, 0.72), (0.16, 0.15, 0.14), mat_hero_dark, bevel=0.06)
hero_head.parent = hero_root
hero_head.location = (0.0, 0.0, 0.72)
for index, x in enumerate((-0.07, 0.07)):
    eye = add_cube("ACT_HeroEye_{:02d}".format(index), gameplay, (0.0, 0.0, 0.0), (0.035, 0.025, 0.035), mat_energy, bevel=0.012)
    eye.parent = hero_root
    eye.location = (x, -0.15, 0.74)

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.24, location=(2.5, 2.5, 0.44))
gem = bpy.context.object
gem.name = "PICKUP_Gem"
gem.data.name = "PICKUP_Gem_MESH"
gem.scale = (0.72, 0.72, 1.25)
gem.data.materials.append(mat_energy)
gem["runtime_role"] = "collectible"
move_to_collection(gem, gameplay)

portal_root = add_empty("EXIT_PortalRoot", gameplay, (3.5, 3.5, 0.08))
portal_root["runtime_role"] = "exit"
for name, location, scale in (
    ("EXIT_PortalLeft", (-0.32, 0.0, 0.55), (0.10, 0.12, 0.55)),
    ("EXIT_PortalRight", (0.32, 0.0, 0.55), (0.10, 0.12, 0.55)),
    ("EXIT_PortalTop", (0.0, 0.0, 1.03), (0.42, 0.12, 0.10)),
):
    part = add_cube(name, gameplay, (0.0, 0.0, 0.0), scale, mat_energy, bevel=0.04)
    part.parent = portal_root
    part.location = location

camera_data = bpy.data.cameras.new("CAM_Isometric_DATA")
camera = bpy.data.objects.new("CAM_Isometric", camera_data)
cameras.objects.link(camera)
camera.location = (6.7, -7.6, 7.3)
camera.data.lens = 52
aim_at(camera, (2.0, 2.0, 0.45))
scene.camera = camera

for name, light_type, location, energy, color, size in (
    ("LGT_Key", "AREA", (1.0, -2.5, 6.5), 900.0, (0.55, 0.75, 1.0), 5.0),
    ("LGT_Fill", "AREA", (-3.0, 3.0, 3.5), 560.0, (0.34, 0.9, 1.0), 4.0),
    ("LGT_Rim", "AREA", (5.0, 5.0, 5.0), 1000.0, (1.0, 0.25, 0.65), 3.0),
):
    data = bpy.data.lights.new(name + "_DATA", light_type)
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    light = bpy.data.objects.new(name, data)
    lighting.objects.link(light)
    light.location = location
    aim_at(light, (2.0, 2.0, 0.2))

scene.world.color = (0.006, 0.009, 0.018)
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
bpy.context.view_layer.update()

result = {
    "scene": scene.name,
    "collections": [collection.name for collection in scene.collection.children],
    "objects": len(scene.objects),
    "meshes": sum(obj.type == "MESH" for obj in scene.objects),
    "materials": [material.name for material in bpy.data.materials],
    "camera": scene.camera.name,
    "runtime_roles": {
        obj.name: obj.get("runtime_role")
        for obj in scene.objects
        if obj.get("runtime_role")
    },
}
