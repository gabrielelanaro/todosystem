#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTodoSystemDir, } from "./types.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class TodoManager {
    constructor() {
        this.todoSystemDir = getTodoSystemDir();
        this.listsDir = path.join(this.todoSystemDir, 'lists');
        this.metadataFile = path.join(this.todoSystemDir, 'metadata.json');
        this.legacyTodoFile = path.join(this.todoSystemDir, 'todos.json');
        this.init();
    }
    async init() {
        await this.ensureDirectories();
        await this.migrateLegacyData();
        await this.ensureDefaultList();
    }
    async ensureDirectories() {
        try {
            await fs.mkdir(this.todoSystemDir, { recursive: true });
            await fs.mkdir(this.listsDir, { recursive: true });
        }
        catch (error) {
            // Directories might already exist
        }
    }
    async migrateLegacyData() {
        try {
            // Check if legacy todos.json exists
            const legacyData = await fs.readFile(this.legacyTodoFile, 'utf8');
            const legacyTodos = JSON.parse(legacyData);
            // Check if metadata already exists
            try {
                await fs.access(this.metadataFile);
                return; // Already migrated
            }
            catch {
                // Need to migrate
            }
            // Create default list with legacy todos
            if (legacyTodos.length > 0) {
                const defaultListFile = path.join(this.listsDir, 'default.json');
                await fs.writeFile(defaultListFile, JSON.stringify(legacyTodos, null, 2));
                // Create metadata
                const metadata = {
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
            }
        }
        catch (error) {
            // No legacy file or other error, continue
        }
    }
    async ensureDefaultList() {
        try {
            await fs.access(this.metadataFile);
        }
        catch {
            // Create default metadata and list
            const metadata = {
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
    async loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            throw new Error('Failed to load metadata');
        }
    }
    async saveMetadata(metadata) {
        await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
    }
    async loadList(listName) {
        try {
            const listFile = path.join(this.listsDir, `${listName}.json`);
            const data = await fs.readFile(listFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            throw new Error(`List '${listName}' not found`);
        }
    }
    async saveList(listName, todos) {
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
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 11);
    }
    async createList(listName, description) {
        if (!listName || listName.includes('/') || listName.includes('\\')) {
            throw new Error('Invalid list name');
        }
        const metadata = await this.loadMetadata();
        if (metadata.lists[listName]) {
            throw new Error(`List '${listName}' already exists`);
        }
        // Create new list
        const newList = {
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
        return { name: listName, ...newList };
    }
    async deleteList(listName) {
        if (listName === 'default') {
            throw new Error('Cannot delete default list');
        }
        const metadata = await this.loadMetadata();
        if (!metadata.lists[listName]) {
            throw new Error(`List '${listName}' not found`);
        }
        // Remove from metadata
        delete metadata.lists[listName];
        // If this was the active list, switch to default
        if (metadata.activeList === listName) {
            metadata.activeList = 'default';
        }
        await this.saveMetadata(metadata);
        // Remove list file
        const listFile = path.join(this.listsDir, `${listName}.json`);
        try {
            await fs.unlink(listFile);
        }
        catch (error) {
            // File might not exist, continue
        }
    }
    async switchActiveList(listName) {
        const metadata = await this.loadMetadata();
        if (!metadata.lists[listName]) {
            throw new Error(`List '${listName}' not found`);
        }
        metadata.activeList = listName;
        await this.saveMetadata(metadata);
    }
    async listTodoLists() {
        const metadata = await this.loadMetadata();
        return Object.entries(metadata.lists).map(([name, listData]) => ({
            name,
            ...listData
        }));
    }
    async getActiveListName() {
        const metadata = await this.loadMetadata();
        return metadata.activeList;
    }
    async readTodos(listName) {
        const targetList = listName || await this.getActiveListName();
        return await this.loadList(targetList);
    }
    async writeTodos(todos, listName) {
        const targetList = listName || await this.getActiveListName();
        await this.saveList(targetList, todos);
        return todos;
    }
    async addTodo(content, priority = 'medium', listName) {
        const targetList = listName || await this.getActiveListName();
        const todos = await this.loadList(targetList);
        const newTodo = {
            id: this.generateId(),
            content: content,
            status: 'pending',
            priority: priority
        };
        todos.push(newTodo);
        await this.saveList(targetList, todos);
        return newTodo;
    }
    async updateTodo(id, updates, listName) {
        const targetList = listName || await this.getActiveListName();
        const todos = await this.loadList(targetList);
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) {
            throw new Error(`Todo with id ${id} not found in list '${targetList}'`);
        }
        const currentTodo = todos[todoIndex];
        const updatedTodo = {
            id: currentTodo.id,
            content: updates.content ?? currentTodo.content,
            status: updates.status ?? currentTodo.status,
            priority: updates.priority ?? currentTodo.priority,
        };
        todos[todoIndex] = updatedTodo;
        await this.saveList(targetList, todos);
        return updatedTodo;
    }
    async deleteTodo(id, listName) {
        const targetList = listName || await this.getActiveListName();
        const todos = await this.loadList(targetList);
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) {
            throw new Error(`Todo with id ${id} not found in list '${targetList}'`);
        }
        const deletedTodo = todos.splice(todoIndex, 1)[0];
        await this.saveList(targetList, todos);
        return deletedTodo;
    }
}
const server = new Server({
    name: "todosystem-mcp",
    version: "2.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const todoManager = new TodoManager();
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "todo_read",
                description: "Read the current todo list",
                inputSchema: {
                    type: "object",
                    properties: {
                        list_name: {
                            type: "string",
                            description: "Name of the todo list to read (optional, defaults to active list)"
                        }
                    },
                    additionalProperties: false,
                },
            },
            {
                name: "todo_write",
                description: "Write/replace the entire todo list",
                inputSchema: {
                    type: "object",
                    properties: {
                        todos: {
                            type: "array",
                            description: "Array of todo items",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    content: { type: "string" },
                                    status: {
                                        type: "string",
                                        enum: ["pending", "in_progress", "completed"]
                                    },
                                    priority: {
                                        type: "string",
                                        enum: ["high", "medium", "low"]
                                    }
                                },
                                required: ["id", "content", "status", "priority"],
                                additionalProperties: false
                            }
                        },
                        list_name: {
                            type: "string",
                            description: "Name of the todo list to write to (optional, defaults to active list)"
                        }
                    },
                    required: ["todos"],
                    additionalProperties: false,
                },
            },
            {
                name: "todo_add",
                description: "Add a new todo item",
                inputSchema: {
                    type: "object",
                    properties: {
                        content: {
                            type: "string",
                            description: "The content of the todo item",
                        },
                        priority: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                            description: "Priority of the todo item",
                            default: "medium"
                        },
                        list_name: {
                            type: "string",
                            description: "Name of the todo list to add to (optional, defaults to active list)"
                        }
                    },
                    required: ["content"],
                    additionalProperties: false,
                },
            },
            {
                name: "todo_update",
                description: "Update an existing todo item",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "The ID of the todo item to update",
                        },
                        content: {
                            type: "string",
                            description: "Updated content (optional)",
                        },
                        status: {
                            type: "string",
                            enum: ["pending", "in_progress", "completed"],
                            description: "Updated status (optional)",
                        },
                        priority: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                            description: "Updated priority (optional)",
                        },
                        list_name: {
                            type: "string",
                            description: "Name of the todo list containing the item (optional, defaults to active list)"
                        }
                    },
                    required: ["id"],
                    additionalProperties: false,
                },
            },
            {
                name: "todo_delete",
                description: "Delete a todo item",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "The ID of the todo item to delete",
                        },
                        list_name: {
                            type: "string",
                            description: "Name of the todo list containing the item (optional, defaults to active list)"
                        }
                    },
                    required: ["id"],
                    additionalProperties: false,
                },
            },
            {
                name: "todo_list_create",
                description: "Create a new todo list",
                inputSchema: {
                    type: "object",
                    properties: {
                        list_name: {
                            type: "string",
                            description: "Name of the new todo list",
                        },
                        description: {
                            type: "string",
                            description: "Description of the todo list (optional)",
                        }
                    },
                    required: ["list_name"],
                    additionalProperties: false,
                },
            },
            {
                name: "todo_list_delete",
                description: "Delete a todo list (cannot delete 'default' list)",
                inputSchema: {
                    type: "object",
                    properties: {
                        list_name: {
                            type: "string",
                            description: "Name of the todo list to delete",
                        }
                    },
                    required: ["list_name"],
                    additionalProperties: false,
                },
            },
            {
                name: "todo_lists",
                description: "List all available todo lists with their metadata",
                inputSchema: {
                    type: "object",
                    properties: {},
                    additionalProperties: false,
                },
            },
            {
                name: "todo_list_switch",
                description: "Switch the active todo list",
                inputSchema: {
                    type: "object",
                    properties: {
                        list_name: {
                            type: "string",
                            description: "Name of the todo list to make active",
                        }
                    },
                    required: ["list_name"],
                    additionalProperties: false,
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "todo_read": {
                const typedArgs = (args || {});
                const todos = await todoManager.readTodos(typedArgs.list_name);
                const activeList = typedArgs.list_name || await todoManager.getActiveListName();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(todos, null, 2),
                        },
                    ],
                };
            }
            case "todo_write": {
                const typedArgs = (args || {});
                if (!typedArgs.todos) {
                    throw new Error('todos parameter is required');
                }
                const updatedTodos = await todoManager.writeTodos(typedArgs.todos, typedArgs.list_name);
                const targetList = typedArgs.list_name || await todoManager.getActiveListName();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Updated todo list '${targetList}' with ${updatedTodos.length} items`,
                        },
                    ],
                };
            }
            case "todo_add": {
                const typedArgs = (args || {});
                if (!typedArgs.content) {
                    throw new Error('content parameter is required');
                }
                const newTodo = await todoManager.addTodo(typedArgs.content, typedArgs.priority, typedArgs.list_name);
                const targetList = typedArgs.list_name || await todoManager.getActiveListName();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Added new todo to '${targetList}': ${JSON.stringify(newTodo, null, 2)}`,
                        },
                    ],
                };
            }
            case "todo_update": {
                const typedArgs = (args || {});
                if (!typedArgs.id) {
                    throw new Error('id parameter is required');
                }
                const updates = {};
                if (typedArgs.content !== undefined)
                    updates.content = typedArgs.content;
                if (typedArgs.status !== undefined)
                    updates.status = typedArgs.status;
                if (typedArgs.priority !== undefined)
                    updates.priority = typedArgs.priority;
                const updatedTodo = await todoManager.updateTodo(typedArgs.id, updates, typedArgs.list_name);
                const targetList = typedArgs.list_name || await todoManager.getActiveListName();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Updated todo in '${targetList}': ${JSON.stringify(updatedTodo, null, 2)}`,
                        },
                    ],
                };
            }
            case "todo_delete": {
                const typedArgs = (args || {});
                if (!typedArgs.id) {
                    throw new Error('id parameter is required');
                }
                const deletedTodo = await todoManager.deleteTodo(typedArgs.id, typedArgs.list_name);
                const targetList = typedArgs.list_name || await todoManager.getActiveListName();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Deleted todo from '${targetList}': ${JSON.stringify(deletedTodo, null, 2)}`,
                        },
                    ],
                };
            }
            case "todo_list_create": {
                const typedArgs = (args || {});
                if (!typedArgs.list_name) {
                    throw new Error('list_name parameter is required');
                }
                const newList = await todoManager.createList(typedArgs.list_name, typedArgs.description);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Created new todo list: ${JSON.stringify(newList, null, 2)}`,
                        },
                    ],
                };
            }
            case "todo_list_delete": {
                const typedArgs = (args || {});
                if (!typedArgs.list_name) {
                    throw new Error('list_name parameter is required');
                }
                await todoManager.deleteList(typedArgs.list_name);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Deleted todo list '${typedArgs.list_name}'`,
                        },
                    ],
                };
            }
            case "todo_lists": {
                const lists = await todoManager.listTodoLists();
                const activeList = await todoManager.getActiveListName();
                const response = {
                    activeList,
                    lists: lists.map(list => ({
                        ...list,
                        isActive: list.name === activeList
                    }))
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(response, null, 2),
                        },
                    ],
                };
            }
            case "todo_list_switch": {
                const typedArgs = (args || {});
                if (!typedArgs.list_name) {
                    throw new Error('list_name parameter is required');
                }
                await todoManager.switchActiveList(typedArgs.list_name);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Switched active todo list to '${typedArgs.list_name}'`,
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("TodoSystem MCP server running on stdio");
}
main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Server error:", errorMessage);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map