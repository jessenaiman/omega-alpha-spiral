"""Persistent headless Blender bridge for the Blender MCP socket server.

Drives the Blender Lab MCP bridge in ``blender --background`` mode so agents
can talk to Blender over localhost:9876 without a GUI session.

Run:
    blender.exe --background --online-mode --python tools\\blender\\mcp_headless_server.py

The process keeps running until killed; stop it with Task Manager or
``Stop-Process`` on its PID.
"""

import bpy  # noqa: F401  (ensure bpy is initialized before use)

from bl_ext.user_default.mcp import execute_blocking
from bl_ext.user_default.mcp import mcp_to_blender_server

mcp_to_blender_server.start(mcp_to_blender_server.DEFAULT_HOST, mcp_to_blender_server.DEFAULT_PORT)
print("MCP headless server listening on {}:{}".format(
    mcp_to_blender_server.DEFAULT_HOST, mcp_to_blender_server.DEFAULT_PORT))
execute_blocking.run()