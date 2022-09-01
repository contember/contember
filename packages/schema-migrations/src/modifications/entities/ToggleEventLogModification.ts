import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler,
	ModificationHandlerOptions,
} from '../ModificationHandler'
import {
	createEventTrigger,
	createEventTrxTrigger,
	dropEventTrigger,
	dropEventTrxTrigger,
} from '../utils/sqlUpdateUtils'

export class ToggleEventLogModificationHandler implements ModificationHandler<ToggleEventLogModificationData> {

	constructor(
		private readonly data: ToggleEventLogModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		if (this.data.enabled) {
			createEventTrigger(builder, this.options.systemSchema, entity.tableName, [entity.primaryColumn])
			createEventTrxTrigger(builder, this.options.systemSchema, entity.tableName)
		} else {
			dropEventTrigger(builder, entity.tableName)
			dropEventTrxTrigger(builder, entity.tableName)
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, enabled } = this.data
		return updateModel(
			updateEntity(
				entityName,
				({ entity: { eventLog, ...entity } }) => ({
					...entity,
					eventLog: { enabled },
				}),
			),
		)
	}

	describe() {
		return {
			message: `${this.data.enabled ? 'Enable' : 'Disable'} event log for ${this.data.entityName}`,
		}
	}
}

export interface ToggleEventLogModificationData {
	entityName: string
	enabled: boolean
}

export const toggleEventLogModification = createModificationType({
	id: 'toggleEventLog',
	handler: ToggleEventLogModificationHandler,
})

export class ToggleEventLogDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.flatMap(updatedEntity => {
				const origEntity = originalSchema.model.entities[updatedEntity.name]
				if (!origEntity) {
					return []
				}
				const newValue = updatedEntity.eventLog.enabled
				const oldValue = origEntity.eventLog.enabled
				if (newValue !== oldValue) {
					return [toggleEventLogModification.createModification({
						entityName: updatedEntity.name,
						enabled: newValue,
					})]
				}
				return []
			})

	}
}
