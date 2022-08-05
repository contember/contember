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
import { ModificationHandlerOptions, ModificationHandlerStatic } from '../ModificationHandler'
import { isIt } from '../../utils/isIt'
import { createFields } from '../utils/diffUtils'
import { getPrimaryColumnType } from '../utils/getPrimaryColumnType'
import { createJunctionTableSql } from '../utils/createJunctionTable'
import { normalizeManyHasManyRelation, PartialManyHasManyRelation } from './normalization'
import { addForeignKeyConstraint } from './helpers'


export const CreateRelationModification: ModificationHandlerStatic<CreateRelationModificationData> = class {
	static id = 'createRelation'

	constructor(
		private readonly data: CreateRelationModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const targetEntity = this.schema.model.entities[this.data.owningSide.target]
		const createOwningSide = (relation: Model.OneHasOneOwningRelation | Model.ManyHasOneRelation) => {
			builder.addColumn(entity.tableName, {
				[relation.joiningColumn.columnName]: {
					type: getPrimaryColumnType(targetEntity),
					notNull: !relation.nullable,
				},
			})
			addForeignKeyConstraint({ builder, entity, targetEntity, relation })
		}
		acceptRelationTypeVisitor(this.schema.model, entity, this.getNormalizedOwningSide(), {
			visitManyHasOne: ({}, relation, {}, _) => {
				createOwningSide(relation)
				builder.addIndex(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwning: ({}, relation, {}, _) => {
				createOwningSide(relation)
				const uniqueConstraintName = NamingHelper.createUniqueConstraintName(entity.name, [relation.name])
				builder.addConstraint(entity.tableName, uniqueConstraintName, { unique: [relation.joiningColumn.columnName] })
			},
			visitOneHasOneInverse: () => {},
			visitManyHasManyOwning: ({}, relation, {}, _) => {
				createJunctionTableSql(builder, this.options.systemSchema,  entity, targetEntity, relation)
			},
			visitManyHasManyInverse: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, addField(this.getNormalizedOwningSide())),
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

	private getNormalizedOwningSide(): Model.AnyOwningRelation {
		if (this.data.owningSide.type === Model.RelationType.ManyHasMany) {
			return normalizeManyHasManyRelation(this.data.owningSide)
		}
		return this.data.owningSide
	}
}


export type CreateRelationModificationData = {
	entityName: string
	owningSide:
		| Model.ManyHasOneRelation
		| Model.OneHasOneOwningRelation
		| PartialManyHasManyRelation
	inverseSide?: Model.AnyInverseRelation
}
