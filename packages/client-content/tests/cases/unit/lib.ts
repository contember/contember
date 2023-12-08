import { ContentClient, ContentQueryBuilder, TypedContentQueryBuilder } from '../../../src'

export namespace Schema {
	export type Author = {
		name: 'Author'
		unique: { id: number }
		columns: {
			id: number
			name: string
			email: string
		}
		hasMany: {
			posts: Post
		}
		hasOne: {}
		hasManyBy: {}
	}


	export type Post = {
		name: 'Post'
		unique: { id: number }
		columns: {
			id: number
			title: string
			content: string
		}
		hasMany: {
			tags: Tag
		}
		hasOne: {
			author: Author
		}
		hasManyBy: {}
	}

	export type Tag = {
		name: 'Tag'
		unique: { id: number }
		columns: {
			id: number
			name: string
		}
		hasMany: {
			posts: Post
		}
		hasOne: {}
		hasManyBy: {}
	}

}

export const qb = new ContentQueryBuilder({
	entities: {
		Author: {
			name: 'Author',
			fields: {
				id: {
					type: 'column',
				},
				posts: {
					type: 'many',
					entity: 'Post',
				},
				name: {
					type: 'column',
				},
				email: {
					type: 'column',
				},
			},
			scalars: ['name', 'email'],
		},
		Post: {
			name: 'Post',

			fields: {
				id: {
					type: 'column',
				},
				author: {
					type: 'one',
					entity: 'Author',
				},
				tags: {
					type: 'many',
					entity: 'Tag',
				},
				title: {
					type: 'column',
				},
				content: {
					type: 'column',
				},
			},
			scalars: ['title', 'content'],
		},
		Tag: {
			name: 'Tag',
			fields: {
				id: {
					type: 'column',
				},
				posts: {
					type: 'many',
					entity: 'Post',
				},
				name: {
					type: 'column',
				},
			},
			scalars: ['name'],
		},
	},
}) as unknown as TypedContentQueryBuilder<{
	entities: {
		Post: Schema.Post,
		Author: Schema.Author,
		Tag: Schema.Tag,
	},
}>

export const createClient = (result?: any) => {
	const calls: { query: string, variables: Record<string, unknown> }[] = []
	const client = new ContentClient(<T>(query: string, options: any): Promise<T> => {
			calls.push({
				query,
				...options,
			})
			return Promise.resolve(result ?? {})
		},
	)
	return [client, calls] as const
}
