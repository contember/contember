import { DatabaseContext } from '../../model/database'
import { createBatchLoader } from '../../utils/batchQuery'
import { OldValuesQuery } from '../../model/queries/events'

export const oldValuesLoaderFactory = (db: DatabaseContext) =>
	createBatchLoader<string, Record<string, object>, object>(
		async ids => {
			return db.queryHandler.fetch(new OldValuesQuery(ids[ids.length - 1] /* fixme*/, ids))
		},
		(id, items) => items[id],
	)
