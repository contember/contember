import { PredicateFactory, VariableInjector } from '../../../src/acl'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { assert, describe, it } from 'vitest'

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

describe('Predicates factory', () => {
	const schema = def.createModel(TestModel)

	it('eliminates a predicate', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}))
		const image = schema.entities['Image']
		const authorRelation = image.fields['authors'] as Model.OneHasManyRelation
		const predicate = predicateFactory.create(image, Acl.Operation.read, undefined, {
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
})

