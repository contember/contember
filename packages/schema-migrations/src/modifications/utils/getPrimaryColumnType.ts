import { Model } from '@contember/schema'

export const getPrimaryColumnType = (entity: Model.Entity): string => {
	const column = entity.fields[entity.primary] as Model.AnyColumn
	return column.columnType
}
