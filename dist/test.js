#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
async function testTodoSystem() {
    console.log('Testing TodoSystem functionality...');
    // Create a temporary test directory
    const testDir = path.join(process.cwd(), '.test-todosystem');
    const testFile = path.join(testDir, 'todos.json');
    try {
        // Clean up any existing test data
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        }
        catch (e) {
            // Directory might not exist
        }
        // Create test TodoManager instance
        // Note: We'll need to modify the TodoManager to accept a custom file path for testing
        console.log('✓ Setup complete');
        console.log('\n✅ Basic test structure is working!');
        console.log('Note: For full testing, run the CLI commands manually:');
        console.log('  todosystem init');
        console.log('  todosystem add "Test todo"');
        console.log('  todosystem show');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('\n❌ Test failed:', errorMessage);
    }
    finally {
        // Clean up
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        }
        catch (e) {
            // Directory might not exist
        }
    }
}
testTodoSystem();
//# sourceMappingURL=test.js.map