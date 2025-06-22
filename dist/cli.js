#!/usr/bin/env node
import { Command } from 'commander';
import { promises as fs, watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class TodoSystemCLI {
    constructor() {
        this.todoDir = path.join(process.cwd(), '.todosystem');
        this.todoFile = path.join(this.todoDir, 'todos.json');
    }
    async ensureTodoDir() {
        try {
            await fs.mkdir(this.todoDir, { recursive: true });
        }
        catch (error) {
            // Directory might already exist
        }
    }
    async loadTodos() {
        try {
            const data = await fs.readFile(this.todoFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    async saveTodos(todos) {
        await this.ensureTodoDir();
        await fs.writeFile(this.todoFile, JSON.stringify(todos, null, 2));
    }
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 11);
    }
    async init() {
        await this.ensureTodoDir();
        // Copy todosystem.mdc to .cursor/rules/
        const cursorRulesDir = path.join(process.cwd(), '.cursor', 'rules');
        try {
            await fs.mkdir(cursorRulesDir, { recursive: true });
            const templatePath = path.join(__dirname, '..', 'templates', 'todosystem.mdc');
            const targetPath = path.join(cursorRulesDir, 'todosystem.mdc');
            await fs.copyFile(templatePath, targetPath);
            console.log(chalk.green('✅ TodoSystem initialized successfully!'));
            console.log(chalk.blue(`📁 Created .todosystem directory`));
            console.log(chalk.blue(`📋 Added todosystem.mdc to .cursor/rules/`));
            // Show MCP configuration
            this.showMCPConfig();
        }
        catch (error) {
            console.error(chalk.red('❌ Error during initialization:'), error);
        }
    }
    showMCPConfig() {
        const mcpConfig = {
            "mcpServers": {
                "todosystem": {
                    "command": "node",
                    "args": [path.join(__dirname, "mcp-server.js")]
                }
            }
        };
        console.log('\n' + boxen(chalk.yellow.bold('📋 MCP Configuration for Cursor\n\n') +
            chalk.gray('Add this to your Cursor settings:\n\n') +
            chalk.cyan(JSON.stringify(mcpConfig, null, 2)), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
    }
    async addTodo(content, priority = 'medium') {
        const todos = await this.loadTodos();
        const newTodo = {
            id: this.generateId(),
            content,
            status: 'pending',
            priority
        };
        todos.push(newTodo);
        await this.saveTodos(todos);
        console.log(chalk.green(`✅ Added todo: ${content}`));
    }
    async listTodos() {
        const todos = await this.loadTodos();
        if (todos.length === 0) {
            console.log(chalk.yellow('📝 No todos found. Use "todosystem add <content>" to create one.'));
            return;
        }
        const table = new Table({
            head: ['ID', 'Content', 'Status', 'Priority'],
            colWidths: [8, 50, 12, 10]
        });
        todos.forEach(todo => {
            const statusColor = todo.status === 'completed' ? chalk.green :
                todo.status === 'in_progress' ? chalk.blue : chalk.yellow;
            const priorityColor = todo.priority === 'high' ? chalk.red :
                todo.priority === 'medium' ? chalk.yellow : chalk.gray;
            table.push([
                todo.id.substring(0, 6),
                todo.content,
                statusColor(todo.status),
                priorityColor(todo.priority)
            ]);
        });
        console.log(table.toString());
    }
    generateDisplayStatic(todos) {
        if (todos.length === 0) {
            return boxen(chalk.yellow('📝 No todos found.\n\nUse "todosystem add <content>" to create your first todo!'), { padding: 1, borderStyle: 'round', borderColor: 'yellow' });
        }
        const pending = todos.filter(t => t.status === 'pending');
        const inProgress = todos.filter(t => t.status === 'in_progress');
        const completed = todos.filter(t => t.status === 'completed');
        const completionRate = Math.round((completed.length / todos.length) * 100);
        const progressBar = '█'.repeat(Math.floor(completionRate / 5)) + '░'.repeat(20 - Math.floor(completionRate / 5));
        let display = chalk.bold.blue('📋 TodoSystem Dashboard\n\n');
        // Progress section
        display += chalk.gray('Progress: ') + chalk.green(`${completionRate}%`) + '\n';
        display += chalk.green(progressBar) + ` ${completed.length}/${todos.length}\n\n`;
        // Summary
        display += chalk.yellow(`⏳ Pending: ${pending.length}\n`);
        display += chalk.blue(`🔄 In Progress: ${inProgress.length}\n`);
        display += chalk.green(`✅ Completed: ${completed.length}\n\n`);
        // High priority items
        const highPriority = todos.filter(t => t.priority === 'high' && t.status !== 'completed');
        if (highPriority.length > 0) {
            display += chalk.red.bold('🚨 High Priority Items:\n');
            highPriority.forEach(todo => {
                const icon = todo.status === 'in_progress' ? '🔄' : '⏳';
                display += chalk.red(`  ${icon} ${todo.content}\n`);
            });
            display += '\n';
        }
        // In progress items
        if (inProgress.length > 0) {
            display += chalk.blue.bold('🔄 Currently Working On:\n');
            inProgress.forEach(todo => {
                const priorityIcon = todo.priority === 'high' ? '🔥' :
                    todo.priority === 'medium' ? '⚡' : '📝';
                display += chalk.blue(`  ${priorityIcon} ${todo.content}\n`);
            });
        }
        return boxen(display, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        });
    }
    generateDisplay(todos) {
        if (todos.length === 0) {
            return boxen(chalk.yellow('📝 No todos found.\n\nUse "todosystem add <content>" to create your first todo!'), { padding: 1, borderStyle: 'round', borderColor: 'yellow' });
        }
        const pending = todos.filter(t => t.status === 'pending');
        const inProgress = todos.filter(t => t.status === 'in_progress');
        const completed = todos.filter(t => t.status === 'completed');
        const completionRate = Math.round((completed.length / todos.length) * 100);
        const progressBar = '█'.repeat(Math.floor(completionRate / 5)) + '░'.repeat(20 - Math.floor(completionRate / 5));
        let display = chalk.bold.blue('📋 TodoSystem Dashboard\n\n');
        // Add timestamp
        const now = new Date().toLocaleTimeString();
        display += chalk.gray(`Updated: ${now}\n\n`);
        // Progress section
        display += chalk.gray('Progress: ') + chalk.green(`${completionRate}%`) + '\n';
        display += chalk.green(progressBar) + ` ${completed.length}/${todos.length}\n\n`;
        // Summary
        display += chalk.yellow(`⏳ Pending: ${pending.length}\n`);
        display += chalk.blue(`🔄 In Progress: ${inProgress.length}\n`);
        display += chalk.green(`✅ Completed: ${completed.length}\n\n`);
        // High priority items
        const highPriority = todos.filter(t => t.priority === 'high' && t.status !== 'completed');
        if (highPriority.length > 0) {
            display += chalk.red.bold('🚨 High Priority Items:\n');
            highPriority.forEach(todo => {
                const icon = todo.status === 'in_progress' ? '🔄' : '⏳';
                display += chalk.red(`  ${icon} ${todo.content}\n`);
            });
            display += '\n';
        }
        // In progress items
        if (inProgress.length > 0) {
            display += chalk.blue.bold('🔄 Currently Working On:\n');
            inProgress.forEach(todo => {
                const priorityIcon = todo.priority === 'high' ? '🔥' :
                    todo.priority === 'medium' ? '⚡' : '📝';
                display += chalk.blue(`  ${priorityIcon} ${todo.content}\n`);
            });
            display += '\n';
        }
        display += chalk.gray('Press Ctrl+C to exit');
        return boxen(display, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        });
    }
    async showBeautifulDisplay() {
        const todos = await this.loadTodos();
        console.log(this.generateDisplayStatic(todos));
    }
    async watchTodos() {
        // Clear screen initially
        console.clear();
        // Display initial state
        const todos = await this.loadTodos();
        console.log(this.generateDisplay(todos));
        // Set up file watching for real-time updates
        try {
            const watcher = watch(this.todoFile, { persistent: true }, async (eventType) => {
                if (eventType === 'change') {
                    // Small delay to ensure file write is complete
                    setTimeout(async () => {
                        try {
                            console.clear();
                            const updatedTodos = await this.loadTodos();
                            console.log(this.generateDisplay(updatedTodos));
                        }
                        catch (error) {
                            // File might be temporarily unavailable during write
                        }
                    }, 100);
                }
            });
            // Handle Ctrl+C gracefully
            process.on('SIGINT', () => {
                watcher.close();
                console.clear();
                console.log(chalk.green('\n👋 TodoSystem watch closed. Use "todosystem watch" to restart.'));
                process.exit(0);
            });
            // Keep the process alive
            await new Promise(() => { }); // This will run indefinitely until Ctrl+C
        }
        catch (error) {
            console.error(chalk.red('❌ Error setting up file watcher. Falling back to static display.'));
            console.log(this.generateDisplay(todos));
        }
    }
    async updateTodo(id, updates) {
        const todos = await this.loadTodos();
        const todoIndex = todos.findIndex(todo => todo.id.startsWith(id));
        if (todoIndex === -1) {
            console.error(chalk.red(`❌ Todo with ID ${id} not found`));
            return;
        }
        const currentTodo = todos[todoIndex];
        if (!currentTodo) {
            console.error(chalk.red(`❌ Todo with ID ${id} not found`));
            return;
        }
        todos[todoIndex] = {
            ...currentTodo,
            ...updates
        };
        await this.saveTodos(todos);
        console.log(chalk.green(`✅ Updated todo: ${todos[todoIndex]?.content}`));
    }
    async deleteTodo(id) {
        const todos = await this.loadTodos();
        const todoIndex = todos.findIndex(todo => todo.id.startsWith(id));
        if (todoIndex === -1) {
            console.error(chalk.red(`❌ Todo with ID ${id} not found`));
            return;
        }
        const deletedTodo = todos.splice(todoIndex, 1)[0];
        if (!deletedTodo) {
            console.error(chalk.red(`❌ Error deleting todo with ID ${id}`));
            return;
        }
        await this.saveTodos(todos);
        console.log(chalk.green(`✅ Deleted todo: ${deletedTodo.content}`));
    }
    async status() {
        const todos = await this.loadTodos();
        const pending = todos.filter(t => t.status === 'pending').length;
        const inProgress = todos.filter(t => t.status === 'in_progress').length;
        const completed = todos.filter(t => t.status === 'completed').length;
        console.log(chalk.blue('📊 TodoSystem Status:'));
        console.log(chalk.yellow(`  ⏳ Pending: ${pending}`));
        console.log(chalk.blue(`  🔄 In Progress: ${inProgress}`));
        console.log(chalk.green(`  ✅ Completed: ${completed}`));
        console.log(chalk.gray(`  📋 Total: ${todos.length}`));
    }
}
const program = new Command();
const cli = new TodoSystemCLI();
program
    .name('todosystem')
    .description('CLI tool for managing todos with Cursor integration')
    .version('1.0.0');
program
    .command('init')
    .description('Initialize todosystem in current project')
    .action(async () => {
    await cli.init();
});
program
    .command('add <content>')
    .description('Add a new todo item')
    .option('-p, --priority <priority>', 'Priority level (high, medium, low)', 'medium')
    .action(async (content, options) => {
    await cli.addTodo(content, options.priority);
});
program
    .command('list')
    .description('List all todos')
    .action(async () => {
    await cli.listTodos();
});
program
    .command('show')
    .description('Show beautiful todo dashboard (static snapshot)')
    .action(async () => {
    await cli.showBeautifulDisplay();
});
program
    .command('watch')
    .description('Watch todos with real-time updates (live dashboard)')
    .action(async () => {
    await cli.watchTodos();
});
program
    .command('update <id>')
    .description('Update a todo item')
    .option('-c, --content <content>', 'Update content')
    .option('-s, --status <status>', 'Update status (pending, in_progress, completed)')
    .option('-p, --priority <priority>', 'Update priority (high, medium, low)')
    .action(async (id, options) => {
    const updates = {};
    if (options.content)
        updates.content = options.content;
    if (options.status)
        updates.status = options.status;
    if (options.priority)
        updates.priority = options.priority;
    await cli.updateTodo(id, updates);
});
program
    .command('delete <id>')
    .description('Delete a todo item')
    .action(async (id) => {
    await cli.deleteTodo(id);
});
program
    .command('status')
    .description('Show todo status summary')
    .action(async () => {
    await cli.status();
});
program.parse();
//# sourceMappingURL=cli.js.map