import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'

export class RemoveUniqueConstraintModificationHandler implements ModificationHandler<RemoveUniqueConstraintModificationData> {
	constructor(protected readonly data: RemoveUniqueConstraintModificationData, protected readonly schema: Schema) {
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		builder.dropConstraint(entity.tableName, this.data.constraintName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const { [this.data.constraintName]: removed, ...unique } = entity.unique
				return {
					...entity,
					unique,
				}
			}),
		)
	}

	describe() {
		const fields = this.schema.model.entities[this.data.entityName].unique[this.data.constraintName].fields
		return { message: `Remove unique constraint (${fields.join(', ')}) on entity ${this.data.entityName}` }
	}
}

export interface RemoveUniqueConstraintModificationData {
	entityName: string
	constraintName: string
}

export const removeUniqueConstraintModification = createModificationType({
	id: 'removeUniqueConstraint',
	handler: RemoveUniqueConstraintModificationHandler,
})


export class RemoveUniqueConstraintDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(originalSchema.model.entities).flatMap(entity =>
			Object.values(entity.unique)
				.filter(
					it =>
						updatedSchema.model.entities[entity.name] &&
						(!updatedSchema.model.entities[entity.name].unique[it.name] ||
							!deepEqual(it.fields, updatedSchema.model.entities[entity.name].unique[it.name].fields)),
				)
				.map(unique =>
					removeUniqueConstraintModification.createModification({
						entityName: entity.name,
						constraintName: unique.name,
					}),
				),
		)
	}
}
