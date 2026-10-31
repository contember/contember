import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import deepEqual from 'fast-deep-equal'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

export class CreateCheckConstraintModificationHandler implements ModificationHandler<CreateCheckConstraintModificationData> {
	constructor(private readonly data: CreateCheckConstraintModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder, { invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const { name, expression } = this.data.check
		// `expression` is a raw, developer-authored SQL predicate with the same trust boundary as a partial
		// index `where` or a @c.View body; its shape is validated in ModelValidator.
		builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} ADD CONSTRAINT ${wrapIdentifier(name)} CHECK (${expression})`)
		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				checks: [...entity.checks ?? [], this.data.check],
			})),
		)
	}

	describe({ createdEntities }: { createdEntities: string[] }) {
		return {
			message: `Create check constraint ${this.data.check.name} (${this.data.check.expression}) on entity ${this.data.entityName}`,
			failureWarning: !createdEntities.includes(this.data.entityName)
				? 'Make sure all existing rows satisfy the check, otherwise this may fail in runtime.'
				: undefined,
		}
	}
}

export const createCheckConstraintModification = createModificationType({
	id: 'createCheckConstraint',
	handler: CreateCheckConstraintModificationHandler,
})

export interface CreateCheckConstraintModificationData {
	entityName: string
	check: Model.CheckConstraint
}

export class CreateCheckConstraintDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities).flatMap(entity => {
			const originalChecks = originalSchema.model.entities[entity.name]?.checks ?? []
			return (entity.checks ?? [])
				.filter(check => !originalChecks.some(it => deepEqual(it, check)))
				.map(check => createCheckConstraintModification.createModification({ entityName: entity.name, check }))
		})
	}
}
