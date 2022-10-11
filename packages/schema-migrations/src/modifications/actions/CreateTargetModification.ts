import { MigrationBuilder } from '@contember/database-migrations'
import { Actions, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class CreateTargetModificationHandler implements ModificationHandler<CreateTargetModificationData> {
	constructor(private readonly data: CreateTargetModificationData) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => ({
			...schema,
			actions: {
				...schema.actions,
				targets: {
					...schema.actions.targets,
					[this.data.target.name]: this.data.target,
				},
			},
		})
	}

	describe() {
		return { message: `Create target ${this.data.target.name}` }
	}
}

export interface CreateTargetModificationData {
	target: Actions.AnyTarget
}

export const createTargetModification = createModificationType({
	id: 'createTarget',
	handler: CreateTargetModificationHandler,
})

export class CreateTargetDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.actions.targets)
			.filter(([name]) => !originalSchema.actions.targets[name])
			.map(([, target]) => createTargetModification.createModification({ target }))
	}
}
