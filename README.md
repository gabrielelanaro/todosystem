# TodoSystem

A comprehensive todo system for task management. Built with TypeScript for enhanced type safety and developer experience.

## Features

- **todo_read**: Read the current todo list
- **todo_write**: Replace the entire todo list
- **todo_add**: Add a new todo item
- **todo_update**: Update an existing todo item
- **todo_delete**: Delete a todo item

## Installation

```bash
npm install
```

## Development

### Building the Project

The project is written in TypeScript and needs to be compiled to JavaScript:

```bash
npm run build
```

### Running the Server

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### Type Checking

To check TypeScript types without generating output:

```bash
npm run type-check
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and run the server
- `npm run dev` - Build and run with file watching
- `npm run clean` - Remove the dist directory
- `npm run type-check` - Check TypeScript types without compilation

### Available Tools

#### `todo_read`
Reads the current todo list.

**Parameters:** None

**Example Response:**
```json
[
  {
    "id": "1",
    "content": "Complete project documentation",
    "status": "pending",
    "priority": "high"
  }
]
```

#### `todo_add`
Adds a new todo item.

**Parameters:**
- `content` (string, required): The content of the todo item
- `priority` (string, optional): Priority level ("high", "medium", "low"). Default: "medium"

#### `todo_update`
Updates an existing todo item.

**Parameters:**
- `id` (string, required): The ID of the todo item to update
- `content` (string, optional): Updated content
- `status` (string, optional): Updated status ("pending", "in_progress", "completed")
- `priority` (string, optional): Updated priority ("high", "medium", "low")

#### `todo_delete`
Deletes a todo item.

**Parameters:**
- `id` (string, required): The ID of the todo item to delete

#### `todo_write`
Replaces the entire todo list.

**Parameters:**
- `todos` (array, required): Array of todo items with id, content, status, and priority

### Todo Item Structure

Each todo item has the following structure:

```typescript
interface TodoItem {
  id: string;           // Unique identifier
  content: string;      // Todo description
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}
```

The project includes comprehensive TypeScript types in `src/types.ts` for all todo operations and MCP interactions.

## Setup and Configuration

### Method 1: MCP Configuration File

1. Create/edit the MCP configuration file:
   - **macOS/Linux:** `~/.config/claude-code/mcp_servers.json`
   - **Windows:** `%APPDATA%\claude-code\mcp_servers.json`

2. Add this configuration:
```json
{
  "mcpServers": {
    "todosystem": {
      "command": "node",
      "args": ["/absolute/path/to/todosystem/dist/index.js"],
      "env": {}
    }
  }
}
```

3. Replace `/absolute/path/to/todosystem/` with your actual path

### Method 2: Claude Code Settings

1. Open Claude Code settings
2. Navigate to MCP Servers section
3. Add new server:
   - **Name:** `todosystem`
   - **Command:** `node`
   - **Args:** `["/absolute/path/to/todosystem/dist/index.js"]`

### Method 3: Environment Variable

Set the MCP_SERVERS environment variable:

```bash
export MCP_SERVERS='{"todosystem":{"command":"node","args":["/absolute/path/to/todosystem/dist/index.js"]}}'
```

### Verification

After setup, restart Claude Code and verify the MCP server is loaded:

1. Check application logs for connection messages
2. Try using a todo command to test functionality
3. Look for `todos.json` file creation in the project directory

### Troubleshooting

- Ensure Node.js is installed and accessible in PATH
- Verify file permissions are correct
- Check Claude Code logs for error messages
- Test the MCP server independently with `npm start`

**Note**: Make sure to run `npm run build` before using the MCP server to ensure the TypeScript code is compiled to JavaScript.

## Data Storage

Todo items are stored in `todos.json` in the project root directory. The file is created automatically when the first todo is added.

## License

MIT