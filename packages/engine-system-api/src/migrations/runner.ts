import { loadMigrations, Migration } from '@contember/database-migrations'
import projectMigrations from './2020-03-27-130000-project-migrations'
import composedPrimary from './2020-05-06-150000-composed-primary'
import eventTriggerPerf from './2020-06-01-103000-event-trigger-perf'
import eventLogRework from './2021-05-07-155800-event-log-rework'
import eventLogFixConstraint from './2021-05-19-1232000-event-log-fix-constraint'
import tableOnDelete from './2022-10-03-110000-table-on-delete'
import { SystemMigrationArgs } from './types'

export const getSystemMigrations = (): Promise<Migration<SystemMigrationArgs>[]> => {
	return loadMigrations(process.env.CONTEMBER_SYSTEM_MIGRATIONS_DIR || __dirname, [
		new Migration('2020-03-27-130000-project-migrations', projectMigrations),
		new Migration('2020-05-06-150000-composed-primary', composedPrimary),
		new Migration('2020-06-01-103000-event-trigger-perf', eventTriggerPerf),
		new Migration('2021-05-07-155800-event-log-rework', eventLogRework),
		new Migration('2021-05-19-1232000-event-log-fix-constraint', eventLogFixConstraint),
		new Migration('2022-10-03-110000-table-on-delete', tableOnDelete),
	])
}
