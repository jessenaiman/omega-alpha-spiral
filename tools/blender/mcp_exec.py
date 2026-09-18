"""Send a Python file to the running Blender MCP bridge on 127.0.0.1:9876.

Usage:
    python tools\\blender\\mcp_exec.py tools\\blender\\build_basic_kit.py
"""

import json
import socket
import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: mcp_exec.py <toolcode.py>", file=sys.stderr)
        return 1
    with open(sys.argv[1], encoding="utf-8") as f:
        code = f.read()
    req = {"type": "execute", "code": code, "strict_json": True}
    with socket.create_connection(("127.0.0.1", 9876), timeout=60) as s:
        s.sendall(json.dumps(req).encode("utf-8") + b"\0")
        buf = b""
        while not buf.endswith(b"\0"):
            chunk = s.recv(4096)
            if not chunk:
                break
            buf += chunk
    if buf:
        print(buf.decode("utf-8")[:-1])
        return 0
    print("<no response>", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())