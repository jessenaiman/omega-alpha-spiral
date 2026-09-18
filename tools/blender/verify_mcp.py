import asyncio
import base64
import json
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters, types
from mcp.client.stdio import stdio_client


SERVER = r"C:\Users\jesse\.local\bin\blender-mcp.exe"


def parse_arguments(items: list[str]) -> dict[str, object]:
    arguments = {}
    for item in items:
        key, value = item.split("=", 1)
        try:
            arguments[key] = json.loads(value)
        except json.JSONDecodeError:
            arguments[key] = value
    return arguments


def serialize_result(result: types.CallToolResult) -> object:
    if result.structuredContent:
        return result.structuredContent
    return [
        item.text if isinstance(item, types.TextContent) else item.model_dump(mode="json")
        for item in result.content
    ]


async def run() -> None:
    params = StdioServerParameters(command=SERVER, args=[])
    async with stdio_client(params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            command = sys.argv[1] if len(sys.argv) > 1 else "list"
            if command == "list":
                response = await session.list_tools()
                print(json.dumps([
                    {
                        "name": tool.name,
                        "title": tool.annotations.title if tool.annotations else None,
                        "read_only": tool.annotations.readOnlyHint if tool.annotations else None,
                        "destructive": tool.annotations.destructiveHint if tool.annotations else None,
                        "schema": tool.inputSchema,
                    }
                    for tool in response.tools
                ], indent=2))
                return

            if command == "code":
                arguments = {"code": Path(sys.argv[2]).read_text(encoding="utf-8")}
                tool_name = "execute_blender_code"
            elif command == "call":
                tool_name = sys.argv[2]
                arguments = parse_arguments(sys.argv[3:])
            elif command == "image":
                tool_name = sys.argv[2]
                output_path = Path(sys.argv[3])
                arguments = parse_arguments(sys.argv[4:])
                result = await session.call_tool(tool_name, arguments=arguments)
                image = next((item for item in result.content if isinstance(item, types.ImageContent)), None)
                if image is None:
                    raise RuntimeError("{} returned no image".format(tool_name))
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_bytes(base64.b64decode(image.data))
                print(json.dumps({
                    "tool": tool_name,
                    "is_error": result.isError,
                    "path": str(output_path),
                    "mime_type": image.mimeType,
                    "bytes": output_path.stat().st_size,
                }, indent=2))
                return
            else:
                raise SystemExit(
                    "usage: verify_mcp.py list | code <file.py> | call <tool> [key=value] | "
                    "image <tool> <output> [key=value]"
                )

            result = await session.call_tool(tool_name, arguments=arguments)
            print(json.dumps({
                "tool": tool_name,
                "is_error": result.isError,
                "result": serialize_result(result),
            }, indent=2))


if __name__ == "__main__":
    asyncio.run(run())
