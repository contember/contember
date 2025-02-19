import { Input, Model, Value } from '@contember/schema'

export interface Providers {
	uuid: (args?: { version?: 4 | 7 }) => string
	now: () => Date
}

export const resolveDefaultValue = (column: Model.AnyColumn, providers: Pick<Providers, 'now'>) => {
	const type = column.type

	if (type === Model.ColumnType.Int && column.sequence) {
		return undefined
	}

	switch (type) {
		case Model.ColumnType.String:
		case Model.ColumnType.Int:
		case Model.ColumnType.Enum:
		case Model.ColumnType.Double:
		case Model.ColumnType.Bool:
		case Model.ColumnType.Json:
			if (typeof column.default !== 'undefined') {
				return column.default
			}
			break
		case Model.ColumnType.DateTime:
		case Model.ColumnType.Date:
			if (column.default === 'now') {
				return providers.now().toISOString()
			}
			break
		case Model.ColumnType.Uuid:
			break
		default:
			((x: never) => {})(type)
	}

	if (column.nullable) {
		return null
	}

	throw new NoDataError(`No data for column ${column.name}`)
}

export const resolveColumnValue = (
	{
		entity,
		column,
		input,
	}: {
		entity: Model.Entity
		column: Model.AnyColumn
		input: Input.ColumnValue | undefined
	},
	providers: Providers,
	options: {
		uuidVersion?: 4 | 7
	},
): Value.FieldValue | undefined => {
	if (input !== undefined) {
		return input
	}
	if (entity.primary === column.name) {
		if (column.type === Model.ColumnType.Uuid) {
			return providers.uuid({ version: options.uuidVersion })
		}
		return undefined
	}

	return resolveDefaultValue(column, providers)
}

export class NoDataError extends Error {}
