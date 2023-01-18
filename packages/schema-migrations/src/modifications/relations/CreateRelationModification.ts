import { Model, Schema } from '@contember/schema'
import {
	acceptRelationTypeVisitor,
	isInverseRelation,
	isOwningRelation,
	isRelation,
	NamingHelper,
} from '@contember/schema-utils'
import { MigrationBuilder } from '@contember/database-migrations'
import {
	addField,
	addTakenIndexName,
	SchemaUpdater,
	updateEntity,
	updateModel,
	updateSchema,
} from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler,
	ModificationHandlerOptions,
} from '../ModificationHandler'
import { isIt } from '../../utils/isIt'
import { createFields } from '../utils/diffUtils'
import { getPrimaryColumnType } from '../utils/getPrimaryColumnType'
import { createJunctionTableSql } from '../utils/createJunctionTable'
import { normalizeManyHasManyRelation, PartialManyHasManyRelation } from './normalization'
import { resolveIndexName, SchemaWithMeta } from '../utils/schemaMeta'
import { addForeignKeyConstraint } from './helpers'


export class CreateRelationModificationHandler implements ModificationHandler<CreateRelationModificationData> {

	constructor(
		private readonly data: CreateRelationModificationData,
		private readonly schema: SchemaWithMeta,
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
			visitManyHasOne: ({ relation }) => {
				createOwningSide(relation)
				const columnName = relation.joiningColumn.columnName
				const proposedIndexName = NamingHelper.createForeignKeyIndexName(entity.tableName, columnName)
				const indexName = resolveIndexName(this.schema, proposedIndexName)
				builder.addIndex(entity.tableName, columnName, {
					name: indexName,
				})
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwning: ({ relation }) => {
				createOwningSide(relation)
				const uniqueConstraintName = NamingHelper.createUniqueConstraintName(entity.name, [relation.name])
				builder.addConstraint(entity.tableName, uniqueConstraintName, { unique: [relation.joiningColumn.columnName] })
			},
			visitOneHasOneInverse: () => {},
			visitManyHasManyOwning: ({ relation }) => {
				createJunctionTableSql(builder, this.options.systemSchema, this.schema, entity, targetEntity, relation)
			},
			visitManyHasManyInverse: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		const entity = this.schema.model.entities[this.data.entityName]
		return updateSchema(
			updateModel(
				updateEntity(this.data.entityName, addField(this.getNormalizedOwningSide())),
				this.data.inverseSide !== undefined
					? updateEntity(this.data.owningSide.target, addField(this.data.inverseSide))
					: undefined,
			),
			this.data.owningSide.type === Model.RelationType.ManyHasOne
				? addTakenIndexName(NamingHelper.createForeignKeyIndexName(entity.tableName, this.data.owningSide.joiningColumn.columnName))
				: undefined,
			this.data.owningSide.type === Model.RelationType.ManyHasMany && isOwningRelation(this.data.owningSide)
				? addTakenIndexName(NamingHelper.createJunctionTablePrimaryConstraintName(this.data.owningSide.joiningTable.tableName))
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

export const createRelationModification = createModificationType({
	id: 'createRelation',
	handler: CreateRelationModificationHandler,
})

export class CreateRelationDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
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
			return createRelationModification.createModification({
				entityName: updatedEntity.name,
				owningSide: newField,
				...(inverseSide ? { inverseSide } : {}),
			})
		})
	}
}
