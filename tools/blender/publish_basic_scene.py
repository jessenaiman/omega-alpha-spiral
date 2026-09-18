import os

import bpy


source_path = r"C:\SpiralDrive\omega-alpha-spiral\assets\basic\source\basic-mcp-room.blend"
glb_path = r"C:\SpiralDrive\omega-alpha-spiral\assets\basic\demo-kit.glb"
render_path = r"C:\SpiralDrive\omega-alpha-spiral\artifacts\blender-mcp\basic-scene.png"
os.makedirs(os.path.dirname(source_path), exist_ok=True)
os.makedirs(os.path.dirname(glb_path), exist_ok=True)
os.makedirs(os.path.dirname(render_path), exist_ok=True)

save_operator = bpy.ops.wm.save_as_mainfile(
    filepath=source_path,
    copy=True,
    check_existing=False,
)
bpy.context.scene.render.filepath = render_path
render_operator = bpy.ops.render.render(write_still=True)
export_operator = bpy.ops.export_scene.gltf(
    filepath=glb_path,
    check_existing=False,
    export_format="GLB",
    export_yup=True,
    export_apply=False,
    export_animations=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
)
with open(glb_path, "rb") as handle:
    magic = handle.read(4)

result = {
    "save_operator": sorted(save_operator),
    "source_path": source_path,
    "source_bytes": os.path.getsize(source_path),
    "active_blend": bpy.data.filepath,
    "render_operator": sorted(render_operator),
    "render_path": render_path,
    "render_bytes": os.path.getsize(render_path),
    "export_operator": sorted(export_operator),
    "glb_path": glb_path,
    "glb_bytes": os.path.getsize(glb_path),
    "glb_magic": magic.decode("ascii", errors="replace"),
}
