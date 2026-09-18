import os

import bpy


target = r"C:\SpiralDrive\omega-alpha-spiral\assets\basic\source\basic-kit-baseline.blend"
os.makedirs(os.path.dirname(target), exist_ok=True)
if os.path.exists(target):
    raise RuntimeError("Refusing to overwrite {}".format(target))

active_before = bpy.data.filepath
operator = bpy.ops.wm.save_as_mainfile(
    filepath=target,
    copy=True,
    check_existing=False,
)
result = {
    "operator": sorted(operator),
    "copy_path": target,
    "exists": os.path.isfile(target),
    "bytes": os.path.getsize(target) if os.path.isfile(target) else 0,
    "active_before": active_before,
    "active_after": bpy.data.filepath,
}
