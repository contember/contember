
export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

export type Locale <OverRelation extends string | never = never> = {
	name: 'Locale'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ code: string}, OverRelation>
	columns: {
		id: string
		code: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type Author <OverRelation extends string | never = never> = {
	name: 'Author'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ posts: Post['unique']}, OverRelation>
	columns: {
		id: string
		name: string | null
		email: string | null
	}
	hasOne: {
	}
	hasMany: {
		posts: Post<'author'>
	}
	hasManyBy: {
		postsByLocales: { entity: Post; by: {locales: PostLocale['unique']}  }
	}
}
export type Post <OverRelation extends string | never = never> = {
	name: 'Post'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ locales: PostLocale['unique']}, OverRelation>
	columns: {
		id: string
		publishedAt: string | null
	}
	hasOne: {
		author: Author
	}
	hasMany: {
		tags: Tag
		locales: PostLocale<'post'>
	}
	hasManyBy: {
		localesByLocale: { entity: PostLocale; by: {locale: Locale['unique']}  }
	}
}
export type PostLocale <OverRelation extends string | never = never> = {
	name: 'PostLocale'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ locale: Locale['unique'], post: Post['unique']}, OverRelation>
	columns: {
		id: string
		title: string | null
		content: string | null
	}
	hasOne: {
		locale: Locale
		post: Post
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type Tag <OverRelation extends string | never = never> = {
	name: 'Tag'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		name: string | null
	}
	hasOne: {
	}
	hasMany: {
		posts: Post
	}
	hasManyBy: {
	}
}

export type ContemberClientEntities = {
	Locale: Locale
	Author: Author
	Post: Post
	PostLocale: PostLocale
	Tag: Tag
}

export type ContemberClientSchema = {
	entities: ContemberClientEntities
}
