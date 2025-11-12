import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🔄 Running migrations...');

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  await migrate(db, {
    migrationsFolder: './db/migrations',
  });

  await migrationClient.end();

  console.log('✅ Migrations completed!');
};

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
