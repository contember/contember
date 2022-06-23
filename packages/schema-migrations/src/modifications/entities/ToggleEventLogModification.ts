import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { ModificationHandlerOptions, ModificationHandlerStatic } from '../ModificationHandler.js'
import {
	createEventTrigger,
	createEventTrxTrigger,
	dropEventTrigger,
	dropEventTrxTrigger,
} from '../utils/sqlUpdateUtils.js'

export const ToggleEventLogModification: ModificationHandlerStatic<ToggleEventLogModificationData> = class {
	static id = 'toggleEventLog'

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

	static createModification(data: ToggleEventLogModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.flatMap(updatedEntity => {
				const origEntity = originalSchema.model.entities[updatedEntity.name]
				if (!origEntity) {
					return []
				}
				const newValue = updatedEntity.eventLog.enabled
				const oldValue = origEntity.eventLog.enabled
				if (newValue !== oldValue) {
					return [ToggleEventLogModification.createModification({
						entityName: updatedEntity.name,
						enabled: newValue,
					})]
				}
				return []
			})

	}
}

export interface ToggleEventLogModificationData {
	entityName: string
	enabled: boolean
}
