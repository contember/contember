import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import {
	SchemaUpdater,
	updateAcl,
	updateAclEntities,
	updateAclEveryEntity,
	updateAclEveryPredicate,
	updateAclEveryRole,
	updateModel,
	updateSchema,
} from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { VERSION_ACL_PATCH } from '../ModificationVersions'
import { PredicateDefinitionProcessor } from '@contember/schema-utils'

class RemoveEntityModification implements Modification<RemoveEntityModification.Data> {
	constructor(
		private readonly data: RemoveEntityModification.Data,
		private readonly schema: Schema,
		private readonly formatVersion: number,
	) {}

	public createSql(builder: MigrationBuilder): void {
		builder.dropTable(this.schema.model.entities[this.data.entityName].tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			updateModel(model => {
				const { [this.data.entityName]: removed, ...entities } = model.entities
				return {
					...model,
					entities: { ...entities },
				}
			}),
			this.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
						updateAclEveryRole(
							role => ({
								...role,
								variables: Object.fromEntries(
									Object.entries(role.variables).filter(([, variable]) => variable.entityName !== this.data.entityName),
								),
							}),
							updateAclEntities(entities => {
								const { [this.data.entityName]: removed, ...other } = entities
								return other
							}),
							updateAclEveryEntity(
								updateAclEveryPredicate((predicate, entityName) => {
									const processor = new PredicateDefinitionProcessor(this.schema.model)
									const currentEntity = this.schema.model.entities[entityName]
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
}

namespace RemoveEntityModification {
	export const id = 'removeEntity'

	export interface Data {
		entityName: string
	}
}

export default RemoveEntityModification
