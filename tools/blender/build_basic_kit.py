import bpy
import os


def make_material(name, color, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        for inp in bsdf.inputs:
            if inp.name == "Base Color":
                inp.default_value = (*color, 1.0)
            elif inp.name == "Roughness":
                inp.default_value = 0.6
            elif inp.name == "Metallic":
                inp.default_value = 0.0
            elif inp.name == "Emission Color":
                inp.default_value = (*emission, 1.0) if emission else (0.0, 0.0, 0.0, 1.0)
            elif inp.name == "Emission Strength":
                inp.default_value = emission_strength
    return mat


bpy.ops.object.select_all(action="SELECT")
for keep in ("Light", "Camera"):
    obj = bpy.data.objects.get(keep)
    if obj is not None:
        obj.select_set(False)
bpy.ops.object.delete()

mat_tile = make_material("mat_tile", (0.35, 0.38, 0.42))
mat_hero = make_material("mat_hero", (0.15, 0.35, 0.85))
mat_hero_dark = make_material("mat_hero_dark", (0.10, 0.16, 0.34))
mat_gem = make_material("mat_gem", (0.05, 0.9, 0.85), emission=(0.05, 0.9, 0.85), emission_strength=2.0)

for x in range(3):
    for z in range(3):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, z, 0.05))
        obj = bpy.context.active_object
        obj.name = "Tile_{}_{}".format(x, z)
        obj.scale = (1.0, 1.0, 0.1)
        obj.data.materials.append(mat_tile)

bpy.ops.mesh.primitive_cube_add(size=0.44, location=(0.5, 0.5, 0.36))
hero = bpy.context.active_object
hero.name = "Hero_Body"
hero.data.materials.append(mat_hero)

bpy.ops.mesh.primitive_cube_add(size=0.28, location=(0.5, 0.5, 0.60))
hero_head = bpy.context.active_object
hero_head.name = "Hero_Head"
hero_head.data.materials.append(mat_hero_dark)

for eye_x in (-0.07, 0.07):
    bpy.ops.mesh.primitive_cube_add(size=0.06, location=(0.5 + eye_x, 0.5, 0.62))
    eye = bpy.context.active_object
    eye.name = "Hero_Eye"
    eye.data.materials.append(mat_gem)

bpy.ops.mesh.primitive_cone_add(
    vertices=8, radius1=0.22, radius2=0.0, depth=0.5, location=(2.5, 2.5, 0.45)
)
gem = bpy.context.active_object
gem.name = "Gem"
gem.data.materials.append(mat_gem)

if bpy.context.preferences.addons.get("io_scene_gltf2") is None:
    bpy.ops.preferences.addon_enable(module="io_scene_gltf2")

for unused in [m for m in bpy.data.materials if m.users == 0]:
    bpy.data.materials.remove(unused)

out_dir = r"C:\SpiralDrive\omega-alpha-spiral\assets\basic"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "demo-kit.glb")
bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)

result = {
    "exported": out_path,
    "exists": os.path.exists(out_path),
    "size_bytes": os.path.getsize(out_path) if os.path.exists(out_path) else 0,
    "objects": [
        {
            "name": o.name,
            "type": o.type,
            "verts": len(o.data.vertices) if o.type == "MESH" else 0,
            "faces": len(o.data.polygons) if o.type == "MESH" else 0,
        }
        for o in bpy.context.scene.objects
    ],
    "materials": [m.name for m in bpy.data.materials],
}
result["total_verts"] = sum(o["verts"] for o in result["objects"])