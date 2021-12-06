import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
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
import { ModificationHandlerStatic } from '../ModificationHandler'
import { VERSION_ACL_PATCH, VERSION_REMOVE_REFERENCING_RELATIONS } from '../ModificationVersions'
import { isRelation, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { RemoveFieldModification } from '../fields'

export const RemoveEntityModification: ModificationHandlerStatic<RemoveEntityModificationData> = class {
	static id = 'removeEntity'
	constructor(
		private readonly data: RemoveEntityModificationData,
		private readonly schema: Schema,
		private readonly formatVersion: number,
	) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			builder.dropView(entity.tableName)
			return
		}
		if (this.formatVersion >= VERSION_REMOVE_REFERENCING_RELATIONS) {
			this.getFieldsToRemove(this.schema).forEach(([entityName, fieldName]) => {
				(new RemoveFieldModification({ entityName, fieldName }, this.schema, this.formatVersion)).createSql(builder)
			})
		}
		builder.dropTable(entity.tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			this.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
					updateAclEveryRole(
						({ role }) => ({
							...role,
							variables: Object.fromEntries(
								Object.entries(role.variables).filter(([, variable]) => variable.entityName !== this.data.entityName),
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
			this.formatVersion >= VERSION_REMOVE_REFERENCING_RELATIONS
				? ({ schema }) => {
					const fieldsToRemove = this.getFieldsToRemove(schema)
					return fieldsToRemove.reduce(
						(schema, [entity, field]) => removeField(entity, field, this.formatVersion)({ schema }),
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
				.filter(field => isRelation(field) && field.target === this.data.entityName)
				.map((field): [string, string] => [entity.name, field.name]),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]
		return events.filter(it => {
			return it.tableName !== entity.tableName
		})
	}

	describe() {
		return { message: `Remove entity ${this.data.entityName}`, isDestructive: true }
	}

	static createModification(data: RemoveEntityModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.keys(originalSchema.model.entities)
			.filter(name => !updatedSchema.model.entities[name])
			.map(entityName => RemoveEntityModification.createModification({ entityName }))
	}
}

export interface RemoveEntityModificationData {
	entityName: string
}
