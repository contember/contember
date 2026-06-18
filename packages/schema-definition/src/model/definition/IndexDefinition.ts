import { extendEntity } from './extensions.js'
import { DecoratorFunction } from '../../utils/index.js'
import { Model } from '@contember/schema'

export type IndexColumn<T> =
	| keyof T
	| {
		field: keyof T
		order?: Model.IndexColumnOrder
		nulls?: Model.IndexColumnNulls
		opClass?: string
	}

export type IndexOptions<T> = {
	fields: IndexColumn<T>[]
	method?: Model.IndexMethod
	opClass?: string
	where?: string
	include?: (keyof T)[]
}
export function Index<T>(options: IndexOptions<T>): DecoratorFunction<T>
export function Index<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Index<T>(options: IndexOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => ({
		...entity,
		indexes: [
			...entity.indexes,
			typeof options !== 'object'
				? { fields: [String(options), ...args.map(String)] }
				: normalizeIndex(options),
		],
	}))
}

const normalizeIndex = <T>(options: IndexOptions<T>): Model.Index => {
	const fields: string[] = []
	const columnOptions: { [field: string]: Model.IndexColumnOptions } = {}
	for (const column of options.fields) {
		if (typeof column === 'object') {
			const field = String(column.field)
			fields.push(field)
			const columnOption: Model.IndexColumnOptions = {
				...(column.order !== undefined ? { order: column.order } : {}),
				...(column.nulls !== undefined ? { nulls: column.nulls } : {}),
				...(column.opClass !== undefined ? { opClass: column.opClass } : {}),
			}
			if (Object.keys(columnOption).length > 0) {
				columnOptions[field] = columnOption
			}
		} else {
			fields.push(String(column))
		}
	}
	return {
		fields,
		...(options.method !== undefined ? { method: options.method } : {}),
		...(options.opClass !== undefined ? { opClass: options.opClass } : {}),
		...(options.where !== undefined ? { where: options.where } : {}),
		...(options.include !== undefined ? { include: options.include.map(String) } : {}),
		...(Object.keys(columnOptions).length > 0 ? { columnOptions } : {}),
	}
}
