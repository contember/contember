import { JSONObject } from '@contember/schema'

export type SchemaEntityNames<Name extends string> = {
	readonly name: Name
	readonly scalars: string[]
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
	entities: {
		[entityName: string]: SchemaEntityNames<string>
	}
}

export type EntityTypeLike = {
	name: string
	unique: JSONObject
	columns: {
		[columnName: string]: any
	}
	hasOne: {
		[relationName: string]: EntityTypeLike
	}
	hasMany: {
		[relationName: string]: EntityTypeLike
	}
	hasManyBy: {
		[relationName: string]: {
			entity: EntityTypeLike
			by: JSONObject
		}
	}
}

export type SchemaTypeLike = {
	entities: {
		[entityName: string]: EntityTypeLike
	}
}

