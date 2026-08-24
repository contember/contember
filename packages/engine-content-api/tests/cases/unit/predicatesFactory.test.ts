import { PredicateFactory, VariableInjector } from '../../../src/acl/index.js'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { describe, it } from 'bun:test'
import { assert } from '../../src/assert.js'

namespace TestModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'authors')
	}

	export class Article {
		title = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'articles')
	}

	export class Image {
		url = def.stringColumn().notNull()

		articles = def.oneHasMany(Article, 'image')
		authors = def.oneHasMany(Author, 'image')
	}
}
const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				isPublic: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'authorPredicate',
				name: 'authorPredicate',
				image: 'authorPredicate',
			},
		},
	},
	Article: {
		predicates: {
			articlePredicate: {
				isPublic: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'articlePredicate',
				title: 'articlePredicate',
				image: 'articlePredicate',
			},
		},
	},
	Image: {
		predicates: {
			imagePredicate: {
				or: [
					{ authors: { isPublic: { eq: true } } },
					{ articles: { isPublic: { eq: true } } },
				],
			},
		},
		operations: {
			read: {
				id: 'imagePredicate',
				url: 'imagePredicate',
			},
		},
	},
}

const throughPermissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				isPublic: { eq: true },
			},
			throughPredicate: {
				name: { eq: 'through' },
			},
		},
		operations: {
			read: {
				id: '__merge__authorPredicate__throughPredicate',
				name: '__merge__authorPredicate__throughPredicate',
				image: '__merge__authorPredicate__throughPredicate',
			},
		},
	},
	Article: permissions.Article,
	Image: permissions.Image,
}

describe('Predicates factory', () => {
	const schema = def.createModel(TestModel)

	it('eliminates a predicate', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}))
		const image = schema.entities['Image']
		const authorRelation = image.fields['authors'] as Model.OneHasManyRelation
		const predicate = predicateFactory.create(image, Acl.Operation.read, 'root', undefined, {
			type: 'manyHasOne',
			entity: schema.entities.Author,
			relation: schema.entities.Author.fields.image as Model.ManyHasOneRelation,
			targetEntity: image,
			targetRelation: authorRelation,
		})
		assert.deepStrictEqual(predicate, {
			or: [
				{
					authors: {
						id: { always: true },
					},
				},
				{
					articles: {
						isPublic: { eq: true },
					},
				},
			],
		})
	})

	it('uses root permissions in the root scope', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}), throughPermissions)
		const author = schema.entities['Author']
		const predicate = predicateFactory.create(author, Acl.Operation.read, 'root', ['name'])
		assert.deepStrictEqual(predicate, {
			isPublic: { eq: true },
		})
	})

	it('uses the nested permission set in the nested scope', () => {
		const allPerms: Acl.Permissions = {
			...permissions,
			Author: {
				predicates: {
					allPredicate: {
						name: { eq: 'all' },
					},
				},
				operations: {
					read: {
						id: 'allPredicate',
						name: 'allPredicate',
						image: 'allPredicate',
					},
				},
			},
		}
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}), allPerms)
		const author = schema.entities['Author']
		const predicate = predicateFactory.create(author, Acl.Operation.read, 'nested', ['name'])
		assert.deepStrictEqual(predicate, {
			name: { eq: 'all' },
		})
	})

	it('falls back to root permissions in the nested scope when no nested set is provided', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}))
		const author = schema.entities['Author']
		const predicate = predicateFactory.create(author, Acl.Operation.read, 'nested', ['name'])
		assert.deepStrictEqual(predicate, {
			isPublic: { eq: true },
		})
	})
})
