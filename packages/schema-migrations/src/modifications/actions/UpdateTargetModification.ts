
import { MigrationBuilder } from '@contember/database-migrations'
import { Actions, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'

export class UpdateTargetModificationHandler implements ModificationHandler<UpdateTargetModificationData> {
	constructor(private readonly data: UpdateTargetModificationData) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			return ({
				...schema,
				actions: {
					...schema.actions,
					targets: {
						...schema.actions.targets,
						[this.data.name]: this.data.target,
					},
				},
			})
		}
	}

	describe() {
		return { message: `Update target ${this.data.name}` }
	}
}

export interface UpdateTargetModificationData {
	name: string
	target: Actions.AnyTarget
}

export const updateTargetModification = createModificationType({
	id: 'updateTarget',
	handler: UpdateTargetModificationHandler,
})

export class UpdateTargetDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.actions.targets)
			.filter(([name, target]) => originalSchema.actions.targets[name] && !deepEqual(target, originalSchema.actions.targets[name]))
			.map(([name, target]) => updateTargetModification.createModification({ name, target }))
	}
}
