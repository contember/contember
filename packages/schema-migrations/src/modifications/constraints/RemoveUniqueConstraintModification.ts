import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
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

		const unique = this.getUnique()

		const columns = getUniqueConstraintColumns({
			entity,
			fields: unique.fields,
			model: this.schema.model,
		})

		if (unique.index) {
			const indexNames = databaseMetadata.indexes.filter({
				tableName: entity.tableName,
				columnNames: columns,
				unique: true,
			}).getNames()

			for (const name of indexNames) {
				builder.sql(`DROP INDEX ${wrapIdentifier(name)}`)
			}

		} else {

			const constraintNames = databaseMetadata.uniqueConstraints.filter({
				tableName: entity.tableName,
				columnNames: columns,
			}).getNames()

			for (const name of constraintNames) {
				builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} DROP CONSTRAINT ${wrapIdentifier(name)}`)
			}
		}


		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		const thisUnique = this.getUnique()
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const unique = entity.unique.filter(it => !deepEqual(it, thisUnique))
				return {
					...entity,
					unique,
				}
			}),
		)
	}

	describe() {
		const unique = this.getUnique()
		return { message: `Remove unique ${unique.index ? 'index' : 'constraint'} (${unique.fields.join(', ')}) on entity ${this.data.entityName}` }
	}

	getUnique(): Model.Unique {
		if ('unique' in this.data) {
			return this.data.unique
		}
		const entity = this.schema.model.entities[this.data.entityName]
		const unique = 'constraintName' in this.data
			? entity.unique.find(it => 'name' in it && it.name === this.data.constraintName)
			: entity.unique.find(it => deepEqual(it.fields, this.data.fields))

		if (!unique) {
			throw new Error()
		}
		return unique
	}
}

export const removeUniqueConstraintModification = createModificationType({
	id: 'removeUniqueConstraint',
	handler: RemoveUniqueConstraintModificationHandler,
})

export type RemoveUniqueConstraintModificationData =
	| {
		entityName: string
		fields?: never
		constraintName?: never
		unique: Model.Unique
	}
	// deprecated
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
					return !updatedEntity.unique.find(uniq => deepEqual(uniq, it))
				})
				.map(unique =>
					removeUniqueConstraintModification.createModification({
						entityName: entity.name,
						unique: unique,
					}),
				),
		)
	}
}
