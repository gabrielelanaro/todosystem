#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs, watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import {
  TodoItem,
  TodoPriority,
  TodoStatus,
  TodoList,
  TodoListsMetadata,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TodoSystemCLI {
  private todoSystemDir: string;
  private listsDir: string;
  private metadataFile: string;
  private legacyTodoFile: string;

  constructor() {
    this.todoSystemDir = path.join(process.cwd(), '.todosystem');
    this.listsDir = path.join(this.todoSystemDir, 'lists');
    this.metadataFile = path.join(this.todoSystemDir, 'metadata.json');
    this.legacyTodoFile = path.join(this.todoSystemDir, 'todos.json');
  }

  async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.todoSystemDir, { recursive: true });
      await fs.mkdir(this.listsDir, { recursive: true });
    } catch (error) {
      // Directories might already exist
    }
  }

  private async migrateLegacyData(): Promise<void> {
    try {
      // Check if legacy todos.json exists
      const legacyData = await fs.readFile(this.legacyTodoFile, 'utf8');
      const legacyTodos = JSON.parse(legacyData) as TodoItem[];
      
      // Check if metadata already exists
      try {
        await fs.access(this.metadataFile);
        return; // Already migrated
      } catch {
        // Need to migrate
      }

      // Create default list with legacy todos
      if (legacyTodos.length > 0) {
        const defaultListFile = path.join(this.listsDir, 'default.json');
        await fs.writeFile(defaultListFile, JSON.stringify(legacyTodos, null, 2));
        
        // Create metadata
        const metadata: TodoListsMetadata = {
          activeList: 'default',
          lists: {
            default: {
              description: 'Default todo list (migrated from legacy)',
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              totalTodos: legacyTodos.length,
              completedTodos: legacyTodos.filter(t => t.status === 'completed').length
            }
          }
        };
        await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
        
        // Remove legacy file
        await fs.unlink(this.legacyTodoFile);
        
        console.log(chalk.green('✅ Migrated legacy todos.json to new multi-list format!'));
      }
    } catch (error) {
      // No legacy file or other error, continue
    }
  }

  private async ensureDefaultList(): Promise<void> {
    try {
      await fs.access(this.metadataFile);
    } catch {
      // Create default metadata and list
      const metadata: TodoListsMetadata = {
        activeList: 'default',
        lists: {
          default: {
            description: 'Default todo list',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            totalTodos: 0,
            completedTodos: 0
          }
        }
      };
      await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
      
      const defaultListFile = path.join(this.listsDir, 'default.json');
      await fs.writeFile(defaultListFile, JSON.stringify([], null, 2));
    }
  }

  async loadMetadata(): Promise<TodoListsMetadata> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf8');
      return JSON.parse(data) as TodoListsMetadata;
    } catch (error) {
      throw new Error('TodoSystem not initialized. Run "todosystem init" first.');
    }
  }

  async saveMetadata(metadata: TodoListsMetadata): Promise<void> {
    await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
  }

  async loadList(listName: string): Promise<TodoItem[]> {
    try {
      const listFile = path.join(this.listsDir, `${listName}.json`);
      const data = await fs.readFile(listFile, 'utf8');
      return JSON.parse(data) as TodoItem[];
    } catch (error) {
      throw new Error(`List '${listName}' not found`);
    }
  }

  async saveList(listName: string, todos: TodoItem[]): Promise<void> {
    const listFile = path.join(this.listsDir, `${listName}.json`);
    await fs.writeFile(listFile, JSON.stringify(todos, null, 2));
    
    // Update metadata
    const metadata = await this.loadMetadata();
    if (metadata.lists[listName]) {
      metadata.lists[listName].lastModified = new Date().toISOString();
      metadata.lists[listName].totalTodos = todos.length;
      metadata.lists[listName].completedTodos = todos.filter(t => t.status === 'completed').length;
      await this.saveMetadata(metadata);
    }
  }

  async getActiveListName(): Promise<string> {
    const metadata = await this.loadMetadata();
    return metadata.activeList;
  }

  async loadTodos(listName?: string): Promise<TodoItem[]> {
    const targetList = listName || await this.getActiveListName();
    return await this.loadList(targetList);
  }

  async saveTodos(todos: TodoItem[], listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    await this.saveList(targetList, todos);
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  }

  async init(): Promise<void> {
    await this.ensureDirectories();
    await this.migrateLegacyData();
    await this.ensureDefaultList();
    
    // Copy todosystem.mdc to .cursor/rules/
    const cursorRulesDir = path.join(process.cwd(), '.cursor', 'rules');
    try {
      await fs.mkdir(cursorRulesDir, { recursive: true });
      const templatePath = path.join(__dirname, '..', 'templates', 'todosystem.mdc');
      const targetPath = path.join(cursorRulesDir, 'todosystem.mdc');
      await fs.copyFile(templatePath, targetPath);
      
      console.log(chalk.green('✅ TodoSystem initialized successfully!'));
      console.log(chalk.blue(`📁 Created .todosystem directory with multiple lists support`));
      console.log(chalk.blue(`📋 Added todosystem.mdc to .cursor/rules/`));
      
      // Show MCP configuration
      this.showMCPConfig();
      
    } catch (error) {
      console.error(chalk.red('❌ Error during initialization:'), error);
    }
  }

  showMCPConfig(): void {
    const mcpConfig = {
      "mcpServers": {
        "todosystem": {
          "command": "node",
          "args": [path.join(__dirname, "mcp-server.js")]
        }
      }
    };

    console.log('\n' + boxen(
      chalk.yellow.bold('📋 MCP Configuration for Cursor\n\n') +
      chalk.gray('Add this to your Cursor settings:\n\n') +
      chalk.cyan(JSON.stringify(mcpConfig, null, 2)),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow'
      }
    ));
  }

  async createList(listName: string, description?: string): Promise<void> {
    if (!listName || listName.includes('/') || listName.includes('\\')) {
      console.error(chalk.red('❌ Invalid list name. List names cannot contain / or \\ characters.'));
      return;
    }

    const metadata = await this.loadMetadata();
    if (metadata.lists[listName]) {
      console.error(chalk.red(`❌ List '${listName}' already exists.`));
      return;
    }

    // Create new list
    const newList: Omit<TodoList, 'name'> = {
      description: description || '',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      totalTodos: 0,
      completedTodos: 0
    };

    metadata.lists[listName] = newList;
    await this.saveMetadata(metadata);

    // Create empty list file
    const listFile = path.join(this.listsDir, `${listName}.json`);
    await fs.writeFile(listFile, JSON.stringify([], null, 2));

    console.log(chalk.green(`✅ Created todo list '${listName}'`));
  }

  async deleteList(listName: string): Promise<void> {
    if (listName === 'default') {
      console.error(chalk.red('❌ Cannot delete the default list.'));
      return;
    }

    const metadata = await this.loadMetadata();
    if (!metadata.lists[listName]) {
      console.error(chalk.red(`❌ List '${listName}' not found.`));
      return;
    }

    // Remove from metadata
    delete metadata.lists[listName];
    
    // If this was the active list, switch to default
    if (metadata.activeList === listName) {
      metadata.activeList = 'default';
      console.log(chalk.yellow(`⚠️  Switched active list to 'default'`));
    }

    await this.saveMetadata(metadata);

    // Remove list file
    const listFile = path.join(this.listsDir, `${listName}.json`);
    try {
      await fs.unlink(listFile);
    } catch (error) {
      // File might not exist, continue
    }

    console.log(chalk.green(`✅ Deleted todo list '${listName}'`));
  }

  async switchList(listName: string): Promise<void> {
    const metadata = await this.loadMetadata();
    if (!metadata.lists[listName]) {
      console.error(chalk.red(`❌ List '${listName}' not found.`));
      return;
    }

    metadata.activeList = listName;
    await this.saveMetadata(metadata);
    
    console.log(chalk.green(`✅ Switched active list to '${listName}'`));
  }

  async listTodoLists(): Promise<void> {
    const metadata = await this.loadMetadata();
    const lists = Object.entries(metadata.lists).map(([name, listData]) => ({
      name,
      ...listData
    }));

    if (lists.length === 0) {
      console.log(chalk.yellow('📝 No todo lists found.'));
      return;
    }

    const table = new Table({
      head: ['List Name', 'Description', 'Total', 'Completed', 'Created', 'Active'],
      colWidths: [15, 30, 8, 10, 12, 8]
    });

    lists.forEach(list => {
      const completionRate = list.totalTodos > 0 ? Math.round((list.completedTodos / list.totalTodos) * 100) : 0;
      const isActive = list.name === metadata.activeList;
      
      table.push([
        isActive ? chalk.green.bold(list.name) : list.name,
        list.description || chalk.gray('No description'),
        list.totalTodos.toString(),
        `${list.completedTodos} (${completionRate}%)`,
        new Date(list.created).toLocaleDateString(),
        isActive ? chalk.green('✓') : chalk.gray('-')
      ]);
    });

    console.log(table.toString());
    console.log(chalk.blue(`\n📋 Active list: ${chalk.green.bold(metadata.activeList)}`));
  }

  private generateDisplayStatic(todos: TodoItem[], listName: string): string {
    if (todos.length === 0) {
      return boxen(
        chalk.yellow('📝 No todos found.\n\nUse "todosystem add <content>" to create your first todo!'),
        { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
      );
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

  private generateDisplay(todos: TodoItem[], listName: string): string {
    if (todos.length === 0) {
      return boxen(
        chalk.yellow('📝 No todos found.\n\nUse "todosystem add <content>" to create your first todo!'),
        { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
      );
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

  async showBeautifulDisplay(listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    const todos = await this.loadList(targetList);
    console.log(this.generateDisplayStatic(todos, targetList));
  }

  async watchTodos(listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    const listFile = path.join(this.listsDir, `${targetList}.json`);
    
    // Clear screen initially
    console.clear();
    
    // Display initial state
    const todos = await this.loadList(targetList);
    console.log(this.generateDisplay(todos, targetList));
    
    // Set up file watching for real-time updates
    try {
      const watcher = watch(listFile, { persistent: true }, async (eventType) => {
        if (eventType === 'change') {
          // Small delay to ensure file write is complete
          setTimeout(async () => {
            try {
              console.clear();
              const updatedTodos = await this.loadList(targetList);
              console.log(this.generateDisplay(updatedTodos, targetList));
            } catch (error) {
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
      await new Promise(() => {}); // This will run indefinitely until Ctrl+C
      
    } catch (error) {
      console.error(chalk.red('❌ Error setting up file watcher. Falling back to static display.'));
      console.log(this.generateDisplay(todos, targetList));
    }
  }

  async updateTodo(id: string, updates: Partial<Omit<TodoItem, 'id'>>, listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    const todos = await this.loadList(targetList);
    const todoIndex = todos.findIndex(todo => todo.id.startsWith(id));
    
    if (todoIndex === -1) {
      console.error(chalk.red(`❌ Todo with ID ${id} not found in list '${targetList}'`));
      return;
    }
    
    const currentTodo = todos[todoIndex];
    if (!currentTodo) {
      console.error(chalk.red(`❌ Todo with ID ${id} not found in list '${targetList}'`));
      return;
    }
    
    todos[todoIndex] = {
      ...currentTodo,
      ...updates
    };
    
    await this.saveList(targetList, todos);
    console.log(chalk.green(`✅ Updated todo in '${targetList}': ${todos[todoIndex]?.content}`));
  }

  async deleteTodo(id: string, listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    const todos = await this.loadList(targetList);
    const todoIndex = todos.findIndex(todo => todo.id.startsWith(id));
    
    if (todoIndex === -1) {
      console.error(chalk.red(`❌ Todo with ID ${id} not found in list '${targetList}'`));
      return;
    }
    
    const deletedTodo = todos.splice(todoIndex, 1)[0];
    if (!deletedTodo) {
      console.error(chalk.red(`❌ Error deleting todo with ID ${id} from list '${targetList}'`));
      return;
    }
    
    await this.saveList(targetList, todos);
    console.log(chalk.green(`✅ Deleted todo from '${targetList}': ${deletedTodo.content}`));
  }

  async status(listName?: string): Promise<void> {
    if (listName) {
      // Show status for specific list
      const todos = await this.loadList(listName);
      const pending = todos.filter(t => t.status === 'pending').length;
      const inProgress = todos.filter(t => t.status === 'in_progress').length;
      const completed = todos.filter(t => t.status === 'completed').length;
      
      console.log(chalk.blue(`📊 TodoSystem Status for '${listName}':`));
      console.log(chalk.yellow(`  ⏳ Pending: ${pending}`));
      console.log(chalk.blue(`  🔄 In Progress: ${inProgress}`));
      console.log(chalk.green(`  ✅ Completed: ${completed}`));
      console.log(chalk.gray(`  📋 Total: ${todos.length}`));
    } else {
      // Show status for all lists
      const metadata = await this.loadMetadata();
      const lists = Object.entries(metadata.lists);
      
      console.log(chalk.blue('📊 TodoSystem Status (All Lists):'));
      console.log(chalk.green(`🎯 Active List: ${metadata.activeList}\n`));
      
      for (const [name, listData] of lists) {
        const completionRate = listData.totalTodos > 0 ? Math.round((listData.completedTodos / listData.totalTodos) * 100) : 0;
        const isActive = name === metadata.activeList;
        const prefix = isActive ? chalk.green('→') : ' ';
        
        console.log(`${prefix} ${chalk.bold(name)}: ${listData.totalTodos} todos (${completionRate}% complete)`);
      }
    }
  }

  async addTodo(content: string, priority: TodoPriority = 'medium', listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    const todos = await this.loadList(targetList);
    
    const newTodo: TodoItem = {
      id: this.generateId(),
      content,
      status: 'pending',
      priority
    };
    
    todos.push(newTodo);
    await this.saveList(targetList, todos);
    
    console.log(chalk.green(`✅ Added todo to '${targetList}': ${content}`));
  }

  async listTodos(listName?: string): Promise<void> {
    const targetList = listName || await this.getActiveListName();
    const todos = await this.loadList(targetList);
    
    if (todos.length === 0) {
      console.log(chalk.yellow(`📝 No todos found in list '${targetList}'. Use "todosystem add <content>" to create one.`));
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

    console.log(chalk.blue(`📋 Todos in list '${targetList}':`));
    console.log(table.toString());
  }
}

const program = new Command();
const cli = new TodoSystemCLI();

program
  .name('todosystem')
  .description('CLI tool for managing todos with multiple lists and Cursor integration')
  .version('2.0.0');

program
  .command('init')
  .description('Initialize todosystem in current project')
  .action(async () => {
    await cli.init();
  });

// List management commands
program
  .command('create <list-name>')
  .description('Create a new todo list')
  .option('-d, --description <description>', 'Description for the list')
  .action(async (listName: string, options: { description?: string }) => {
    await cli.createList(listName, options.description);
  });

program
  .command('lists')
  .description('Show all todo lists with summary stats')
  .action(async () => {
    await cli.listTodoLists();
  });

program
  .command('switch <list-name>')
  .description('Set active/default list')
  .action(async (listName: string) => {
    await cli.switchList(listName);
  });

program
  .command('delete-list <list-name>')
  .description('Delete entire todo list (cannot delete default)')
  .action(async (listName: string) => {
    await cli.deleteList(listName);
  });

// Todo management commands (updated with list support)
program
  .command('add <content>')
  .description('Add a new todo item')
  .option('-p, --priority <priority>', 'Priority level (high, medium, low)', 'medium')
  .option('-l, --list <list-name>', 'Todo list to add to (defaults to active list)')
  .action(async (content: string, options: { priority: TodoPriority; list?: string }) => {
    await cli.addTodo(content, options.priority, options.list);
  });

program
  .command('list')
  .description('List all todos')
  .option('-l, --list <list-name>', 'Todo list to show (defaults to active list)')
  .action(async (options: { list?: string }) => {
    await cli.listTodos(options.list);
  });

program
  .command('show')
  .description('Show beautiful todo dashboard (static snapshot)')
  .option('-l, --list <list-name>', 'Todo list to show (defaults to active list)')
  .action(async (options: { list?: string }) => {
    await cli.showBeautifulDisplay(options.list);
  });

program
  .command('watch')
  .description('Watch todos with real-time updates (live dashboard)')
  .option('-l, --list <list-name>', 'Todo list to watch (defaults to active list)')
  .action(async (options: { list?: string }) => {
    await cli.watchTodos(options.list);
  });

program
  .command('update <id>')
  .description('Update a todo item')
  .option('-c, --content <content>', 'Update content')
  .option('-s, --status <status>', 'Update status (pending, in_progress, completed)')
  .option('-p, --priority <priority>', 'Update priority (high, medium, low)')
  .option('-l, --list <list-name>', 'Todo list containing the item (defaults to active list)')
  .action(async (id: string, options: { content?: string; status?: TodoStatus; priority?: TodoPriority; list?: string }) => {
    const updates: Partial<Omit<TodoItem, 'id'>> = {};
    if (options.content) updates.content = options.content;
    if (options.status) updates.status = options.status;
    if (options.priority) updates.priority = options.priority;
    
    await cli.updateTodo(id, updates, options.list);
  });

program
  .command('delete <id>')
  .description('Delete a todo item')
  .option('-l, --list <list-name>', 'Todo list containing the item (defaults to active list)')
  .action(async (id: string, options: { list?: string }) => {
    await cli.deleteTodo(id, options.list);
  });

program
  .command('status')
  .description('Show todo status summary')
  .option('-l, --list <list-name>', 'Show status for specific list (defaults to all lists)')
  .action(async (options: { list?: string }) => {
    await cli.status(options.list);
  });

program.parse();