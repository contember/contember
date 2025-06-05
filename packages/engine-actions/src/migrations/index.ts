import snapshot from './snapshot'
import { MigrationGroup } from '@contember/database-migrations'
import _20230310145000actionsvariables from './2023-03-10-145000-actions-variables'
import _20250528160000actioneventuser from './2025-05-28-160000-action-event-user'

export const migrationsGroup = new MigrationGroup(snapshot, {
	'2023-03-10-145000-actions-variables': _20230310145000actionsvariables,
	'2025-05-28-160000-action-event-user': _20250528160000actioneventuser,
})
