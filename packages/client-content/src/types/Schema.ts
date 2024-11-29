import { JSONObject } from '@contember/schema'

export type SchemaEntityNames<Name extends string> = {
	readonly name: Name
	readonly scalars: readonly string[]
	readonly fields: {
		readonly [fieldName: string]:
			| {
				readonly type: 'column'
			}
			| {
				readonly type: 'many' | 'one'
				readonly entity: string
			}
	}
}

export type SchemaNames = {
	readonly entities: {
		readonly [entityName: string]: SchemaEntityNames<string>
	}
	readonly enums: {
		readonly [enumName: string]: readonly string[]
	}
}

export type EntityTypeLike = {
	name: string
	unique: JSONObject
	columns: {
		[columnName: string]: any
	}
	hasOne: {
		[relationName: string]: any
	}
	hasMany: {
		[relationName: string]: any
	}
	hasManyBy: {
		[relationName: string]: {
			entity: any
			by: JSONObject
		}
	}
}

export type SchemaTypeLike = {
	entities: {
		[entityName: string]: EntityTypeLike
	}
}

