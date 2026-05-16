import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

type Env = {
  DATABASE_URL: string
  SHADOW_DATABASE_URL: string
}

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  migrations: {
    path: 'src/prisma/migrations',
  },
  datasource: {
    url: env<Env>('DATABASE_URL'),
    shadowDatabaseUrl: env<Env>('SHADOW_DATABASE_URL'),
  },
})
