import { wrapIdentifier } from '../../utils/dbHelpers.js'
import { JSONValue, Model } from '@contember/schema'
import { MigrationBuilder } from '@contember/database-migrations'
import { getColumnName, validateSqlFragment } from '@contember/schema-utils'
import { formatColumnValue, getColumnSqlType } from '../utils/columnUtils.js'

export const fillSeed = ({ builder, entity, columnName, nullable, type, seedExpression }: {
	entity: Model.Entity
	columnName: string
	nullable: boolean
	builder: MigrationBuilder
	type: 'creating' | 'updating'
	seedExpression: string
}) => {
	const where = type === 'updating' ? ` WHERE ${wrapIdentifier(columnName)} IS NULL` : ''
	builder.sql(`UPDATE ${wrapIdentifier(entity.tableName)}
				 SET ${wrapIdentifier(columnName)} = ${seedExpression}${where}`)

	// event log uses deferred constraint triggers, we need to fire them before ALTER
	builder.sql(`SET CONSTRAINTS ALL IMMEDIATE`)
	builder.sql(`SET CONSTRAINTS ALL DEFERRED`)

	if (!nullable) {
		builder.alterColumn(entity.tableName, columnName, {
			notNull: true,
		})
	}
}

export const formatSeedExpression = ({ model, entity, column, fillValue, copyValue }: {
	model: Model.Schema
	entity: Model.Entity
	column: Pick<Model.AnyColumn, 'type' | 'columnType' | 'list'>
	fillValue?: JSONValue
	copyValue?: string
}): string | null => {
	if (fillValue !== undefined) {
		// A `{ literal: true, value }` is emitted as raw SQL; migration JSON carries it past validateAddedSql, so check what is emitted.
		const sql = formatColumnValue(fillValue, column)
		const error = validateSqlFragment(sql, 'expression')
		if (error) {
			throw new Error(`Invalid fill value for ${entity.name}: SQL ${error}`)
		}
		return sql
	} else if (copyValue !== undefined) {
		const copyFrom = getColumnName(model, entity, copyValue)
		return `${wrapIdentifier(copyFrom)}::${getColumnSqlType(column)}`
	}
	return null
}
