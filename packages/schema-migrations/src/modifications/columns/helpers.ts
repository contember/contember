import { wrapIdentifier } from '../../utils/dbHelpers'
import { escapeValue } from '@contember/database-migrations'
import { getColumnName } from '@contember/schema-utils'
import { JSONValue, Model } from '@contember/schema'

export const formatSeedExpression = ({ model, entity, columnType, fillValue, copyValue }: {
	model: Model.Schema
	entity: Model.Entity
	columnType: string
	fillValue?: JSONValue
	copyValue?: string
}): string | null => {
	if (fillValue !== undefined) {
		return escapeValue(fillValue)
	} else if (copyValue !== undefined) {
		const copyFrom = getColumnName(model, entity, copyValue)
		return `${wrapIdentifier(copyFrom)}::${columnType}`
	}
	return null
}
