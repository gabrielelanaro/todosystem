#!/usr/bin/env node
import { TodoItem, TodoPriority, TodoList } from "./types.js";
export declare class TodoManager {
    private todoSystemDir;
    private listsDir;
    private metadataFile;
    private legacyTodoFile;
    constructor();
    private findTodoSystemDir;
    private init;
    private ensureDirectories;
    private migrateLegacyData;
    private ensureDefaultList;
    private loadMetadata;
    private saveMetadata;
    private loadList;
    private saveList;
    generateId(): string;
    createList(listName: string, description?: string): Promise<TodoList>;
    deleteList(listName: string): Promise<void>;
    switchActiveList(listName: string): Promise<void>;
    listTodoLists(): Promise<TodoList[]>;
    getActiveListName(): Promise<string>;
    readTodos(listName?: string): Promise<TodoItem[]>;
    writeTodos(todos: TodoItem[], listName?: string): Promise<TodoItem[]>;
    addTodo(content: string, priority?: TodoPriority, listName?: string): Promise<TodoItem>;
    updateTodo(id: string, updates: Partial<Omit<TodoItem, 'id'>>, listName?: string): Promise<TodoItem>;
    deleteTodo(id: string, listName?: string): Promise<TodoItem>;
}
