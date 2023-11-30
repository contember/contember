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

export class ConvertOneHasManyToOneHasOneRelationModificationHandler implements ModificationHandler<ConvertOneHasManyToOneHasOneRelationModificationData> {
	private subModification: ModificationHandler<any>

	constructor(
		private readonly data: ConvertOneHasManyToOneHasOneRelationModificationData,
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

		const uniqueConstraintNames = options.databaseMetadata.indexes.filter({
			tableName: entity.tableName,
			columnNames: [columnName],
		}).getNames()

		for (const name of uniqueConstraintNames) {
			builder.sql(`DROP INDEX ${wrapIdentifier(name)}`)
		}
		builder.sql(`ALTER TABLE ${tableNameId} ADD UNIQUE (${columnNameId})`)

		options.invalidateDatabaseMetadata()

		this.subModification.createSql(builder, options)
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { relation } = this.getRelation()
		const { entityName, fieldName } = this.data
		const inverseFieldName = this.data.newInverseSideFieldName ?? relation.inversedBy
		return updateSchema(
			updateModel(
				updateEntity(
					entityName,
					updateField<Model.ManyHasOneRelation, Model.OneHasOneOwningRelation>(
						fieldName,
						({ field: { type, ...field } }) => ({
							type: Model.RelationType.OneHasOne,
							...field,
						}),
					),
				),
			),
			this.subModification.getSchemaUpdater(),
			inverseFieldName ?
				updateModel(
					updateEntity(
						relation.target,
						updateField<Model.OneHasManyRelation, Model.OneHasOneInverseRelation>(
							inverseFieldName,
							({ field: { type, ...field } }) => ({
								type: Model.RelationType.OneHasOne,
								nullable: true,
								...field,
							}),
						),
					),
				) : undefined,
		)
	}

	describe() {
		return {
			message: `Converts ManyHasOne relation to OneHasOne on ${this.data.entityName}.${this.data.fieldName}`,
			failureWarning: 'Make sure no conflicting rows exists, otherwise this may fail in runtime.',
		}
	}

	private getRelation() {
		const entity = this.schema.model.entities[this.data.entityName]
		const relation = entity.fields[this.data.fieldName]
		if (relation.type !== Model.RelationType.ManyHasOne) {
			throw new Error()
		}
		return { entity, relation }
	}
}

export interface ConvertOneHasManyToOneHasOneRelationModificationData {
	entityName: string
	fieldName: string
	newInverseSideFieldName?: string
}

export const convertOneHasManyToOneHasOneRelationModification = createModificationType({
	id: 'convertOneHasManyToOneHasOneRelation',
	handler: ConvertOneHasManyToOneHasOneRelationModificationHandler,
})

export class ConvertOneHasManyToOneHasOneRelationDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				isOwningRelation(originalRelation) &&
				isOwningRelation(updatedRelation) &&
				originalRelation.type === Model.RelationType.ManyHasOne &&
				updatedRelation.type === Model.RelationType.OneHasOne
			) {
				const isInverseSideRenamed = originalRelation.inversedBy && updatedRelation.inversedBy && originalRelation.inversedBy !== updatedRelation.inversedBy
				return convertOneHasManyToOneHasOneRelationModification.createModification({
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
