# TodoSystem

Replicate Claude Code's todo system in Cursor. Install once, use anywhere with seamless CLI and Cursor integration.

## How to Use

```bash
npm install -g @gabrielelanaro/todosystem
```

### 2. Initialize in Your Project

Navigate to your project and run:

```bash
cd your-project
todosystem init
```

This creates:
- `~/.todosystem/` directory in your home directory for storing your todos (customizable via `TODOSYSTEM_DIR` env variable)
- `.cursor/rules/todosystem.mdc` with rules for Cursor integration
- Displays MCP configuration (copy this!)

### 3. Setup MCP in Cursor

Copy the MCP configuration from step 2 and add it to your Cursor settings. The configuration looks like:

```json
{
  "mcpServers": {
    "todosystem": {
      "command": "node",
      "args": ["/path/to/global/installation/dist/mcp-server.js"]
    }
  }
}
```

### 4. Use TodoSystem in Cursor

Once MCP is configured, Cursor automatically knows when to use the todo system because of the rules file. Simply:

- Ask Cursor to add todos: *"Add a high priority todo to implement user authentication"*
- Ask for todo management: *"Show my current todos"* or *"Mark the authentication todo as completed"*
- Cursor will automatically use the todo system when appropriate

### 5. Monitor Progress with CLI

Keep track of your todos in real-time:

```bash
todosystem watch
```

This shows a live-updating dashboard with:
- Progress bar and completion percentage
- High priority items needing attention  
- Currently in-progress tasks
- Real-time updates when you modify todos from Cursor

## Alternative Installation Methods

### From Source (Development)

```bash
git clone https://github.com/gabrielelanaro/todosystem.git
cd todosystem
npm install
npm run build
npm install -g .
```

### Direct from GitHub

```bash
npm install -g git+https://github.com/gabrielelanaro/todosystem.git
```

## CLI Commands

### Project Setup
- **`todosystem init`** - Initialize todo system in current project

### Managing Todos
- **`todosystem add <content>`** - Add a new todo item
  ```bash
  todosystem add "Complete documentation"
  todosystem add "Fix bug in parser" --priority high
  ```

- **`todosystem list`** - List all todos in table format
- **`todosystem show`** - Display beautiful dashboard (static snapshot)  
- **`todosystem watch`** - Live updating dashboard with real-time updates
- **`todosystem status`** - Show quick status summary

### Updating Todos
- **`todosystem update <id>`** - Update existing todo items
  ```bash
  todosystem update abc123 --status in_progress
  todosystem update abc123 --content "Updated content"
  todosystem update abc123 --priority high
  ```

- **`todosystem delete <id>`** - Delete todo items

## Dashboard Views

### Static Dashboard (`todosystem show`)
Perfect for quick status checks:
- 📊 Progress bar and completion percentage  
- 🚨 High priority items needing attention
- 🔄 Currently in-progress tasks
- ✅ Completion statistics

### Live Dashboard (`todosystem watch`)
Real-time monitoring for active development:
- ⏰ Live updates when todos change
- 🔄 Real-time sync with Cursor MCP operations
- 📱 Auto-refresh when modifying from another terminal
- 🕒 Timestamp showing last update
- Press `Ctrl+C` to exit

## MCP Integration Details

### Available MCP Tools
- **`todo_read`** - Read the current todo list
- **`todo_write`** - Replace the entire todo list  
- **`todo_add`** - Add a new todo item
- **`todo_update`** - Update an existing todo item
- **`todo_delete`** - Delete a todo item

### How It Works
- CLI commands manage todos in `~/.todosystem/` (or custom location via `TODOSYSTEM_DIR`)
- MCP integration allows Cursor to read/write the same todos
- `.cursor/rules/todosystem.mdc` provides todo management guidelines
- Both systems work with the same data, keeping everything in sync

## Data Storage

Todo items are stored in `~/.todosystem/` in your home directory by default. You can customize this location by setting the `TODOSYSTEM_DIR` environment variable. The directory is created automatically when you run `todosystem init` or add your first todo.

### File Structure
```
~/.todosystem/              # Default location (customizable)
├── lists/
│   ├── default.json        # Default todo list
│   └── work.json          # Additional lists (optional)
├── metadata.json          # List metadata and settings
└── todos.json             # Legacy single-list format (auto-migrated)

your-project/
├── .cursor/
│   └── rules/
│       └── todosystem.mdc  # Cursor integration rules
└── ... (your project files)
```

### Environment Variable

You can customize the storage location by setting the `TODOSYSTEM_DIR` environment variable:

```bash
# Use a custom directory
export TODOSYSTEM_DIR="/path/to/your/todos"
todosystem init

# Or set it just for MCP in Cursor settings
{
  "mcpServers": {
    "todosystem": {
      "command": "node",
      "args": ["/path/to/global/installation/dist/mcp-server.js"],
      "env": {
        "TODOSYSTEM_DIR": "/path/to/your/todos"
      }
    }
  }
}
```

### Todo Item Structure

```typescript
interface TodoItem {
  id: string;           // Unique identifier
  content: string;      // Todo description
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Build the project: `npm run build`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

MIT