import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Basic hello world function
function greet(name: string): string {
    return `Hello, ${name}! Welcome to UsdtJodExchange platform.`;
}

// Log some basic information
console.log(greet('World'));
console.log(`Node.js Version: ${process.version}`);
console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
console.log('TypeScript is working correctly!') 