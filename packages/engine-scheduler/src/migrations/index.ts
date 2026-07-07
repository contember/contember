import snapshot from './snapshot.js'
import { MigrationGroup } from '@contember/database-migrations'
import _20260707120000schedulerrun from './2026-07-07-120000-scheduler-run.js'

export const migrationsGroup = new MigrationGroup(snapshot, {
	'2026-07-07-120000-scheduler-run': _20260707120000schedulerrun,
})
