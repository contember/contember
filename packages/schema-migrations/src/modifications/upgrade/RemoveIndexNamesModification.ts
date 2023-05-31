import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEveryEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class RemoveIndexNamesModificationHandler implements ModificationHandler<RemoveIndexNamesModificationData>  {
	constructor() {}

	public createSql(): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEveryEntity(({ entity }) => {
				return {
					...entity,
					indexes: entity.indexes.map(({ name, ...other }) => other),
					unique: entity.unique.map(({ name, ...other }) => other),
				}
			}),
		)
	}

	describe() {
		return { message: `Schema upgrade: remove names of indexes and unique constraints` }
	}
}

export const removeIndexNamesModification = createModificationType({
	id: 'removeIndexNames',
	handler: RemoveIndexNamesModificationHandler,
})


export type RemoveIndexNamesModificationData = {}

export class RemoveIndexNamesDiffer implements Differ {
	createDiff(originalSchema: Schema) {
		const hasNames = !!Object.values(originalSchema.model.entities).find(it => {
			return it.indexes.find(it => !!it.name) || it.unique.find(it => !!it.name)
		})
		if (hasNames) {
			return [removeIndexNamesModification.createModification({})]
		}
		return []
	}
}
