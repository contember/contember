import { expect, test } from 'bun:test'
import { Model } from '@contember/schema'
import { ModelValidator } from '../../../src'
import { c, createSchema } from '@contember/schema-definition'

test('"meta" collision', () => {
	const model: Model.Schema = {
		enums: {},
		entities: {
			Foo: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Foo',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'foo',
				unique: [],
				eventLog: { enabled: true },
				indexes: [],
			},
			FooMeta: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'FooMeta',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'foo_meta',
				unique: [],
				eventLog: { enabled: true },
				indexes: [],
			},
			BarMeta: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'BarMeta',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'bar',
				unique: [],
				eventLog: { enabled: true },
				indexes: [],
			},
		},
	}
	const validator = new ModelValidator(model)
	expect(validator.validate()).toStrictEqual([
		{
			code: 'MODEL_NAME_COLLISION',
			message: 'entity FooMeta collides with entity Foo, because a GraphQL type with "Meta" suffix is created for every entity',
			path: ['entities', 'FooMeta'],
		},
	])
})

namespace ColumnNameCollision {
	export class Bar {
		rel = c.oneHasOne(Bar)
		relId = c.intColumn()
	}
}

test('column name collision', () => {
	const schema = createSchema(ColumnNameCollision)
	const validator = new ModelValidator(schema.model)
	expect(validator.validate()).toStrictEqual([
		{
			code: 'MODEL_NAME_COLLISION',
			message: 'Column name "rel_id" on field "relId" collides with a column name on field "rel".',
			path: ['entities', 'Bar', 'relId'],
		},
	])
})

namespace CoveringIndexKeyOverlap {
	@c.Index({ fields: ['title'], include: ['title'] })
	export class Article {
		title = c.stringColumn()
	}
}

test('covering index include column overlaps key column', () => {
	const schema = createSchema(CoveringIndexKeyOverlap)
	const validator = new ModelValidator(schema.model)
	expect(validator.validate()).toStrictEqual([
		{
			code: 'MODEL_INVALID_INDEX',
			message: 'Field title cannot be both an index key and an included (covering) column',
			path: ['entities', 'Article', 'indexes'],
		},
	])
})

namespace PartialIndexEmptyPredicate {
	@c.Index({ fields: ['title'], where: '   ' })
	export class Article {
		title = c.stringColumn()
	}
}

test('partial index with empty predicate', () => {
	const schema = createSchema(PartialIndexEmptyPredicate)
	const validator = new ModelValidator(schema.model)
	expect(validator.validate()).toStrictEqual([
		{
			code: 'MODEL_INVALID_INDEX',
			message: 'Index predicate (where) must not be empty.',
			path: ['entities', 'Article', 'indexes'],
		},
	])
})

namespace PartialIndexSemicolonPredicate {
	@c.Index({ fields: ['title'], where: 'title IS NOT NULL); DROP TABLE article; --' })
	export class Article {
		title = c.stringColumn()
	}
}

test('partial index predicate with a statement terminator', () => {
	const schema = createSchema(PartialIndexSemicolonPredicate)
	const validator = new ModelValidator(schema.model)
	expect(validator.validate()).toStrictEqual([
		{
			code: 'MODEL_INVALID_INDEX',
			message: 'Index predicate (where) must not contain ";".',
			path: ['entities', 'Article', 'indexes'],
		},
	])
})

namespace ViewRelations {
	@c.View('SELECT 1')
	export class Foo {
		bars = c.oneHasMany(Bar, 'foo')
	}

	@c.View('SELECT 1')
	export class Bar {
		foo = c.manyHasOne(Foo, 'bars')
	}
}

test('view relations', () => {
	const schema = createSchema(ViewRelations)
	const validator = new ModelValidator(schema.model)
	expect(validator.validate()).toStrictEqual([])
})
