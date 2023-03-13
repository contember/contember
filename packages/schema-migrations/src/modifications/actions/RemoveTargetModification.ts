import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class RemoveTargetModificationHandler implements ModificationHandler<RemoveTargetModificationData> {
	constructor(private readonly data: RemoveTargetModificationData) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const { [this.data.name]: _, ...targets } = schema.actions.targets
			return ({
				...schema,
				actions: {
					...schema.actions,
					targets,
				},
			})
		}
	}

	describe() {
		return { message: `Remove target ${this.data.name}` }
	}
}

export interface RemoveTargetModificationData {
	name: string
}

export const removeTargetModification = createModificationType({
	id: 'removeTarget',
	handler: RemoveTargetModificationHandler,
})

export class RemoveTargetDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(originalSchema.actions.targets)
			.filter(([name]) => !updatedSchema.actions.targets[name])
			.map(([name]) => removeTargetModification.createModification({ name }))
	}
}
