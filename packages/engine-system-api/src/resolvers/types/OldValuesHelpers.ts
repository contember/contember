import { DatabaseContext, OldValuesQuery } from '../../model/index.js'
import { createBatchLoader } from '../../utils/batchQuery.js'

export const oldValuesLoaderFactory = (db: DatabaseContext) =>
	createBatchLoader<string, Record<string, object>, object>(
		async ids => {
			return db.queryHandler.fetch(new OldValuesQuery(ids))
		},
		(id, items) => items[id],
	)
