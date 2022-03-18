import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'

export const RemoveUniqueConstraintModification: ModificationHandlerStatic<RemoveUniqueConstraintModificationData> = class {
	static id = 'removeUniqueConstraint'
	constructor(private readonly data: RemoveUniqueConstraintModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view || !entity.migrations.enabled) {
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

	static createModification(data: RemoveUniqueConstraintModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(originalSchema.model.entities).flatMap(entity =>
			Object.values(entity.unique)
				.filter(
					it =>
						updatedSchema.model.entities[entity.name] &&
						(!updatedSchema.model.entities[entity.name].unique[it.name] ||
							!deepEqual(it.fields, updatedSchema.model.entities[entity.name].unique[it.name].fields)),
				)
				.map(unique =>
					RemoveUniqueConstraintModification.createModification({
						entityName: entity.name,
						constraintName: unique.name,
					}),
				),
		)
	}
}

export interface RemoveUniqueConstraintModificationData {
	entityName: string
	constraintName: string
}
