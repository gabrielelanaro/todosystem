# TodoSystem

A comprehensive CLI tool that replicates Claude Code's todo system for Cursor users. Built with TypeScript for enhanced type safety and developer experience.

## Features

### CLI Commands
- **`todosystem init`**: Initialize todo system in your project
- **`todosystem add <content>`**: Add a new todo item
- **`todosystem list`**: List all todos in a table format
- **`todosystem show`**: Display beautiful todo dashboard (static snapshot)
- **`todosystem watch`**: Watch todos with real-time updates (live dashboard)
- **`todosystem update <id>`**: Update existing todo items
- **`todosystem delete <id>`**: Delete todo items
- **`todosystem status`**: Show quick status summary

### MCP Integration
- **todo_read**: Read the current todo list
- **todo_write**: Replace the entire todo list  
- **todo_add**: Add a new todo item
- **todo_update**: Update an existing todo item
- **todo_delete**: Delete a todo item

## Installation

### From npm (Recommended)

```bash
npm install -g todosystem
```

### From Source (Development)

```bash
git clone https://github.com/gabrielelanaro/todosystem.git
cd todosystem
npm install
npm run build
npm install -g .
```

### Direct from GitHub (Alternative)

```bash
npm install -g git+https://github.com/gabrielelanaro/todosystem.git
```

**Note**: npm installation is the most reliable method. GitHub direct installation can sometimes have issues.

## Quick Start

1. **Install TodoSystem from npm:**
   ```bash
   npm install -g todosystem
   ```

2. **Initialize in your project:**
   ```bash
   cd your-project
   todosystem init
   ```

3. **Add the MCP configuration to Cursor:**
   Copy the displayed configuration to your Cursor settings.

4. **Start using todos:**
   ```bash
   todosystem add "Implement new feature" --priority high
   todosystem show
   ```

## CLI Usage

### Initialize Project
```bash
todosystem init
```
Creates `.todosystem/` directory, adds `todosystem.mdc` to `.cursor/rules/`, and displays MCP configuration.

### Managing Todos
```bash
# Add todos
todosystem add "Complete documentation"
todosystem add "Fix bug in parser" --priority high
todosystem add "Refactor utils" --priority low

# View todos
todosystem list                    # Table format
todosystem show                    # Beautiful dashboard (static snapshot)
todosystem watch                   # Live updating dashboard with real-time updates
todosystem status                  # Quick summary

# Update todos
todosystem update <id> --status in_progress
todosystem update <id> --content "Updated content"
todosystem update <id> --priority high

# Delete todos
todosystem delete <id>
```

### Dashboard Views

**Static Dashboard (`todosystem show`)**
Shows a beautiful snapshot of your current todos:
- 📊 Progress bar and completion percentage  
- 🚨 High priority items needing attention
- 🔄 Currently in-progress tasks
- ✅ Completion statistics
- 🎨 Color-coded status and priority indicators

**Live Dashboard (`todosystem watch`)**
Provides real-time monitoring with automatic updates:
- ⏰ Live updates when todos change
- 🔄 Real-time synchronization with MCP operations in Cursor
- 📱 Automatic refresh when you modify todos from another terminal
- 🕒 Timestamp showing last update
- All features from the static dashboard

**Note**: The live dashboard automatically updates when you modify todos from another terminal or when Cursor's MCP integration makes changes. Press `Ctrl+C` to exit the live view.

## Development

### Building the Project

```bash
npm run build
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start:mcp` - Run MCP server
- `npm run start:cli` - Run CLI
- `npm run dev` - Build and run CLI with watching
- `npm run clean` - Remove the dist directory
- `npm run type-check` - Check TypeScript types without compilation

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

## Cursor Integration

### Automatic Setup
After running `todosystem init`, the tool will display the MCP configuration. Simply copy and paste it into your Cursor settings.

### Manual Configuration
If you need to manually configure the MCP server, add this to your Cursor settings:

```json
{
  "mcpServers": {
    "todosystem": {
      "command": "node",
      "args": ["/path/to/todosystem/dist/mcp-server.js"]
    }
  }
}
```

Replace `/path/to/todosystem/` with the actual installation path.

### How It Works
- **CLI commands** manage todos in your project's `.todosystem/todos.json`
- **MCP integration** allows Cursor to read and write the same todos
- **`.cursor/rules/todosystem.mdc`** provides todo management guidelines to Cursor
- Both systems work with the same data, keeping everything in sync

### Verification
- Run `todosystem status` to see todo counts
- Use Cursor's todo commands through MCP
- Check that `.todosystem/todos.json` updates with both methods

## Data Storage

Todo items are stored in `.todosystem/todos.json` in your project directory. This file is created automatically when you run `todosystem init` or add your first todo.

### File Structure
```
your-project/
├── .todosystem/
│   └── todos.json          # Your project's todos
├── .cursor/
│   └── rules/
│       └── todosystem.mdc  # Cursor integration rules
└── ... (your project files)
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