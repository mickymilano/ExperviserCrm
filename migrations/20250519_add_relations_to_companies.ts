import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
export default {
  up: async (db: ReturnType<typeof drizzle>) => {
    await db.execute(sql`
      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS relations jsonb NOT NULL DEFAULT '[]';
    `);
  },
  down: async (db: ReturnType<typeof drizzle>) => {
    await db.execute(sql`
      ALTER TABLE companies
        DROP COLUMN IF EXISTS relations;
    `);
  },
};
