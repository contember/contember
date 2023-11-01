import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
} from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { getUniqueConstraintColumns } from './utils'
import { wrapIdentifier } from '../../utils/dbHelpers'

export class RemoveUniqueConstraintModificationHandler implements ModificationHandler<RemoveUniqueConstraintModificationData> {
	constructor(private readonly data: RemoveUniqueConstraintModificationData, private readonly schema: Schema) {
	}

	public createSql(builder: MigrationBuilder, { databaseMetadata, invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}

		const fields = this.getFields()

		const columns = getUniqueConstraintColumns({
			entity,
			fields: fields,
			model: this.schema.model,
		})

		const constraintNames = databaseMetadata.uniqueConstraints.filter({ tableName: entity.tableName, columnNames: columns }).getNames()

		for (const name of constraintNames) {
			builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} DROP CONSTRAINT ${wrapIdentifier(name)}`)
		}

		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		const fields = this.getFields()
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const unique = entity.unique.filter(it => !deepEqual(it.fields, fields))
				return {
					...entity,
					unique,
				}
			}),
		)
	}

	describe() {
		const fields = this.getFields()
		return { message: `Remove unique constraint (${fields.join(', ')}) on entity ${this.data.entityName}` }
	}

	getFields() {
		const entity = this.schema.model.entities[this.data.entityName]
		const fields = 'constraintName' in this.data
			? entity.unique.find(it => it.name === this.data.constraintName)?.fields
			: this.data.fields

		if (!fields) {
			throw new Error()
		}
		return fields
	}
}

export const removeUniqueConstraintModification = createModificationType({
	id: 'removeUniqueConstraint',
	handler: RemoveUniqueConstraintModificationHandler,
})

export type RemoveUniqueConstraintModificationData =
	| {
		entityName: string
		constraintName: string
		fields?: never
	}
	| {
		entityName: string
		fields: readonly string[]
		constraintName?: never
	}


export class RemoveUniqueConstraintDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(originalSchema.model.entities).flatMap(entity =>
			entity.unique
				.filter(it => {
					const updatedEntity = updatedSchema.model.entities[entity.name]
					if (!updatedEntity) {
						return false
					}
					return !updatedEntity.unique.find(uniq => deepEqual(uniq.fields, it.fields) && it.timing === uniq.timing)
				})
				.map(unique =>
					removeUniqueConstraintModification.createModification({
						entityName: entity.name,
						fields: unique.fields,
					}),
				),
		)
	}
}
