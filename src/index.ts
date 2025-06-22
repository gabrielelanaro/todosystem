#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  TodoItem,
  TodoPriority,
  TodoStatus,
  AddTodoParams,
  UpdateTodoParams,
  DeleteTodoParams,
  WriteTodosParams,
  MCPToolResponse,
  MCPToolArgs,
  getTodoSystemDir,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TodoManager {
  private todoFile: string;
  private todos: TodoItem[];

  constructor() {
    const todoSystemDir = getTodoSystemDir();
    this.todoFile = path.join(todoSystemDir, 'todos.json');
    this.todos = [];
    this.loadTodos();
  }

  async loadTodos(): Promise<void> {
    try {
      const data = await fs.readFile(this.todoFile, 'utf8');
      this.todos = JSON.parse(data) as TodoItem[];
    } catch (error) {
      this.todos = [];
    }
  }

  async saveTodos(): Promise<void> {
    await fs.writeFile(this.todoFile, JSON.stringify(this.todos, null, 2));
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  }

  async readTodos(): Promise<TodoItem[]> {
    await this.loadTodos();
    return this.todos;
  }

  async writeTodos(todos: TodoItem[]): Promise<TodoItem[]> {
    this.todos = todos;
    await this.saveTodos();
    return this.todos;
  }

  async addTodo(content: string, priority: TodoPriority = 'medium'): Promise<TodoItem> {
    await this.loadTodos();
    const newTodo: TodoItem = {
      id: this.generateId(),
      content: content,
      status: 'pending',
      priority: priority
    };
    this.todos.push(newTodo);
    await this.saveTodos();
    return newTodo;
  }

  async updateTodo(id: string, updates: Partial<Omit<TodoItem, 'id'>>): Promise<TodoItem> {
    await this.loadTodos();
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }
    
    const currentTodo = this.todos[todoIndex] as TodoItem;
    const updatedTodo: TodoItem = {
      id: currentTodo.id,
      content: updates.content ?? currentTodo.content,
      status: updates.status ?? currentTodo.status,
      priority: updates.priority ?? currentTodo.priority,
    };
    this.todos[todoIndex] = updatedTodo;
    await this.saveTodos();
    return updatedTodo;
  }

  async deleteTodo(id: string): Promise<TodoItem> {
    await this.loadTodos();
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }
    
    const deletedTodo = this.todos.splice(todoIndex, 1)[0] as TodoItem;
    await this.saveTodos();
    return deletedTodo;
  }
}

const server = new Server(
  {
    name: "claude-code-todo-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const todoManager = new TodoManager();

server.setRequestHandler(ListToolsRequestSchema, async (): Promise<{ tools: Tool[] }> => {
  return {
    tools: [
      {
        name: "todo_read",
        description: "Read the current todo list",
        inputSchema: {
          type: "object",
          properties: {},
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
            }
          },
          required: ["id"],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "todo_read": {
        const todos = await todoManager.readTodos();
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
        const typedArgs = args as { todos: TodoItem[] };
        const updatedTodos = await todoManager.writeTodos(typedArgs.todos);
        return {
          content: [
            {
              type: "text",
              text: `Updated todo list with ${updatedTodos.length} items`,
            },
          ],
        };
      }

      case "todo_add": {
        const typedArgs = args as { content: string; priority?: TodoPriority };
        const newTodo = await todoManager.addTodo(typedArgs.content, typedArgs.priority);
        return {
          content: [
            {
              type: "text",
              text: `Added new todo: ${JSON.stringify(newTodo, null, 2)}`,
            },
          ],
        };
      }

      case "todo_update": {
        const typedArgs = args as { id: string; content?: string; status?: TodoStatus; priority?: TodoPriority };
        const updates: Partial<Omit<TodoItem, 'id'>> = {};
        if (typedArgs.content !== undefined) updates.content = typedArgs.content;
        if (typedArgs.status !== undefined) updates.status = typedArgs.status;
        if (typedArgs.priority !== undefined) updates.priority = typedArgs.priority;
        
        const updatedTodo = await todoManager.updateTodo(typedArgs.id, updates);
        return {
          content: [
            {
              type: "text",
              text: `Updated todo: ${JSON.stringify(updatedTodo, null, 2)}`,
            },
          ],
        };
      }

      case "todo_delete": {
        const typedArgs = args as { id: string };
        const deletedTodo = await todoManager.deleteTodo(typedArgs.id);
        return {
          content: [
            {
              type: "text",
              text: `Deleted todo: ${JSON.stringify(deletedTodo, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
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

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude Code Todo MCP server running on stdio");
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Server error:", errorMessage);
  process.exit(1);
}); 