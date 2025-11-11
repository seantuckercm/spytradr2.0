
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const runNewMigration = async () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🔄 Checking if new migration needs to be applied...');

  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check if signals table already exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'signals'
      );
    `;
    
    const tableExists = result[0]?.exists;
    
    if (tableExists) {
      console.log('✅ Signals table already exists, skipping migration');
    } else {
      console.log('📝 Applying new migration for signals and ohlcv_data tables...');
      
      // Read the migration file
      const migrationPath = join(process.cwd(), 'db/migrations/0001_slim_scorpion.sql');
      const migrationSql = readFileSync(migrationPath, 'utf-8');
      
      // Split by statement-breakpoint and execute each statement
      const statements = migrationSql.split('--> statement-breakpoint');
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          await sql.unsafe(trimmed);
        }
      }
      
      // Record in migrations table
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (
          (SELECT COUNT(*) + 1 FROM drizzle.__drizzle_migrations),
          EXTRACT(EPOCH FROM NOW())::bigint * 1000
        )
      `;
      
      console.log('✅ Migration applied successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
};

runNewMigration().catch((err) => {
  console.error('❌ Migration script failed:', err);
  process.exit(1);
});
