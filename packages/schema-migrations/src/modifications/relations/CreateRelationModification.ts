import { Model, Schema } from '@contember/schema'
import {
	acceptRelationTypeVisitor,
	isInverseRelation,
	isOwningRelation,
	isRelation,
	NamingHelper,
} from '@contember/schema-utils'
import { MigrationBuilder } from '@contember/database-migrations'
import { addField, SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { createEventTrigger, createEventTrxTrigger } from '../utils/sqlUpdateUtils'
import { isIt } from '../../utils/isIt'
import { createFields } from '../utils/diffUtils'

const getPrimaryType = (entity: Model.Entity): string => {
	const column = entity.fields[entity.primary] as Model.AnyColumn
	return column.columnType
}

export const CreateRelationModification: ModificationHandlerStatic<CreateRelationModificationData> = class {
	static id = 'createRelation'

	constructor(private readonly data: CreateRelationModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const targetEntity = this.schema.model.entities[this.data.owningSide.target]
		acceptRelationTypeVisitor(this.schema.model, entity, this.data.owningSide, {
			visitManyHasOne: ({}, relation, {}, _) => {
				builder.addColumn(entity.tableName, {
					[relation.joiningColumn.columnName]: {
						type: getPrimaryType(targetEntity),
						notNull: !relation.nullable,
					},
				})
				const fkName = NamingHelper.createForeignKeyName(
					entity.tableName,
					relation.joiningColumn.columnName,
					targetEntity.tableName,
					targetEntity.primaryColumn,
				)
				builder.addConstraint(entity.tableName, fkName, {
					foreignKeys: {
						columns: relation.joiningColumn.columnName,
						references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
						onDelete: 'NO ACTION',
					},
					deferrable: true,
					deferred: false,
				})
				builder.addIndex(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwning: ({}, relation, {}, _) => {
				builder.addColumn(entity.tableName, {
					[relation.joiningColumn.columnName]: {
						type: getPrimaryType(targetEntity),
						notNull: !relation.nullable,
					},
				})
				const uniqueConstraintName = NamingHelper.createUniqueConstraintName(entity.name, [relation.name])

				builder.addConstraint(entity.tableName, uniqueConstraintName, { unique: [relation.joiningColumn.columnName] })

				const fkName = NamingHelper.createForeignKeyName(
					entity.tableName,
					relation.joiningColumn.columnName,
					targetEntity.tableName,
					targetEntity.primaryColumn,
				)
				builder.addConstraint(entity.tableName, fkName, {
					foreignKeys: {
						columns: relation.joiningColumn.columnName,
						references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
						onDelete: 'NO ACTION',
					},
					deferrable: true,
					deferred: false,
				})
			},
			visitOneHasOneInverse: () => {},
			visitManyHasManyOwning: ({}, relation, {}, _) => {
				const primaryColumns = [
					relation.joiningTable.joiningColumn.columnName,
					relation.joiningTable.inverseJoiningColumn.columnName,
				]
				builder.createTable(
					relation.joiningTable.tableName,
					{
						[relation.joiningTable.joiningColumn.columnName]: {
							type: getPrimaryType(entity),
							notNull: true,
							references: `"${entity.tableName}"("${entity.primaryColumn}")`,
							onDelete: 'CASCADE',
						},
						[relation.joiningTable.inverseJoiningColumn.columnName]: {
							type: getPrimaryType(targetEntity),
							notNull: true,
							references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
							onDelete: 'CASCADE',
						},
					},
					{
						constraints: {
							primaryKey: primaryColumns,
						},
					},
				)
				createEventTrigger(builder, relation.joiningTable.tableName, primaryColumns)
				createEventTrxTrigger(builder, relation.joiningTable.tableName)
			},
			visitManyHasManyInverse: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, addField(this.data.owningSide)),
			this.data.inverseSide !== undefined
				? updateEntity(this.data.owningSide.target, addField(this.data.inverseSide))
				: undefined,
		)
	}

	describe({ createdEntities }: { createdEntities: string[] }) {
		const notNull = isIt<Model.NullableRelation>(this.data.owningSide, 'nullable') && !this.data.owningSide.nullable
		const failureWarning =
			notNull && !createdEntities.includes(this.data.entityName)
				? `May fail in runtime, because relation is not-null`
				: undefined
		return { message: `Add relation ${this.data.entityName}.${this.data.owningSide.name}`, failureWarning }
	}

	static createModification(data: CreateRelationModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return createFields(originalSchema, updatedSchema, ({ newField, updatedEntity }) => {
			if (!isRelation(newField) || !isOwningRelation(newField)) {
				return undefined
			}
			const inverseSide = newField.inversedBy
				? updatedSchema.model.entities[newField.target].fields[newField.inversedBy]
				: undefined
			if (inverseSide && !(isRelation(inverseSide) && isInverseRelation(inverseSide))) {
				throw new Error()
			}
			return CreateRelationModification.createModification({
				entityName: updatedEntity.name,
				owningSide: newField,
				...(inverseSide ? { inverseSide } : {}),
			})
		})
	}
}

export interface CreateRelationModificationData {
	entityName: string
	owningSide: Model.AnyRelation & Model.OwningRelation
	inverseSide?: Model.AnyRelation & Model.InverseRelation
}
