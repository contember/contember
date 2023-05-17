import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel, updateSchema } from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
	ModificationHandlerOptions,
} from '../ModificationHandler'
import { isOwningRelation } from '@contember/schema-utils'
import { updateRelations } from '../utils/diffUtils'
import { NoopModification } from '../NoopModification'
import { updateFieldNameModification } from '../fields'
import { wrapIdentifier } from '../../utils/dbHelpers'

export class ConvertOneToManyRelationModificationHandler implements ModificationHandler<ConvertOneToManyRelationModificationData> {
	private subModification: ModificationHandler<any>

	constructor(
		private readonly data: ConvertOneToManyRelationModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {
		const { relation } = this.getRelation()
		this.subModification = data.newInverseSideFieldName && relation.inversedBy ?
			updateFieldNameModification.createHandler(
				{
					entityName: relation.target,
					fieldName: relation.inversedBy,
					newFieldName: data.newInverseSideFieldName,
				},
				schema,
				this.options,
			)
			: new NoopModification()
	}

	public createSql(builder: MigrationBuilder, options: ModificationHandlerCreateSqlOptions): void {
		const { entity, relation } = this.getRelation()
		const columnName = relation.joiningColumn.columnName

		const tableNameId = wrapIdentifier(entity.tableName)
		const columnNameId = wrapIdentifier(columnName)
		builder.sql(`CREATE INDEX ON ${tableNameId} (${columnNameId})`)

		const uniqueConstraintNames = options.databaseMetadata.getUniqueConstraintNames({
			tableName: entity.tableName,
			columnNames: [relation.joiningColumn.columnName],
		})
		for (const name of uniqueConstraintNames) {
			builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} DROP CONSTRAINT ${wrapIdentifier(name)}`)
		}
		options.invalidateDatabaseMetadata()

		this.subModification.createSql(builder, options)
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { relation } = this.getRelation()
		const { entityName, fieldName } = this.data

		return updateSchema(
			updateModel(
				updateEntity(
					entityName,
					updateField<Model.OneHasOneOwningRelation, Model.ManyHasOneRelation>(
						fieldName,
						({ field: { type, orphanRemoval, ...field } }) => ({
							type: Model.RelationType.ManyHasOne,
							...field,
						}),
					),
				),
			),
			this.subModification.getSchemaUpdater(),
			this.data.newInverseSideFieldName ?
				updateModel(
					updateEntity(
						relation.target,
						updateField<Model.OneHasOneInverseRelation, Model.OneHasManyRelation>(
							this.data.newInverseSideFieldName,
							({ field: { type,  nullable, ...field } }) => ({
								type: Model.RelationType.OneHasMany,
								...field,
							}),
						),
					),
				) : undefined,
		)
	}

	describe() {
		return {
			message: `Converts OneHasOne relation to ManyHasOne on ${this.data.entityName}.${this.data.fieldName}`,
		}
	}

	private getRelation() {
		const entity = this.schema.model.entities[this.data.entityName]
		const relation = entity.fields[this.data.fieldName]
		if (relation.type !== Model.RelationType.OneHasOne || !isOwningRelation(relation)) {
			throw new Error()
		}
		return { entity, relation }
	}
}

export interface ConvertOneToManyRelationModificationData {
	entityName: string
	fieldName: string
	newInverseSideFieldName?: string
}

export const convertOneToManyRelationModification = createModificationType({
	id: 'convertOneToManyRelation',
	handler: ConvertOneToManyRelationModificationHandler,
})

export class ConvertOneToManyRelationDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				isOwningRelation(originalRelation) &&
				isOwningRelation(updatedRelation) &&
				originalRelation.type === Model.RelationType.OneHasOne &&
				updatedRelation.type === Model.RelationType.ManyHasOne
			) {
				const isInverseSideRenamed = originalRelation.inversedBy && updatedRelation.inversedBy && originalRelation.inversedBy !== updatedRelation.inversedBy
				return convertOneToManyRelationModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					...(isInverseSideRenamed ? {
						newInverseSideFieldName: updatedRelation.inversedBy,
					} : {}),
				})
			}
			return undefined
		})
	}
}
