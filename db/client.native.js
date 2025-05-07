import { SQLite } from './db/fixSQLite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

const expoDb = SQLite.openDatabase('todo.db');
export const db = drizzle(expoDb);
