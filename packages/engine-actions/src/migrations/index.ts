import snapshot from './snapshot'
import { MigrationGroup } from '@contember/database-migrations'
import _20230310145000actionsvariables from './2023-03-10-145000-actions-variables'

export const migrationsGroup = new MigrationGroup(snapshot, {
	'2023-03-10-145000-actions-variables': _20230310145000actionsvariables,
})
