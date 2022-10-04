import { createEventTrigger, createEventTrxTrigger } from './sqlUpdateUtils'
import { MigrationBuilder } from '@contember/database-migrations'
import { Model } from '@contember/schema'
import { getPrimaryColumnType } from './getPrimaryColumnType'
import { resolveIndexName, SchemaWithMeta } from './schemaMeta'

export const createJunctionTableSql = (
	builder: MigrationBuilder,
	systemSchema: string,
	schema: SchemaWithMeta,
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
	const proposedIndexName = `${relation.joiningTable.tableName}_pkey`
	const indexName = resolveIndexName(schema, proposedIndexName)
	builder.addConstraint(relation.joiningTable.tableName, indexName, {
		primaryKey: primaryColumns,
	})
	if (relation.joiningTable.eventLog.enabled) {
		createEventTrigger(builder, systemSchema, relation.joiningTable.tableName, primaryColumns)
		createEventTrxTrigger(builder, systemSchema, relation.joiningTable.tableName)
	}
}
