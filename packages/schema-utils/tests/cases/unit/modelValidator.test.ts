import { expect, test } from 'bun:test'
import { Model } from '@contember/schema'
import { ModelValidator } from '../../../src/index.js'
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

namespace SupportedJsonSchema {
	export class Foo {
		data = c.jsonColumn().schema({
			type: 'object',
			title: 'Some data',
			description: 'annotation keywords are allowed',
			properties: {
				name: { type: 'string', minLength: 1 },
				tags: { type: 'array', items: { type: 'string' }, uniqueItems: true },
			},
			required: ['name'],
			additionalProperties: false,
		})
	}
}

test('json schema with supported keywords passes', () => {
	const schema = createSchema(SupportedJsonSchema)
	const validator = new ModelValidator(schema.model)
	expect(validator.validate()).toStrictEqual([])
})

namespace UnsupportedJsonSchemaKeyword {
	export class Foo {
		data = c.jsonColumn().schema({
			type: 'string',
			format: 'email',
		})
	}
}

test('json schema with an unsupported keyword fails', () => {
	const schema = createSchema(UnsupportedJsonSchemaKeyword)
	const validator = new ModelValidator(schema.model)
	const errors = validator.validate()
	expect(errors).toHaveLength(1)
	expect(errors[0].code).toBe('MODEL_INVALID_JSON_SCHEMA')
	expect(errors[0].path).toStrictEqual(['entities', 'Foo', 'data'])
	expect(errors[0].message).toContain('unsupported keyword "format"')
	expect(errors[0].message).toContain('at the schema root')
})

namespace UnsupportedJsonSchemaKeywordNested {
	export class Foo {
		data = c.jsonColumn().schema({
			type: 'object',
			properties: {
				ref: { $ref: '#/definitions/Bar' },
			},
		})
	}
}

test('json schema reports unsupported keyword nested in properties with a path', () => {
	const schema = createSchema(UnsupportedJsonSchemaKeywordNested)
	const validator = new ModelValidator(schema.model)
	const errors = validator.validate()
	expect(errors).toHaveLength(1)
	expect(errors[0].code).toBe('MODEL_INVALID_JSON_SCHEMA')
	expect(errors[0].message).toContain('unsupported keyword "$ref"')
	expect(errors[0].message).toContain('at "/properties/ref"')
})

namespace UnsupportedJsonSchemaKeywordInCombinator {
	export class Foo {
		data = c.jsonColumn().schema({
			anyOf: [
				{ type: 'string' },
				{ type: 'object', patternProperties: { '^x': { type: 'number' } } },
			],
		})
	}
}

test('json schema reports unsupported keyword inside a combinator', () => {
	const schema = createSchema(UnsupportedJsonSchemaKeywordInCombinator)
	const validator = new ModelValidator(schema.model)
	const errors = validator.validate()
	expect(errors).toHaveLength(1)
	expect(errors[0].code).toBe('MODEL_INVALID_JSON_SCHEMA')
	expect(errors[0].message).toContain('unsupported keyword "patternProperties"')
	expect(errors[0].message).toContain('at "/anyOf/1"')
})
