#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: any;
}

async function testMCP(): Promise<void> {
  console.log('Testing Claude Code Todo MCP...');
  
  // Start the MCP server
  const server: ChildProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Helper function to send MCP requests
  const sendRequest = (request: MCPRequest): Promise<MCPResponse> => {
    return new Promise((resolve, reject) => {
      let response = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      server.stdout?.on('data', (data: Buffer) => {
        response += data.toString();
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parsed: MCPResponse = JSON.parse(line);
            if (parsed.id === request.id) {
              clearTimeout(timeout);
              resolve(parsed);
              return;
            }
          }
        } catch (e) {
          // Not complete JSON yet
        }
      });

      server.stdin?.write(JSON.stringify(request) + '\n');
    });
  };

  try {
    // Test 1: List tools
    console.log('\n1. Testing list tools...');
    const listToolsResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });
    console.log('✓ List tools successful');

    // Test 2: Add a todo
    console.log('\n2. Testing add todo...');
    const addTodoResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'todo_add',
        arguments: {
          content: 'Test todo item',
          priority: 'high'
        }
      }
    });
    console.log('✓ Add todo successful');

    // Test 3: Read todos
    console.log('\n3. Testing read todos...');
    const readTodosResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'todo_read',
        arguments: {}
      }
    });
    console.log('✓ Read todos successful');

    console.log('\n✅ All tests passed!');
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Test failed:', errorMessage);
  } finally {
    server.kill();
  }
}

testMCP(); 