import { Migration } from '@contember/database-migrations'
import _20180804102200init from './2018-08-04-102200-init'
import _20180805130501triggereventfunction from './2018-08-05-130501-trigger-event-function'
import _20190114143432eventtrxid from './2019-01-14-143432-event-trx-id'
import _20190204154500eventrebase from './2019-02-04-154500-event-rebase'
import _20190318104147eventrunmigrationstruct from './2019-03-18-104147-event-run-migration-struct'
import _20190729103000triggereventfunctionfix from './2019-07-29-103000-trigger-event-function-fix'
import _20191128100000missingsettingfallback from './2019-11-28-100000-missing-setting-fallback'
import _20200327130000projectmigrations from './2020-03-27-130000-project-migrations'
import _20200506150000composedprimary from './2020-05-06-150000-composed-primary'
import _20200601103000eventtriggerperf from './2020-06-01-103000-event-trigger-perf'
import _20210323110000timestampfix from './2021-03-23-110000-timestamp-fix'
import _20210507155800eventlogrework from './2021-05-07-155800-event-log-rework'
import _202105191232000eventlogfixconstraint from './2021-05-19-1232000-event-log-fix-constraint'
import _20211221155500eventsup from './2021-12-21-155500-events-up'
import _20220208132600fnsearchpath from './2022-02-08-132600-fn-search-path'
import _20220208140500dropdeadcode from './2022-02-08-140500-drop-deadcode'
import _20220208144400dynamicstageschema from './2022-02-08-144400-dynamic-stage-schema'
import _20221003110000tableondelete from './2022-10-03-110000-table-on-delete'

import { SystemMigrationArgs } from './types'

const migrations = {
	'2018-08-04-102200-init': _20180804102200init,
	'2018-08-05-130501-trigger-event-function': _20180805130501triggereventfunction,
	'2019-01-14-143432-event-trx-id': _20190114143432eventtrxid,
	'2019-02-04-154500-event-rebase': _20190204154500eventrebase,
	'2019-03-18-104147-event-run-migration-struct': _20190318104147eventrunmigrationstruct,
	'2019-07-29-103000-trigger-event-function-fix': _20190729103000triggereventfunctionfix,
	'2019-11-28-100000-missing-setting-fallback': _20191128100000missingsettingfallback,
	'2020-03-27-130000-project-migrations': _20200327130000projectmigrations,
	'2020-05-06-150000-composed-primary': _20200506150000composedprimary,
	'2020-06-01-103000-event-trigger-perf': _20200601103000eventtriggerperf,
	'2021-03-23-110000-timestamp-fix': _20210323110000timestampfix,
	'2021-05-07-155800-event-log-rework': _20210507155800eventlogrework,
	'2021-05-19-1232000-event-log-fix-constraint': _202105191232000eventlogfixconstraint,
	'2021-12-21-155500-events-up': _20211221155500eventsup,
	'2022-02-08-132600-fn-search-path': _20220208132600fnsearchpath,
	'2022-02-08-140500-drop-deadcode': _20220208140500dropdeadcode,
	'2022-02-08-144400-dynamic-stage-schema': _20220208144400dynamicstageschema,
	'2022-10-03-110000-table-on-delete': _20221003110000tableondelete,
}

export const getSystemMigrations = (): Promise<Migration<SystemMigrationArgs>[]> => {
	return Promise.resolve(Object.entries(migrations).map(([name, migration]) => new Migration(name, migration)))
}
