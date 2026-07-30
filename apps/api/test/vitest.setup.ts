import { initEnv } from '../src/lib/env.js';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_B6JjoMgYUa8X@ep-rough-dawn-azsa0jl6-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeythatislongenoughforhs256';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// This runs before ANY tests and ANY module evaluation
initEnv();
