import { Input, Model } from 'cms-common'
import { getColumnName } from '../../content-schema/modelUtils'
import { escapeParameter, quoteIdentifier } from '../sql/utils'

const buildUniqueWhere = (schema: Model.Schema, entity: Model.Entity) => (
	tableName: string,
	where: Input.UniqueWhere
) => {
	const parts = []
	for (const field in where) {
		const columnName = getColumnName(schema, entity, field)
		parts.push(`${tableName}.${quoteIdentifier(columnName)} = ${escapeParameter(where[field])}`)
	}
	return parts.join(' AND ')
}

export default buildUniqueWhere
