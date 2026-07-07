import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler.js'

export class ToggleEntityImmutableModificationHandler implements ModificationHandler<ToggleEntityImmutableModificationData> {
	constructor(private readonly data: ToggleEntityImmutableModificationData, private readonly schema: Schema) {}

	// Immutable only gates Content API mutation generation — no DB change.
	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, immutable } = this.data
		return updateModel(
			updateEntity(entityName, ({ entity: { immutable: _, ...entity } }) => {
				if (immutable) {
					return { ...entity, immutable: true }
				}
				return entity
			}),
		)
	}

	describe() {
		return { message: `${this.data.immutable ? 'Mark' : 'Unmark'} entity ${this.data.entityName} as immutable` }
	}
}

export interface ToggleEntityImmutableModificationData {
	entityName: string
	immutable: boolean
}

export const toggleEntityImmutableModification = createModificationType({
	id: 'toggleEntityImmutable',
	handler: ToggleEntityImmutableModificationHandler,
})

export class ToggleEntityImmutableDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.flatMap(updatedEntity => {
				const origEntity = originalSchema.model.entities[updatedEntity.name]
				if (!origEntity) {
					return []
				}
				const newValue = updatedEntity.immutable ?? false
				const oldValue = origEntity.immutable ?? false
				if (newValue !== oldValue) {
					return [toggleEntityImmutableModification.createModification({
						entityName: updatedEntity.name,
						immutable: newValue,
					})]
				}
				return []
			})
	}
}
