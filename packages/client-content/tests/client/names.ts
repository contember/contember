import type { SchemaNames, SchemaEntityNames } from '@contember/client-content'
import type { ContemberClientEntities } from './entities'
import type { ContemberClientEnums } from './enums'
export const ContemberClientNames = {
	entities: {
		"Locale": {
			"name": "Locale",
			"fields": {
				"id": {
					"type": "column"
				},
				"code": {
					"type": "column"
				}
			},
			"scalars": [
				"id",
				"code"
			]
		},
		"Author": {
			"name": "Author",
			"fields": {
				"id": {
					"type": "column"
				},
				"name": {
					"type": "column"
				},
				"email": {
					"type": "column"
				},
				"posts": {
					"type": "many",
					"entity": "Post"
				}
			},
			"scalars": [
				"id",
				"name",
				"email"
			]
		},
		"Post": {
			"name": "Post",
			"fields": {
				"id": {
					"type": "column"
				},
				"publishedAt": {
					"type": "column"
				},
				"tags": {
					"type": "many",
					"entity": "Tag"
				},
				"author": {
					"type": "one",
					"entity": "Author"
				},
				"locales": {
					"type": "many",
					"entity": "PostLocale"
				},
				"status": {
					"type": "column"
				}
			},
			"scalars": [
				"id",
				"publishedAt",
				"status"
			]
		},
		"PostLocale": {
			"name": "PostLocale",
			"fields": {
				"id": {
					"type": "column"
				},
				"locale": {
					"type": "one",
					"entity": "Locale"
				},
				"title": {
					"type": "column"
				},
				"content": {
					"type": "column"
				},
				"post": {
					"type": "one",
					"entity": "Post"
				}
			},
			"scalars": [
				"id",
				"title",
				"content"
			]
		},
		"Tag": {
			"name": "Tag",
			"fields": {
				"id": {
					"type": "column"
				},
				"name": {
					"type": "column"
				},
				"posts": {
					"type": "many",
					"entity": "Post"
				}
			},
			"scalars": [
				"id",
				"name"
			]
		}
	} satisfies {[K in keyof ContemberClientEntities]: SchemaEntityNames<K>},
	enums: {
		"PostStatus": [
			"draft",
			"published",
			"archived"
		]
	} satisfies {[K in keyof ContemberClientEnums]: readonly ContemberClientEnums[K][]},
} satisfies SchemaNames
