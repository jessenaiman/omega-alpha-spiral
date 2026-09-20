import bpy
import addon_utils


module = "bl_ext.user_default.mcp"
enabled_by_default, enabled_now = addon_utils.check(module)
preferences = bpy.context.preferences.addons[module].preferences if enabled_now else None
print("MCP_DOCTOR", {
    "online_access": bpy.app.online_access,
    "background": bpy.app.background,
    "enabled_by_default": enabled_by_default,
    "enabled_now": enabled_now,
    "use_autostart": preferences.use_autostart if preferences else None,
    "autostart_delay": preferences.autostart_delay if preferences else None,
    "host": preferences.host if preferences else None,
    "port": preferences.port if preferences else None,
})
