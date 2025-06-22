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
 * Parameters for adding a new todo
 */
export interface AddTodoParams {
    content: string;
    priority?: TodoPriority;
}
/**
 * Parameters for updating a todo
 */
export interface UpdateTodoParams {
    id: string;
    content?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
}
/**
 * Parameters for deleting a todo
 */
export interface DeleteTodoParams {
    id: string;
}
/**
 * Parameters for writing/replacing the entire todo list
 */
export interface WriteTodosParams {
    todos: TodoItem[];
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
export type MCPToolArgs = AddTodoParams | UpdateTodoParams | DeleteTodoParams | WriteTodosParams | Record<string, never>;
