import { MigrationBuilder } from '@contember/database-migrations'
import { Acl, Model, Schema } from '@contember/schema'
import {
	removeField,
	SchemaUpdater,
	updateAcl,
	updateAclEntities,
	updateAclEveryEntity,
	updateAclEveryPredicate,
	updateAclEveryRole,
	updateModel,
	updateSchema,
} from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler, ModificationHandlerCreateSqlOptions,
	ModificationHandlerOptions,
} from '../ModificationHandler'
import { VERSION_ACL_PATCH, VERSION_REMOVE_REFERENCING_RELATIONS } from '../ModificationVersions'
import { acceptEveryFieldVisitor, isInverseRelation, isRelation, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { removeFieldModification } from '../fields'

export class RemoveEntityModificationHandler implements ModificationHandler<RemoveEntityModificationData> {
	constructor(
		private readonly data: RemoveEntityModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {}

	public createSql(builder: MigrationBuilder, options: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			if (entity.view.materialized) {
				builder.dropMaterializedView(entity.tableName)
			} else {
				builder.dropView(entity.tableName)
			}
			return
		}
		if (this.options.formatVersion >= VERSION_REMOVE_REFERENCING_RELATIONS) {
			this.getFieldsToRemove(this.schema).forEach(([entityName, fieldName]) => {
				const removeFieldHandler = removeFieldModification.createHandler({ entityName, fieldName }, this.schema, this.options)
				removeFieldHandler.createSql(builder, options)
			})
		}
		acceptEveryFieldVisitor(this.schema.model, entity, {
			visitManyHasManyOwning: ({ relation }) => {
				builder.dropTable(relation.joiningTable.tableName)
			},
			visitManyHasManyInverse: () => {},
			visitColumn: () => {},
			visitOneHasOneInverse: () => {},
			visitOneHasOneOwning: () => {},
			visitManyHasOne: () => {},
			visitOneHasMany: () => {},
		})
		builder.dropTable(entity.tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			this.options.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
					updateAclEveryRole(
						({ role }) => ({
							...role,
							variables: Object.fromEntries(
								Object.entries(role.variables).filter(([, variable]) =>
									variable.type !== Acl.VariableType.entity || variable.entityName !== this.data.entityName,
								),
							),
						}),
						updateAclEntities(({ entities }) => {
							const { [this.data.entityName]: removed, ...other } = entities
							return other
						}),
						updateAclEveryEntity(
							updateAclEveryPredicate(({ predicate, entityName, schema }) => {
								const processor = new PredicateDefinitionProcessor(schema.model)
								const currentEntity = schema.model.entities[entityName]
								return processor.process(currentEntity, predicate, {
									handleColumn: ctx => {
										return ctx.entity.name === this.data.entityName ? undefined : ctx.value
									},
									handleRelation: ctx => {
										return ctx.entity.name === this.data.entityName ? undefined : ctx.value
									},
								})
							}),
						),
					),
				  )
				: undefined,
			this.options.formatVersion >= VERSION_REMOVE_REFERENCING_RELATIONS
				? ({ schema }) => {
					const fieldsToRemove = this.getFieldsToRemove(schema)
					return fieldsToRemove.reduce(
						(schema, [entity, field]) => removeField(entity, field, this.options.formatVersion)({ schema }),
						schema,
					)
				  }
				: undefined,
			updateModel(({ model }) => {
				const { [this.data.entityName]: removed, ...entities } = model.entities
				return {
					...model,
					entities: { ...entities },
				}
			}),
		)
	}

	private getFieldsToRemove(schema: Schema): [entity: string, field: string][] {
		return Object.values(schema.model.entities).flatMap(entity =>
			Object.values(entity.fields)
				.filter((field): field is Model.AnyRelation => isRelation(field) && field.target === this.data.entityName)
				.filter(field => !isInverseRelation(field) || entity.name !== this.data.entityName) // skip self-referencing inverse relations
				.map((field): [string, string] => [entity.name, field.name]),
		)
	}

	describe() {
		return { message: `Remove entity ${this.data.entityName}`, isDestructive: true }
	}

}

export interface RemoveEntityModificationData {
	entityName: string
}

export const removeEntityModification = createModificationType({
	id: 'removeEntity',
	handler: RemoveEntityModificationHandler,
})

export class RemoveEntityDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.keys(originalSchema.model.entities)
			.filter(name => !updatedSchema.model.entities[name])
			.map(entityName => removeEntityModification.createModification({ entityName }))
	}
}
