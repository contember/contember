import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { addField, SchemaUpdater, updateEntity, updateModel, updateSchema } from '../utils/schemaUpdateUtils.js'
import { ModificationHandler, ModificationHandlerOptions, ModificationHandlerStatic } from '../ModificationHandler.js'
import { isInverseRelation, isOwningRelation } from '@contember/schema-utils'
import { updateRelations } from '../utils/diffUtils.js'
import { UpdateFieldNameModification } from '../fields/index.js'
import { createJunctionTableSql } from '../utils/createJunctionTable.js'
import { wrapIdentifier } from '@contember/database'
import { normalizeManyHasManyRelation, PartialManyHasManyRelation } from './normalization.js'

export const ConvertOneHasManyToManyHasManyRelationModification: ModificationHandlerStatic<ConvertOneHasManyToManyHasManyRelationModificationData> = class {
	static id = 'convertOneHasManyToManyHasManyRelation'
	private subModification: ModificationHandler<any>

	constructor(
		private readonly data: ConvertOneHasManyToManyHasManyRelationModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {
		this.subModification = new UpdateFieldNameModification(
			{
				entityName: this.data.entityName,
				fieldName: this.data.fieldName,
				newFieldName: this.data.owningSide.name,
			},
			schema,
			this.options,
		)
	}

	public createSql(builder: MigrationBuilder): void {
		const targetEntity = this.schema.model.entities[this.data.owningSide.target]
		const { relation: oldRelation } = this.getRelation()
		const entity = this.schema.model.entities[this.data.entityName]

		createJunctionTableSql(builder, this.options.systemSchema, entity, targetEntity, normalizeManyHasManyRelation(this.data.owningSide))
		const joiningTable = this.data.owningSide.joiningTable
		builder.sql(`
			INSERT INTO ${wrapIdentifier(joiningTable.tableName)} (
				${wrapIdentifier(joiningTable.joiningColumn.columnName)},
				${wrapIdentifier(joiningTable.inverseJoiningColumn.columnName)}
				)
			SELECT ${wrapIdentifier(entity.primaryColumn)}, ${wrapIdentifier(oldRelation.joiningColumn.columnName)}
			FROM ${wrapIdentifier(entity.tableName)}
			WHERE ${wrapIdentifier(oldRelation.joiningColumn.columnName)} IS NOT NULL`)

		builder.dropColumn(entity.tableName, oldRelation.joiningColumn.columnName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName } = this.data
		return updateSchema(
			this.subModification.getSchemaUpdater(),
			updateModel(updateEntity(entityName, addField(normalizeManyHasManyRelation(this.data.owningSide)))),
			this.data.inverseSide ? updateModel(updateEntity(this.data.owningSide.target, addField(this.data.inverseSide))) : undefined,
		)
	}

	describe() {
		return {
			message: `Converts OneHasMany relation to ManyHasMany on ${this.data.entityName}.${this.data.fieldName}`,
		}
	}

	static createModification(data: ConvertOneHasManyToManyHasManyRelationModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				isInverseRelation(originalRelation) &&
				isInverseRelation(updatedRelation) &&
				originalRelation.type === Model.RelationType.OneHasMany &&
				updatedRelation.type === Model.RelationType.ManyHasMany
			) {
				const owningOldName = originalRelation.ownedBy
				const owningNewName = updatedRelation.ownedBy
				const owningSide = updatedSchema.model.entities[updatedRelation.target].fields[owningNewName]
				if (owningSide.type !== Model.RelationType.ManyHasMany || !isOwningRelation(owningSide)) {
					throw new Error()
				}
				return ConvertOneHasManyToManyHasManyRelationModification.createModification({
					entityName: updatedRelation.target,
					fieldName: owningOldName,
					owningSide,
					inverseSide: updatedRelation,
				})
			}
			return undefined
		})
	}

	private getRelation(): { entity: Model.Entity; relation: Model.ManyHasOneRelation } {
		const entity = this.schema.model.entities[this.data.entityName]
		const relation = entity.fields[this.data.fieldName]
		if (relation.type !== Model.RelationType.ManyHasOne) {
			throw new Error()
		}
		return { entity, relation }
	}
}

export interface ConvertOneHasManyToManyHasManyRelationModificationData {
	entityName: string
	fieldName: string
	owningSide: PartialManyHasManyRelation
	inverseSide?: Model.ManyHasManyInverseRelation
}
