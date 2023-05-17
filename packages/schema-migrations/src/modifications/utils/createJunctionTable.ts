import { createEventTrigger, createEventTrxTrigger } from './sqlUpdateUtils'
import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { getPrimaryColumnType } from './getPrimaryColumnType'
import { wrapIdentifier } from '../../utils/dbHelpers'

export const createJunctionTableSql = (
	builder: MigrationBuilder,
	systemSchema: string,
	schema: Schema,
	entity: Model.Entity,
	targetEntity: Model.Entity,
	relation: Model.ManyHasManyOwningRelation,
) => {
	const primaryColumns = [
		relation.joiningTable.joiningColumn.columnName,
		relation.joiningTable.inverseJoiningColumn.columnName,
	]
	builder.createTable(
		relation.joiningTable.tableName,
		{
			[relation.joiningTable.joiningColumn.columnName]: {
				type: getPrimaryColumnType(entity),
				notNull: true,
				references: `"${entity.tableName}"("${entity.primaryColumn}")`,
				onDelete: 'CASCADE',
			},
			[relation.joiningTable.inverseJoiningColumn.columnName]: {
				type: getPrimaryColumnType(targetEntity),
				notNull: true,
				references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
				onDelete: 'CASCADE',
			},
		},
	)

	const tableNameId = wrapIdentifier(relation.joiningTable.tableName)
	const columnNameId = primaryColumns.map(wrapIdentifier)
	builder.sql(`ALTER TABLE ${tableNameId} ADD PRIMARY KEY (${columnNameId.join(', ')})`)

	if (relation.joiningTable.eventLog.enabled) {
		createEventTrigger(builder, systemSchema, relation.joiningTable.tableName, primaryColumns)
		createEventTrxTrigger(builder, systemSchema, relation.joiningTable.tableName)
	}
}
