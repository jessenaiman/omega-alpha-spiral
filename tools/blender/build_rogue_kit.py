"""
Rogue Descent — the authored dungeon kit, built in Blender and exported to glTF.

Everything the roguelike renders is a named mesh in one GLB, so the Three.js
side never invents geometry: it instances what Blender authored.

Run headless (from the repo root):

    & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" ^
        --background --factory-startup --python tools/blender/build_rogue_kit.py

Outputs:
    assets/rogue/dungeon-kit.glb    the runtime asset (one node per part)
    tools/blender/rogue-kit.blend   the same kit, saved for inspection

Design: 1 Blender unit == 1 dungeon tile. +Z is up in Blender; the glTF exporter
converts to +Y up. Floor tiles span x,y in [-0.5, 0.5] with the walkable top at
z = 0, so the grid can be laid out on the XY plane with no per-tile y-offset.
"""

from __future__ import annotations

import os
import sys
import traceback
from typing import Iterable

import bpy
import bmesh
from mathutils import Vector

# --- small helpers -----------------------------------------------------------


def clear_scene() -> None:
    """Start from an empty scene regardless of the startup file."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            block.remove(item)


def set_input(bsdf, names: Iterable[str], value) -> bool:
    """Principled BSDF socket names drift between versions; match any of them."""
    for name in names:
        socket = bsdf.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return True
    return False


def material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float = 0.7,
    metallic: float = 0.0,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 1.0,
    image_path: str | None = None,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        raise RuntimeError("Principled BSDF node not found")
    set_input(bsdf, ("Base Color",), color)
    set_input(bsdf, ("Roughness",), roughness)
    set_input(bsdf, ("Metallic",), metallic)
    if emission is not None:
        set_input(bsdf, ("Emission Color", "Emission"), emission)
        set_input(bsdf, ("Emission Strength",), emission_strength)
    if image_path is not None:
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        image = bpy.data.images.load(os.path.abspath(image_path))
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = image
        texture.location = (-360.0, 200.0)
        links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def uv_unwrap(obj: bpy.types.Object) -> None:
    """UV unwrap a part so image textures have somewhere to land."""
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
    except (RuntimeError, TypeError):
        bpy.ops.uv.cube_project(cube_size=1.0)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def _new_object(name: str, bm: bmesh.types.BMesh, mat: bpy.types.Material) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


def _cube_bm(size: tuple[float, float, float], *, bevel: float = 0.0) -> bmesh.types.BMesh:
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if bevel > 0.0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
            offset=bevel,
            offset_type="OFFSET",
            segments=1,
            affect="EDGES",
        )
    return bm


def box(
    name: str,
    size: tuple[float, float, float],
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    bevel: float = 0.0,
) -> bpy.types.Object:
    obj = _new_object(name, _cube_bm(size, bevel=bevel), mat)
    obj.location = Vector(location)
    return obj


def _sphere_bm(radius: float, segments: int) -> bmesh.types.BMesh:
    bm = bmesh.new()
    kwargs = dict(u_segments=segments, v_segments=max(4, segments // 2))
    try:
        bmesh.ops.create_uvsphere(bm, radius=radius, **kwargs)
    except TypeError:  # pre-3.0 naming
        bmesh.ops.create_uvsphere(bm, diameter=radius * 2.0, **kwargs)
    return bm


def sphere(
    name: str,
    radius: float,
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    segments: int = 16,
    squash: float = 1.0,
) -> bpy.types.Object:
    bm = _sphere_bm(radius, segments)
    if squash != 1.0:
        bmesh.ops.scale(bm, vec=Vector((1.0, 1.0, squash)), verts=bm.verts)
    obj = _new_object(name, bm, mat)
    obj.location = Vector(location)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def cone(
    name: str,
    radius_bottom: float,
    radius_top: float,
    depth: float,
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    segments: int = 16,
) -> bpy.types.Object:
    bm = bmesh.new()
    base = dict(cap_ends=True, cap_tris=False, segments=segments, depth=depth)
    try:
        bmesh.ops.create_cone(bm, radius1=radius_bottom, radius2=radius_top, **base)
    except TypeError:  # pre-3.0 naming
        bmesh.ops.create_cone(bm, diameter1=radius_bottom * 2, diameter2=radius_top * 2, **base)
    obj = _new_object(name, bm, mat)
    obj.location = Vector(location)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def icosphere(
    name: str,
    radius: float,
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    subdivisions: int = 1,
) -> bpy.types.Object:
    bm = bmesh.new()
    try:
        bmesh.ops.create_icosphere(bm, radius=radius, subdivisions=subdivisions)
    except TypeError:
        bmesh.ops.create_icosphere(bm, diameter=radius * 2.0, subdivisions=subdivisions)
    obj = _new_object(name, bm, mat)
    obj.location = Vector(location)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


# --- the kit -----------------------------------------------------------------


def build_kit() -> list[bpy.types.Object]:
    # Palette: cold stone, warm hero, hot enemies, one signal accent.
    stone_dark = material("StoneDark", (0.055, 0.070, 0.095, 1.0), roughness=0.92, image_path="assets/rogue/textures/floor-stone.png")
    stone_wall = material("StoneWall", (0.115, 0.130, 0.165, 1.0), roughness=0.85, image_path="assets/rogue/textures/wall-stone.png")
    stone_top = material("StoneTop", (0.180, 0.200, 0.240, 1.0), roughness=0.78, image_path="assets/rogue/textures/wall-stone.png")
    stairs = material(
        "Stairs",
        (0.55, 0.42, 0.16, 1.0),
        roughness=0.55,
        metallic=0.1,
        emission=(1.0, 0.72, 0.25, 1.0),
        emission_strength=0.6,
    )
    hero_body = material("HeroBody", (0.62, 0.78, 0.92, 1.0), roughness=0.35, metallic=0.15)
    hero_accent = material(
        "HeroAccent",
        (0.10, 0.85, 1.0, 1.0),
        roughness=0.3,
        emission=(0.20, 0.90, 1.0, 1.0),
        emission_strength=2.2,
    )
    monster_body = material("MonsterBody", (0.42, 0.10, 0.16, 1.0), roughness=0.6)
    monster_eye = material(
        "MonsterEye",
        (1.0, 0.25, 0.18, 1.0),
        roughness=0.4,
        emission=(1.0, 0.22, 0.12, 1.0),
        emission_strength=3.0,
    )
    item_heart = material(
        "ItemHeart",
        (1.0, 0.18, 0.30, 1.0),
        roughness=0.3,
        emission=(1.0, 0.15, 0.32, 1.0),
        emission_strength=2.4,
    )

    parts: list[bpy.types.Object] = []

    # Floor: walkable top at z = 0.
    parts.append(box("TileFloor", (1.0, 1.0, 0.12), (0.0, 0.0, -0.06), stone_dark))

    # Wall: a block with a lighter cap so rooms read at the camera angle.
    wall = box("TileWall", (1.0, 1.0, 0.60), (0.0, 0.0, 0.30), stone_wall, bevel=0.05)
    parts.append(wall)
    parts.append(box("WallCap", (0.94, 0.94, 0.06), (0.0, 0.0, 0.60), stone_top, bevel=0.02))

    # Stairs: base plate plus three descending steps, so climbing reads.
    parts.append(box("StairsBase", (1.0, 1.0, 0.12), (0.0, 0.0, -0.06), stone_dark))
    for index in range(3):
        step_h = 0.10
        y = -0.30 + index * 0.30
        z = 0.05 + index * step_h
        parts.append(box(f"StairsStep{index}", (0.86, 0.30, step_h), (0.0, y, z), stairs))

    # Hero: a slim cone body, a head, and a bright visor accent.
    parts.append(cone("HeroBody", 0.26, 0.11, 0.42, (0.0, 0.0, 0.21), hero_body))
    parts.append(sphere("HeroHead", 0.145, (0.0, 0.0, 0.50), hero_body))
    parts.append(box("HeroVisor", (0.22, 0.06, 0.06), (0.0, -0.10, 0.50), hero_accent, bevel=0.015))

    # Monster: a squat body with two hot eyes facing -Y.
    parts.append(sphere("MonsterBody", 0.28, (0.0, 0.0, 0.26), monster_body, squash=0.82))
    parts.append(sphere("MonsterEyeL", 0.055, (-0.095, -0.20, 0.33), monster_eye, segments=10))
    parts.append(sphere("MonsterEyeR", 0.055, (0.095, -0.20, 0.33), monster_eye, segments=10))

    # Pickup: a heart-ish icosphere.
    parts.append(icosphere("ItemHeart", 0.14, (0.0, 0.0, 0.20), item_heart))

    return parts


def export(parts: list[bpy.types.Object], glb_path: str, blend_path: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(glb_path)), exist_ok=True)

    # Save the editable source first.
    os.makedirs(os.path.dirname(os.path.abspath(blend_path)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(blend_path))

    kwargs = dict(
        filepath=os.path.abspath(glb_path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
    )
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError:
        # Older/newer exporters may not accept every keyword; drop to the minimum.
        bpy.ops.export_scene.gltf(filepath=kwargs["filepath"], export_format="GLB")

    size = os.path.getsize(glb_path)
    print(f"[rogue-kit] wrote {glb_path} ({size} bytes)")
    for obj in parts:
        print(f"[rogue-kit]   {obj.name}: {len(obj.data.vertices)} verts, {len(obj.data.polygons)} tris")


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    glb_path = "assets/rogue/dungeon-kit.glb"
    blend_path = "tools/blender/rogue-kit.blend"
    for index, arg in enumerate(argv):
        if arg in ("--out", "--glb") and index + 1 < len(argv):
            glb_path = argv[index + 1]

    clear_scene()
    parts = build_kit()
    export(parts, glb_path, blend_path)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        traceback.print_exc()
        sys.exit(1)
