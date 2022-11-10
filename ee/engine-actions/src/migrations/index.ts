import snapshot from './snapshot'
import { MigrationGroup } from '@contember/database-migrations'

export const migrationsGroup = new MigrationGroup(snapshot, {})
