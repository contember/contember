import {
	createPredicateContextForEvaluatedRelationPath,
	PermissionFactory,
	PredicateFactory,
	rootPredicateContext,
	throughPredicateContext,
	VariableInjector,
} from '../../../src/acl/index.js'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
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

namespace PermissionScopeWitnessModel {
	export const editor = acl.createRole('editor')

	@acl.allow(editor, { read: ['label', 'canManageChildren'], update: true })
	@acl.allow(editor, { when: { canManageChildren: { eq: true } }, read: ['children'] })
	export class Parent {
		label = def.stringColumn()
		canManageChildren = def.boolColumn()
		children = def.oneHasMany(Child, 'parent')
	}

	@acl.allow(editor, {
		when: { parent: acl.canRead('children') },
		read: true,
		create: true,
		update: true,
		delete: true,
		through: true,
	})
	export class Child {
		label = def.stringColumn()
		parent = def.manyHasOne(Parent, 'children')
	}
}

describe('Predicates factory', () => {
	const schema = def.createModel(TestModel)

	it('eliminates a predicate', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}))
		const image = schema.entities['Image']
		const relationContext = acceptFieldVisitor(schema, schema.entities.Author, 'image', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: context => context,
		})
		const predicate = predicateFactory.create(
			image,
			Acl.Operation.read,
			undefined,
			createPredicateContextForEvaluatedRelationPath([relationContext]),
		)
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

	it('uses root permissions when isRoot is true', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}), throughPermissions)
		const author = schema.entities['Author']
		const predicate = predicateFactory.create(author, Acl.Operation.read, ['name'], rootPredicateContext)
		assert.deepStrictEqual(predicate, {
			isPublic: { eq: true },
		})
	})

	it('uses root permissions by default', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}), throughPermissions)
		const author = schema.entities['Author']
		const predicate = predicateFactory.create(author, Acl.Operation.read, ['name'])
		assert.deepStrictEqual(predicate, {
			isPublic: { eq: true },
		})
	})

	it('uses allPermissions in the through scope', () => {
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
		const predicate = predicateFactory.create(author, Acl.Operation.read, ['name'], throughPredicateContext)
		assert.deepStrictEqual(predicate, {
			name: { eq: 'all' },
		})
	})

	it('normalizes legacy boolean field and predicate APIs', () => {
		const allPerms: Acl.Permissions = {
			...permissions,
			Author: {
				predicates: {
					throughRow: { name: { eq: 'row' } },
					throughCell: { name: { eq: 'cell' } },
				},
				operations: {
					read: {
						id: 'throughRow',
						name: 'throughCell',
						image: 'throughRow',
					},
				},
			},
		}
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}), allPerms)
		const author = schema.entities.Author

		assert.deepStrictEqual(predicateFactory.getFieldPredicate(author, Acl.Operation.read, 'name', true).predicate, 'authorPredicate')
		assert.deepStrictEqual(predicateFactory.getFieldPredicate(author, Acl.Operation.read, 'name', false).predicate, 'throughCell')
		assert.deepStrictEqual(predicateFactory.shouldApplyCellLevelPredicate(author, Acl.Operation.read, 'name', true), false)
		assert.deepStrictEqual(predicateFactory.shouldApplyCellLevelPredicate(author, Acl.Operation.read, 'name', false), true)
		assert.deepStrictEqual(predicateFactory.create(author, Acl.Operation.read, ['name'], undefined, false), { name: { eq: 'cell' } })
	})

	it('falls back to root permissions when allPermissions is not provided', () => {
		const predicateFactory = new PredicateFactory(permissions, schema, new VariableInjector(schema, {}))
		const author = schema.entities['Author']
		const predicate = predicateFactory.create(author, Acl.Operation.read, ['name'], throughPredicateContext)
		assert.deepStrictEqual(predicate, {
			isPublic: { eq: true },
		})
	})

	it('keeps conditional parent predicates without an evaluated relation witness', () => {
		const schema = createSchema(PermissionScopeWitnessModel)
		const contextual = new PermissionFactory().createContextual(schema, ['editor'])
		const witnessSchema = schema.model
		const predicateFactory = new PredicateFactory(
			contextual.root,
			witnessSchema,
			new VariableInjector(witnessSchema, {}),
			contextual.all,
		)
		const parent = witnessSchema.entities.Parent
		const child = witnessSchema.entities.Child
		const childrenContext = acceptFieldVisitor(witnessSchema, parent, 'children', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: context => context,
		})
		const expected = { parent: { canManageChildren: { eq: true } } }

		assert.deepStrictEqual(predicateFactory.create(child, Acl.Operation.read, undefined, throughPredicateContext), expected)
		assert.deepStrictEqual(predicateFactory.create(child, Acl.Operation.create, ['label'], throughPredicateContext), expected)
		assert.deepStrictEqual(predicateFactory.create(child, Acl.Operation.update, ['label'], throughPredicateContext), expected)
		assert.deepStrictEqual(predicateFactory.createDeletePredicate(child, throughPredicateContext), expected)

		assert.deepStrictEqual(
			predicateFactory.create(
				child,
				Acl.Operation.create,
				['label'],
				createPredicateContextForEvaluatedRelationPath([childrenContext]),
			),
			{ parent: { id: { always: true } } },
		)
		assert.deepStrictEqual(predicateFactory.create(child, Acl.Operation.create, ['label'], undefined, false), expected)
		assert.deepStrictEqual(predicateFactory.createDeletePredicate(child, undefined, false), expected)
		assert.deepStrictEqual(
			predicateFactory.create(child, Acl.Operation.create, ['label'], childrenContext, false),
			{ parent: { id: { always: true } } },
		)
	})

	it('preserves legacy relation context overloads', () => {
		const variableInjector = new VariableInjector(schema, {})
		const predicateFactory = new PredicateFactory(permissions, schema, variableInjector)
		const image = schema.entities.Image
		const relationContext = acceptFieldVisitor(schema, schema.entities.Author, 'image', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: context => context,
		})
		const expected = {
			or: [
				{ authors: { id: { always: true } } },
				{ articles: { isPublic: { eq: true } } },
			],
		}

		assert.deepStrictEqual(predicateFactory.create(image, Acl.Operation.read, undefined, relationContext, true), expected)
		assert.deepStrictEqual(predicateFactory.buildPredicates(image, ['imagePredicate'], relationContext, true), expected)
		assert.deepStrictEqual(
			predicateFactory.optimizePredicates(variableInjector.inject(image, permissions.Image.predicates.imagePredicate), relationContext, true),
			expected,
		)
	})
})
