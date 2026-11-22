import { wrapIdentifier } from '../../utils/dbHelpers.js'
import { JSONValue, Model } from '@contember/schema'
import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { getColumnName } from '@contember/schema-utils'
import { validateLiteralSql } from '../../utils/literalSql.js'

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

export const formatSeedExpression = ({ model, entity, columnType, fillValue, copyValue }: {
	model: Model.Schema
	entity: Model.Entity
	columnType: string
	fillValue?: JSONValue
	copyValue?: string
}): string | null => {
	if (fillValue !== undefined) {
		// A fill value comes from migration JSON, which validateAddedSql does not see.
		const error = validateLiteralSql(fillValue)
		if (error) {
			throw new Error(`Invalid fill value for ${entity.name}: ${error}`)
		}
		return escapeValue(fillValue).toString()
	} else if (copyValue !== undefined) {
		const copyFrom = getColumnName(model, entity, copyValue)
		return `${wrapIdentifier(copyFrom)}::${columnType}`
	}
	return null
}
