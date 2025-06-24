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
export function getTodoSystemDir() {
    // Check environment variable first
    if (process.env.TODOSYSTEM_DIR) {
        return process.env.TODOSYSTEM_DIR;
    }
    // Default to user home directory
    try {
        const homeDir = os.homedir();
        return path.join(homeDir, '.todosystem');
    }
    catch (error) {
        // Fallback to current working directory if home directory is not accessible
        return path.join(process.cwd(), '.todosystem');
    }
}
/**
 * Check if there's an existing .todosystem directory in the current project
 * that should be migrated to the new location
 */
export function getProjectTodoSystemDir() {
    return path.join(process.cwd(), '.todosystem');
}
//# sourceMappingURL=types.js.map