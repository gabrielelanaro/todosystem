/**
 * Priority levels for todo items
 */
export type TodoPriority = 'high' | 'medium' | 'low';

/**
 * Status types for todo items
 */
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Main Todo item interface
 */
export interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
  priority: TodoPriority;
}

/**
 * Todo List metadata interface
 */
export interface TodoList {
  name: string;
  description?: string;
  created: string; // ISO date string
  lastModified: string; // ISO date string
  totalTodos: number;
  completedTodos: number;
}

/**
 * Todo lists metadata storage interface
 */
export interface TodoListsMetadata {
  activeList: string;
  lists: Record<string, Omit<TodoList, 'name'>>;
}

/**
 * Parameters for adding a new todo
 */
export interface AddTodoParams {
  content: string;
  priority?: TodoPriority;
  list_name?: string; // Optional list name, defaults to active list
}

/**
 * Parameters for updating a todo
 */
export interface UpdateTodoParams {
  id: string;
  content?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  list_name?: string; // Optional list name, defaults to active list
}

/**
 * Parameters for deleting a todo
 */
export interface DeleteTodoParams {
  id: string;
  list_name?: string; // Optional list name, defaults to active list
}

/**
 * Parameters for writing/replacing the entire todo list
 */
export interface WriteTodosParams {
  todos: TodoItem[];
  list_name?: string; // Optional list name, defaults to active list
}

/**
 * Parameters for reading todo list
 */
export interface ReadTodosParams {
  list_name?: string; // Optional list name, defaults to active list
}

/**
 * Parameters for creating a new todo list
 */
export interface CreateListParams {
  list_name: string;
  description?: string;
}

/**
 * Parameters for deleting a todo list
 */
export interface DeleteListParams {
  list_name: string;
}

/**
 * Parameters for switching active todo list
 */
export interface SwitchListParams {
  list_name: string;
}

/**
 * MCP Tool response content interface
 */
export interface MCPTextContent {
  type: 'text';
  text: string;
}

/**
 * MCP Tool response interface
 */
export interface MCPToolResponse {
  content: MCPTextContent[];
  isError?: boolean;
}

/**
 * MCP Tool call arguments - generic type for tool parameters
 */
export type MCPToolArgs = 
  | AddTodoParams 
  | UpdateTodoParams 
  | DeleteTodoParams 
  | WriteTodosParams 
  | ReadTodosParams
  | CreateListParams
  | DeleteListParams
  | SwitchListParams
  | Record<string, never>;

/**
 * Utility functions for determining todo storage directory
 */
import os from 'os';
import path from 'path';

/**
 * Get the todo system directory path
 * Priority:
 * 1. TODOSYSTEM_DIR environment variable
 * 2. User home directory + .todosystem
 * 3. Fallback to current working directory + .todosystem
 */
export function getTodoSystemDir(): string {
  // Check environment variable first
  if (process.env.TODOSYSTEM_DIR) {
    return process.env.TODOSYSTEM_DIR;
  }
  
  // Default to user home directory
  try {
    const homeDir = os.homedir();
    return path.join(homeDir, '.todosystem');
  } catch (error) {
    // Fallback to current working directory if home directory is not accessible
    return path.join(process.cwd(), '.todosystem');
  }
}

/**
 * Check if there's an existing .todosystem directory in the current project
 * that should be migrated to the new location
 */
export function getProjectTodoSystemDir(): string {
  return path.join(process.cwd(), '.todosystem');
} 