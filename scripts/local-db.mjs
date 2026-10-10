import { PGlite } from '@electric-sql/pglite'
import { createServer } from 'pglite-server'

const port = Number(process.env.LOCAL_DB_PORT || 5543)
const dataDir = process.env.LOCAL_DB_DIR || '.local-db'

const db = new PGlite(dataDir)
await db.waitReady

const server = createServer(db)
server.listen(port, () => {
  console.log(`Local development database listening on port ${port} (data: ${dataDir})`)
  console.log('Set DATABASE_URL=postgres://postgres:postgres@localhost:5543/postgres and DATABASE_SSL=disable in .env.local')
})
