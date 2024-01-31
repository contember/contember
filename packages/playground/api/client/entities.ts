import type { BoardTaskStatus } from './enums'

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
}

export type ContemberClientSchema = {
	entities: ContemberClientEntities
}
