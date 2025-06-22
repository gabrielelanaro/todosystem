# Claude Code Todo MCP Setup Instructions

## Method 1: MCP Configuration File

1. Create/edit the MCP configuration file:
   - **macOS/Linux:** `~/.config/claude-code/mcp_servers.json`
   - **Windows:** `%APPDATA%\claude-code\mcp_servers.json`

2. Add this configuration:
```json
{
  "mcpServers": {
    "claude-code-todos": {
      "command": "node",
      "args": ["/absolute/path/to/todosystem/src/index.js"],
      "env": {}
    }
  }
}
```

3. Replace `/absolute/path/to/todosystem/` with your actual path

## Method 2: Claude Code Settings

1. Open Claude Code settings
2. Navigate to MCP Servers section
3. Add new server:
   - **Name:** `claude-code-todos`
   - **Command:** `node`
   - **Args:** `["/absolute/path/to/todosystem/src/index.js"]`

## Method 3: Environment Variable

Set the MCP_SERVERS environment variable:

```bash
export MCP_SERVERS='{"claude-code-todos":{"command":"node","args":["/absolute/path/to/todosystem/src/index.js"]}}'
```

## Verification

After setup, restart Claude Code and verify the MCP server is loaded:

1. Check Claude Code logs for MCP connection messages
2. Try using a todo command to test functionality
3. Look for `todos.json` file creation in the project directory

## Troubleshooting

- Ensure Node.js is installed and accessible in PATH
- Verify file permissions are correct
- Check Claude Code logs for error messages
- Test the MCP server independently with `npm start`