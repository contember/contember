import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
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
import { isOwningRelation, isRelation } from '@contember/schema-utils'
import { updateRelations } from '../utils/diffUtils'
import { isIt } from '../../utils/isIt'

export class ToggleJunctionEventLogModificationHandler implements ModificationHandler<ToggleJunctionEventLogModificationData> {

	constructor(
		private readonly data: ToggleJunctionEventLogModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const relation = entity.fields[this.data.fieldName]
		if (!isRelation(relation) || relation.type !== Model.RelationType.ManyHasMany || !isOwningRelation(relation)) {
			throw new Error('invalid field')
		}
		const tableName = relation.joiningTable.tableName
		if (this.data.enabled) {
			const primaryColumns = [
				relation.joiningTable.joiningColumn.columnName,
				relation.joiningTable.inverseJoiningColumn.columnName,
			]
			createEventTrigger(builder, this.options.systemSchema, tableName, primaryColumns)
			createEventTrxTrigger(builder, this.options.systemSchema, tableName)
		} else {
			dropEventTrigger(builder, tableName)
			dropEventTrxTrigger(builder, tableName)
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, enabled } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.ManyHasManyOwningRelation>(fieldName, ({ field: { joiningTable: { eventLog, ...joiningTable }, ...field } }) => {
					return {
						...field,
						joiningTable: {
							...joiningTable,
							eventLog: {
								enabled,
							},
						},
					}
				}),
			),
		)
	}

	describe() {
		return {
			message: `${this.data.enabled ? 'Enable' : 'Disable'} event log for ${this.data.entityName}.${this.data.fieldName}`,
		}
	}
}

export interface ToggleJunctionEventLogModificationData {
	entityName: string
	fieldName: string
	enabled: boolean
}

export const toggleJunctionEventLogModification = createModificationType({
	id: 'toggleJunctionEventLog',
	handler: ToggleJunctionEventLogModificationHandler,
})

export class ToggleJunctionEventLogDiffer implements Differ {
	 createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.JoiningTableRelation>(updatedRelation, 'joiningTable') &&
				isIt<Model.JoiningTableRelation>(originalRelation, 'joiningTable')
			) {
				const newValue = updatedRelation.joiningTable.eventLog?.enabled ?? false
				const oldValue = originalRelation.joiningTable.eventLog?.enabled ?? false
				if (newValue !== oldValue) {
					return toggleJunctionEventLogModification.createModification({
						entityName: updatedEntity.name,
						fieldName: updatedRelation.name,
						enabled: newValue,
					})
				}
			}
			return undefined
		})

	}
}
