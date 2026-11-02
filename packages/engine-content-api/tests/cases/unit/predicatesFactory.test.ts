import { PredicateFactory, VariableInjector } from '../../../src/acl/index.js'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { describe, expect, it } from 'bun:test'
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

namespace ShadowedMarkerModel {
	export class Author {
		isPublic = def.boolColumn().notNull()
	}

	export class Article {
		isPublic = def.boolColumn().notNull()
		_new = def.manyHasOne(Author)
	}
}

describe('Predicates factory with a field named like a state marker', () => {
	const schema = def.createModel(ShadowedMarkerModel)
	const shadowedPermissions: Acl.Permissions = {
		Article: {
			predicates: { viaAuthor: { _new: { isPublic: { eq: true } } } },
			operations: { read: { id: 'viaAuthor' }, update: { id: 'viaAuthor' } },
		},
	}
	const predicateFactory = new PredicateFactory(shadowedPermissions, schema, new VariableInjector(schema, {}))

	it('refuses to read the field as a marker', () => {
		expect(() => predicateFactory.create(schema.entities.Article, Acl.Operation.read, 'root')).toThrow('field "_new" collides with an ACL state marker')
		expect(() => predicateFactory.createUpdateStatePredicate(schema.entities.Article, 'root', ['id'])).toThrow(
			'field "_new" collides with an ACL state marker',
		)
	})
})

describe('Predicates factory with a marker that cannot be resolved', () => {
	const schema = def.createModel(TestModel)
	const markerUnderRelation = (value: unknown): Acl.Permissions => ({
		Article: {
			predicates: { viaImage: JSON.parse(JSON.stringify({ image: { _old: value } })) },
			operations: { read: { id: 'viaImage' }, update: { id: 'viaImage' } },
		},
	})

	it('refuses a marker under a relation instead of dropping it', () => {
		for (const value of [null, { url: { eq: 'x' } }]) {
			const predicateFactory = new PredicateFactory(markerUnderRelation(value), schema, new VariableInjector(schema, {}))
			expect(() => predicateFactory.create(schema.entities.Article, Acl.Operation.read, 'root')).toThrow('unresolvable "_old" marker at "image._old"')
			expect(() => predicateFactory.createUpdateStatePredicate(schema.entities.Article, 'root', ['id'])).toThrow('unresolvable "_old" marker')
		}
	})
})
