import { open }   from '@op-engineering/op-sqlite'
import { drizzle } from 'drizzle-orm/op-sqlite'
import { tasks }   from './schema'

const sqlite = open({ name: 'todo.db' })

sqlite.exec(
  `CREATE TABLE IF NOT EXISTS tasks (
     id        INTEGER PRIMARY KEY AUTOINCREMENT,
     title     TEXT    NOT NULL,
     date      TEXT    NOT NULL,
     time      TEXT    NOT NULL,
     priority  TEXT    NOT NULL,
     status    TEXT    NOT NULL DEFAULT 'to-do'
   );`
)

export const db = drizzle(sqlite, { schema: { tasks } })
