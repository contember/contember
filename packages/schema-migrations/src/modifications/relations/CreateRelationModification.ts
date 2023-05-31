import { Model, Schema } from '@contember/schema'
import { acceptRelationTypeVisitor, isInverseRelation, isOwningRelation, isRelation } from '@contember/schema-utils'
import { MigrationBuilder } from '@contember/database-migrations'
import { addField, SchemaUpdater, updateEntity, updateModel, updateSchema } from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler, ModificationHandlerCreateSqlOptions,
	ModificationHandlerOptions,
} from '../ModificationHandler'
import { isIt } from '../../utils/isIt'
import { createFields } from '../utils/diffUtils'
import { getPrimaryColumnType } from '../utils/getPrimaryColumnType'
import { createJunctionTableSql } from '../utils/createJunctionTable'
import { normalizeManyHasManyRelation, PartialManyHasManyRelation } from './normalization'
import { addForeignKeyConstraint } from './helpers'
import { wrapIdentifier } from '../../utils/dbHelpers'


export class CreateRelationModificationHandler implements ModificationHandler<CreateRelationModificationData> {

	constructor(
		private readonly data: CreateRelationModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {}

	public createSql(builder: MigrationBuilder, {
		databaseMetadata,
		systemSchema,
		invalidateDatabaseMetadata,
	}: ModificationHandlerCreateSqlOptions): void {
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
			addForeignKeyConstraint({ builder, entity, targetEntity, relation, databaseMetadata, invalidateDatabaseMetadata })
		}
		acceptRelationTypeVisitor(this.schema.model, entity, this.getNormalizedOwningSide(), {
			visitManyHasOne: ({ relation }) => {
				createOwningSide(relation)
				const columnName = relation.joiningColumn.columnName
				const tableNameId = wrapIdentifier(entity.tableName)
				const columnNameId = wrapIdentifier(columnName)
				builder.sql(`CREATE INDEX ON ${tableNameId} (${columnNameId})`)
				invalidateDatabaseMetadata()
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwning: ({ relation }) => {
				createOwningSide(relation)
				const tableNameId = wrapIdentifier(entity.tableName)
				const columnNameId = wrapIdentifier(relation.joiningColumn.columnName)
				builder.sql(`ALTER TABLE ${tableNameId} ADD UNIQUE (${columnNameId})`)
				invalidateDatabaseMetadata()
			},
			visitOneHasOneInverse: () => {},
			visitManyHasManyOwning: ({ relation }) => {
				createJunctionTableSql(builder, systemSchema, this.schema, entity, targetEntity, relation)
			},
			visitManyHasManyInverse: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			updateModel(
				updateEntity(this.data.entityName, addField(this.getNormalizedOwningSide())),
				this.data.inverseSide !== undefined
					? updateEntity(this.data.owningSide.target, addField(this.data.inverseSide))
					: undefined,
			),
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
