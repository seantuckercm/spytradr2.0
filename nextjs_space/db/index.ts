
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Connection for queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Connection for migrations
export const migrationClient = postgres(connectionString, { max: 1 });
