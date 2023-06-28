import { wrapIdentifier } from '../../utils/dbHelpers'
import { ImplementationException } from '../../exceptions'
import { JSONValue, Model } from '@contember/schema'
import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { getColumnName } from '@contember/schema-utils'

export const fillSeed = ({ builder, fillValue, copyValue, entity, columnName, nullable, model, columnType, type }: {
	model: Model.Schema
	entity: Model.Entity
	columnName: string
	columnType: string
	nullable: boolean
	builder: MigrationBuilder
	fillValue?: JSONValue
	copyValue?: string
	type: 'creating' | 'updating'
}) => {
	const where = type === 'updating' ? ` WHERE ${wrapIdentifier(columnName)} IS NULL` : ''
	if (fillValue !== undefined) {
		builder.sql(`UPDATE ${wrapIdentifier(entity.tableName)}
                     SET ${wrapIdentifier(columnName)} = ${escapeValue(fillValue)}${where}`)
	} else if (copyValue !== undefined) {
		const copyFrom = getColumnName(model, entity, copyValue)
		builder.sql(`UPDATE ${wrapIdentifier(entity.tableName)}
                     SET ${wrapIdentifier(columnName)} = ${wrapIdentifier(copyFrom)}::${columnType}${where}`)
	} else {
		throw new ImplementationException()
	}

	if (!nullable) {
		builder.alterColumn(entity.tableName, columnName, {
			notNull: true,
		})
	}
}
