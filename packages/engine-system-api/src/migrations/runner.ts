import { loadMigrations, Migration } from '@contember/database-migrations'
import projectMigrations from './2020-03-27-130000-project-migrations.js'
import composedPrimary from './2020-05-06-150000-composed-primary.js'
import eventTriggerPerf from './2020-06-01-103000-event-trigger-perf.js'
import eventLogRework from './2021-05-07-155800-event-log-rework.js'
import eventLogFixConstraint from './2021-05-19-1232000-event-log-fix-constraint.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

export const getSystemMigrations = (): Promise<Migration[]> => {
	return loadMigrations(process.env.CONTEMBER_SYSTEM_MIGRATIONS_DIR || __dirname, [
		new Migration('2020-03-27-130000-project-migrations', projectMigrations),
		new Migration('2020-05-06-150000-composed-primary', composedPrimary),
		new Migration('2020-06-01-103000-event-trigger-perf', eventTriggerPerf),
		new Migration('2021-05-07-155800-event-log-rework', eventLogRework),
		new Migration('2021-05-19-1232000-event-log-fix-constraint', eventLogFixConstraint),
	])
}
