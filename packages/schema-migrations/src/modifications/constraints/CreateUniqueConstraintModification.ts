import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { acceptFieldVisitor } from '@contember/schema-utils'

class CreateUniqueConstraintModification implements Modification<CreateUniqueConstraintModification.Data> {
	constructor(private readonly data: CreateUniqueConstraintModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const fields = this.data.unique.fields

		const columns = fields.map(fieldName => {
			return acceptFieldVisitor(this.schema.model, entity, fieldName, {
				visitColumn: ({}, column) => {
					return column.columnName
				},
				visitManyHasOne: ({}, relation) => {
					return relation.joiningColumn.columnName
				},
				visitOneHasMany: () => {
					throw new Error(`Cannot create unique key on 1:m relation in ${entity.name}.${fieldName}`)
				},
				visitOneHasOneOwner: () => {
					throw new Error(
						`Cannot create unique key on 1:1 relation, this relation has unique key by default in ${entity.name}.${fieldName}`,
					)
				},
				visitOneHasOneInversed: () => {
					throw new Error(`Cannot create unique key on 1:1 inversed relation in ${entity.name}.${fieldName}`)
				},
				visitManyHasManyOwner: () => {
					throw new Error(`Cannot create unique key on m:m relation in ${entity.name}.${fieldName}`)
				},
				visitManyHasManyInversed: () => {
					throw new Error(`Cannot create unique key on m:m inversed relation in ${entity.name}.${fieldName}`)
				},
			})
		})
		builder.addConstraint(entity.tableName, this.data.unique.name, { unique: columns })
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, entity => ({
				...entity,
				unique: {
					...entity.unique,
					[this.data.unique.name]: this.data.unique,
				},
			})),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe({ createdEntities }: { createdEntities: string[] }) {
		return {
			message: `Create unique constraint (${this.data.unique.fields.join(', ')}) on entity ${this.data.entityName}`,
			failureWarning: !createdEntities.includes(this.data.entityName)
				? 'Make sure no conflicting rows exists, otherwise this may fail in runtime.'
				: undefined,
		}
	}
}

namespace CreateUniqueConstraintModification {
	export const id = 'createUniqueConstraint'

	export interface Data {
		entityName: string
		unique: Model.UniqueConstraint
	}
}

export default CreateUniqueConstraintModification
