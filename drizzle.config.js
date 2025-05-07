/** @type {import('drizzle-kit').Config } */
export default {
    schema: './db/schema.js',
    out: './drizzle',
    driver: 'better-sqlite3',
    dbCredentials: {
      url: './todo.db',
    },
    dialect: 'sqlite',
  };
  