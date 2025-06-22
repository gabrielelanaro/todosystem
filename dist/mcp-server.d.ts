#!/usr/bin/env node
import { TodoItem, TodoPriority } from "./types.js";
export declare class TodoManager {
    private todoFile;
    private todos;
    constructor();
    private findTodoFile;
    loadTodos(): Promise<void>;
    saveTodos(): Promise<void>;
    generateId(): string;
    readTodos(): Promise<TodoItem[]>;
    writeTodos(todos: TodoItem[]): Promise<TodoItem[]>;
    addTodo(content: string, priority?: TodoPriority): Promise<TodoItem>;
    updateTodo(id: string, updates: Partial<Omit<TodoItem, 'id'>>): Promise<TodoItem>;
    deleteTodo(id: string): Promise<TodoItem>;
}
