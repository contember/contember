import { expect, test } from 'bun:test'
import { c, createSchema, settingsPresets } from '../../../src/index.js'

namespace SimpleModel {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, { read: true })
	export class Book {
		@c.Required('test')
		title = c.stringColumn()
	}
}

test('basic createSchema test', () => {
	const schema = createSchema(SimpleModel, schema => ({
		...schema,
		settings: settingsPresets['v1.3'],
	}))

	expect(schema as any).toStrictEqual({
		'acl': {
			'roles': {
				'public': {
					'entities': {
						'Book': {
							'operations': {
								'read': {
									'title': true,
								},
							},
							'predicates': {},
						},
					},
					'stages': '*',
					'variables': {},
				},
			},
		},
		'actions': {
			'targets': {},
			'triggers': {},
		},
		'model': {
			'entities': {
				'Book': {
					'eventLog': {
						'enabled': true,
					},
					'fields': {
						'id': {
							'columnName': 'id',
							'columnType': 'uuid',
							'name': 'id',
							'nullable': false,
							'type': 'Uuid',
						},
						'title': {
							'columnName': 'title',
							'columnType': 'text',
							'name': 'title',
							'nullable': true,
							'type': 'String',
						},
					},
					'indexes': [],
					'name': 'Book',
					'primary': 'id',
					'primaryColumn': 'id',
					'tableName': 'book',
					'unique': [],
				},
			},
			'enums': {},
		},
		'settings': {
			'tenant': {
				'inviteExpirationMinutes': 10080,
			},
			'useExistsInHasManyFilter': true,
		},
		'validation': {
			'Book': {
				'title': [
					{
						'message': {
							'text': 'test',
						},
						'validator': {
							'args': [],
							'operation': 'defined',
						},
					},
				],
			},
		},
	})
})

namespace IndexModel {
	@c.Index('title')
	@c.Index({ fields: ['title'], where: 'title IS NOT NULL' })
	@c.Index({ fields: ['title'], include: ['content'] })
	@c.Index({ fields: ['title'], include: ['content'], where: 'published', method: 'btree' })
	export class Article {
		title = c.stringColumn()
		content = c.stringColumn()
	}
}

test('index DSL with where and include', () => {
	const schema = createSchema(IndexModel)
	const indexes = schema.model.entities.Article.indexes
	expect(indexes).toHaveLength(4)
	expect(indexes).toEqual(expect.arrayContaining([
		{ fields: ['title'] },
		{ fields: ['title'], where: 'title IS NOT NULL' },
		{ fields: ['title'], include: ['content'] },
		{ fields: ['title'], include: ['content'], where: 'published', method: 'btree' },
	]))
})

namespace IndexColumnOptionsModel {
	@c.Index({ fields: ['title', { field: 'rank', order: 'desc', nulls: 'last' }] })
	@c.Index({ fields: [{ field: 'title', opClass: 'text_pattern_ops' }] })
	export class Article {
		title = c.stringColumn()
		rank = c.intColumn()
	}
}

test('index DSL with per-column options normalizes to fields + columnOptions', () => {
	const schema = createSchema(IndexColumnOptionsModel)
	const indexes = schema.model.entities.Article.indexes
	expect(indexes).toHaveLength(2)
	expect(indexes).toEqual(expect.arrayContaining([
		{ fields: ['title', 'rank'], columnOptions: { rank: { order: 'desc', nulls: 'last' } } },
		{ fields: ['title'], columnOptions: { title: { opClass: 'text_pattern_ops' } } },
	]))
})

namespace StrictModel {
	export class Genre {
		name = c.stringColumn()
	}
	export class Book {
		title = c.stringColumn()
		genre = c.manyHasOne(Genre)
	}
}

test('strict test', () => {
	const cb = () =>
		createSchema(StrictModel, schema => ({
			...schema,
			settings: settingsPresets['v1.3'],
		}), { strict: true })

	expect(cb).toThrow(`Strict schema validation failed:
- Book.genre: inverse side of the relation is not defined.
- Book.genre: onDelete behaviour is not set. Use one of cascadeOnDelete(), setNullOnDelete() or restrictOnDelete().`)
})

namespace StrictViewModel {
	export class Author {
		name = c.stringColumn()
		stats = c.oneHasOneInverse(AuthorStats, 'author')
	}

	@c.View('SELECT 1')
	export class AuthorStats {
		author = c.oneHasOne(Author, 'stats')
		postCount = c.intColumn().notNull()
	}
}

test('strict test: onDelete is not required on a view entity relation', () => {
	const cb = () =>
		createSchema(StrictViewModel, schema => ({
			...schema,
			settings: settingsPresets['v1.3'],
		}), { strict: true })

	// AuthorStats.author has an inverse side defined and is a view relation, so neither the
	// inverse-side nor the onDelete strict checks should fire.
	expect(cb).not.toThrow()
})

namespace StrictViewWithOnDeleteModel {
	export class Author {
		name = c.stringColumn()
		stats = c.oneHasOneInverse(AuthorStats, 'author')
	}

	@c.View('SELECT 1')
	export class AuthorStats {
		author = c.oneHasOne(Author, 'stats').cascadeOnDelete()
		postCount = c.intColumn().notNull()
	}
}

test('strict test: onDelete must not be set on a view entity relation', () => {
	const cb = () =>
		createSchema(StrictViewWithOnDeleteModel, schema => ({
			...schema,
			settings: settingsPresets['v1.3'],
		}), { strict: true })

	expect(cb).toThrow(`Strict schema validation failed:
- AuthorStats.author: onDelete behaviour must not be set on a relation of a view entity. Views are read-only and have no delete semantics.`)
})
