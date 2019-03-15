import {Model} from 'cms-common'
export const resolveDefaultValue = (column: Model.AnyColumn, now: Date) => {
	switch (column.type) {
		case Model.ColumnType.String:
		case Model.ColumnType.Int:
		case Model.ColumnType.Enum:
		case Model.ColumnType.Double:
		case Model.ColumnType.Bool:
			if (typeof column.default !== 'undefined') {
				return column.default
			}
			break
		case Model.ColumnType.DateTime:
		case Model.ColumnType.Date:
			if (column.default === 'now') {
				return now.toISOString()
			}
			break
		case Model.ColumnType.Uuid:
			break
		default:
			;((x: never) => {
		})(column)
	}


	if (column.nullable) {
		return null
	}

	throw new NoDataError(`No data for column ${column.name}`)
}

export class NoDataError extends Error {

}
