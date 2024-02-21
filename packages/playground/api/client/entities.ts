import type { BoardTaskStatus } from './enums'
import type { GridArticleState } from './enums'
import type { InputUnique } from './enums'
import type { SelectUnique } from './enums'
import type { InputRootEnumValue } from './enums'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

export type BoardTag = {
	name: 'BoardTag'
	unique:
		| { id: string }
		| { slug: string }
	columns: {
		id: string
		name: string
		slug: string
		color: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type BoardTask = {
	name: 'BoardTask'
	unique:
		| { id: string }
	columns: {
		id: string
		title: string
		description: string | null
		status: BoardTaskStatus | null
		order: number | null
	}
	hasOne: {
		assignee: BoardUser
	}
	hasMany: {
		tags: BoardTag
	}
	hasManyBy: {
	}
}
export type BoardUser = {
	name: 'BoardUser'
	unique:
		| { id: string }
		| { username: string }
	columns: {
		id: string
		name: string
		username: string
		order: number | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridArticle = {
	name: 'GridArticle'
	unique:
		| { id: string }
		| { slug: string }
	columns: {
		id: string
		title: string | null
		slug: string
		state: GridArticleState | null
		locked: boolean | null
		publishedAt: string | null
		publishDate: string | null
		views: number | null
	}
	hasOne: {
		author: GridAuthor
		category: GridCategory
	}
	hasMany: {
		tags: GridTag
	}
	hasManyBy: {
	}
}
export type GridAuthor = {
	name: 'GridAuthor'
	unique:
		| { id: string }
		| { slug: string }
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridCategory = {
	name: 'GridCategory'
	unique:
		| { id: string }
		| { slug: string }
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridTag = {
	name: 'GridTag'
	unique:
		| { id: string }
		| { slug: string }
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type InputRoot = {
	name: 'InputRoot'
	unique:
		| { id: string }
		| { unique: InputUnique }
	columns: {
		id: string
		unique: InputUnique
		textValue: string | null
		intValue: number | null
		floatValue: number | null
		boolValue: boolean | null
		dateValue: string | null
		datetimeValue: string | null
		jsonValue: JSONValue | null
		enumValue: InputRootEnumValue | null
		uuidValue: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type InputRules = {
	name: 'InputRules'
	unique:
		| { id: string }
		| { unique: InputUnique }
		| { uniqueValue: string }
	columns: {
		id: string
		unique: InputUnique
		notNullValue: string
		uniqueValue: string | null
		validationValue: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type RepeaterItem = {
	name: 'RepeaterItem'
	unique:
		| { id: string }
	columns: {
		id: string
		title: string
		order: number | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type SelectItem = {
	name: 'SelectItem'
	unique:
		| { id: string }
	columns: {
		id: string
		order: number | null
	}
	hasOne: {
		root: SelectRoot
		value: SelectValue
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type SelectRoot = {
	name: 'SelectRoot'
	unique:
		| { id: string }
		| { unique: SelectUnique }
		| { hasOne: SelectValue['unique'] }
		| { hasManySorted: SelectItem['unique'] }
	columns: {
		id: string
		unique: SelectUnique
	}
	hasOne: {
		hasOne: SelectValue
	}
	hasMany: {
		hasMany: SelectValue
		hasManySorted: SelectItem
	}
	hasManyBy: {
	}
}
export type SelectValue = {
	name: 'SelectValue'
	unique:
		| { id: string }
		| { slug: string }
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}

export type ContemberClientEntities = {
	BoardTag: BoardTag
	BoardTask: BoardTask
	BoardUser: BoardUser
	GridArticle: GridArticle
	GridAuthor: GridAuthor
	GridCategory: GridCategory
	GridTag: GridTag
	InputRoot: InputRoot
	InputRules: InputRules
	RepeaterItem: RepeaterItem
	SelectItem: SelectItem
	SelectRoot: SelectRoot
	SelectValue: SelectValue
}

export type ContemberClientSchema = {
	entities: ContemberClientEntities
}
