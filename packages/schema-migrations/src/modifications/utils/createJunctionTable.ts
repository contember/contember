import { createEventTrigger, createEventTrxTrigger } from './sqlUpdateUtils'
import { MigrationBuilder } from '@contember/database-migrations'
import { Model } from '@contember/schema'
import { getPrimaryColumnType } from './getPrimaryColumnType'

export const createJunctionTableSql = (
	builder: MigrationBuilder,
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
		{
			constraints: {
				primaryKey: primaryColumns,
			},
		},
	)
	createEventTrigger(builder, relation.joiningTable.tableName, primaryColumns)
	createEventTrxTrigger(builder, relation.joiningTable.tableName)
}
