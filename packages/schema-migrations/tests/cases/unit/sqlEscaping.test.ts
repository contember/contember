import { describe, expect, test } from 'bun:test'
import { Model } from '@contember/schema'
import { c, createSchema } from '@contember/schema-definition'
import { emptySchema, ModelValidator } from '@contember/schema-utils'
import { Migration, ModificationHandlerFactory, SchemaMigrator, VERSION_LATEST } from '../../../src/index.js'
import { testGenerateSql } from '../../src/tests.js'

// Migration JSON is not typed, so each payload below can reach createSql as is; skippedErrors can waive its model validation.
namespace ArticleSchema {
	export class Article {
		title = c.stringColumn()
	}
}

namespace EnumSchema {
	export const status = c.createEnum('draft', 'published')
	export class Article {
		status = c.enumColumn(status)
	}
}

namespace SequenceSchema {
	export class Article {
		position = c.intColumn().notNull().sequence({ precedence: 'ALWAYS' })
	}
}

namespace NullableIntSchema {
	export class Article {
		position = c.intColumn()
	}
}

namespace ManyHasManySchema {
	export class Post {
		title = c.stringColumn()
	}
	export class Category {
		title = c.stringColumn()
	}
}

const articleSchema = createSchema(ArticleSchema)

const createIndex = (index: Record<string, unknown>): Migration.Modification[] => [{ modification: 'createIndex', entityName: 'Article', index }]

describe('index method and operator class', () => {
	test('an index method with SQL in it is rejected', () => {
		expect(() => testGenerateSql(articleSchema, createIndex({ fields: ['title'], method: 'btree (id); DROP TABLE "article"; --' }), ''))
			.toThrow('Invalid index method "btree (id); DROP TABLE \\"article\\"; --": expected one of btree, hash, gist, spgist, gin, brin')
	})

	test('a unique index method with SQL in it is rejected', () => {
		const diff = [{
			modification: 'createUniqueConstraint',
			entityName: 'Article',
			unique: { fields: ['title'], index: true, method: 'btree (id); DROP TABLE "article"; --' },
		}]
		expect(() => testGenerateSql(articleSchema, diff, '')).toThrow('Invalid index method')
	})

	test('an index operator class with SQL in it is rejected', () => {
		expect(() => testGenerateSql(articleSchema, createIndex({ fields: ['title'], opClass: 'text_ops); DROP TABLE "article"; --' }), ''))
			.toThrow('Invalid index operator class "text_ops); DROP TABLE \\"article\\"; --"')
	})

	test('a per-column operator class with SQL in it is rejected', () => {
		const index = { fields: ['title'], columnOptions: { title: { opClass: 'text_ops); DROP TABLE "article"; --' } } }
		expect(() => testGenerateSql(articleSchema, createIndex(index), '')).toThrow('Invalid index operator class')
	})

	test('a known method and a schema-qualified operator class are emitted as before', () => {
		testGenerateSql(
			articleSchema,
			createIndex({ fields: ['title'], method: 'gin', opClass: 'public.gin_trgm_ops' }),
			'CREATE INDEX ON "article" USING gin ("title" public.gin_trgm_ops);',
		)
	})

	test('the model validator reports an unknown index method', () => {
		const migrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
		const schema = migrator.applyModifications(articleSchema, createIndex({ fields: ['title'], method: 'btree (id); --' }), VERSION_LATEST)
		expect(new ModelValidator(schema.model).validate()).toStrictEqual([
			{
				code: 'MODEL_INVALID_INDEX',
				message: 'Invalid index method "btree (id); --": expected one of btree, hash, gist, spgist, gin, brin',
				path: ['entities', 'Article', 'indexes'],
			},
		])
	})
})

describe('enum names and values', () => {
	const enumSchema = createSchema(EnumSchema)

	test('a double quote in an updated enum name stays inside the identifier', () => {
		const enumName = 's" ADD CONSTRAINT x CHECK (true); DROP TABLE "article"; --'
		const schema = { ...enumSchema, model: { ...enumSchema.model, enums: { [enumName]: ['draft'] } } }
		testGenerateSql(
			schema,
			[{ modification: 'updateEnum', enumName, values: ['draft', 'published'] }],
			'ALTER DOMAIN "s"" ADD CONSTRAINT x CHECK (true); DROP TABLE ""article""; --" '
				+ 'DROP CONSTRAINT "s"" add constraint x check (true); drop table ""article""; --_check"; '
				+ 'ALTER DOMAIN "s"" ADD CONSTRAINT x CHECK (true); DROP TABLE ""article""; --" '
				+ 'ADD CONSTRAINT "s"" add constraint x check (true); drop table ""article""; --_check" CHECK (VALUE IN(\'draft\',\'published\'));',
		)
	})

	test('a quote in an enum value stays inside the literal', () => {
		testGenerateSql(
			enumSchema,
			[{ modification: 'updateEnum', enumName: 'status', values: ['draft', "x'); DROP TABLE article; --"] }],
			'ALTER DOMAIN "status" DROP CONSTRAINT status_check; '
				+ "ALTER DOMAIN \"status\" ADD CONSTRAINT status_check CHECK (VALUE IN('draft','x''); DROP TABLE article; --'));",
		)
	})
})

describe('identifiers', () => {
	test('a double quote in a table name stays inside the identifier', () => {
		const tableName = 'x") ON DELETE CASCADE; DROP TABLE "post"; --'
		testGenerateSql(
			articleSchema,
			[{ modification: 'updateEntityTableName', entityName: 'Article', tableName }],
			'ALTER TABLE "article" RENAME TO "x"") ON DELETE CASCADE; DROP TABLE ""post""; --";',
		)
	})

	test('a double quote in a column name stays inside the identifier', () => {
		const field: Model.AnyColumn = {
			name: 'body',
			columnName: 'b" text; DROP TABLE "article"; --',
			type: Model.ColumnType.String,
			columnType: 'text',
			nullable: true,
		}
		testGenerateSql(
			articleSchema,
			[{ modification: 'createColumn', entityName: 'Article', field }],
			'ALTER TABLE "article" ADD "b"" text; DROP TABLE ""article""; --" text;',
		)
	})

	test('a double quote in a junction target table name stays inside the identifier', () => {
		const schema = createSchema(ManyHasManySchema)
		const category = schema.model.entities.Category
		const payloadSchema = {
			...emptySchema,
			model: {
				...schema.model,
				entities: { ...schema.model.entities, Category: { ...category, tableName: 'c"("id"); DROP TABLE "post"; --' } },
			},
		}
		const owningSide: Model.ManyHasManyOwningRelation = {
			name: 'categories',
			type: Model.RelationType.ManyHasMany,
			target: 'Category',
			joiningTable: {
				tableName: 'post_categories',
				joiningColumn: { columnName: 'post_id', onDelete: Model.OnDelete.cascade },
				inverseJoiningColumn: { columnName: 'category_id', onDelete: Model.OnDelete.cascade },
				eventLog: { enabled: false },
			},
		}
		testGenerateSql(
			payloadSchema,
			[{ modification: 'createRelation', entityName: 'Post', owningSide }],
			'CREATE TABLE "post_categories" ( '
				+ '"post_id" uuid NOT NULL REFERENCES "post"("id") ON DELETE CASCADE, '
				+ '"category_id" uuid NOT NULL REFERENCES "c""(""id""); DROP TABLE ""post""; --"("id") ON DELETE CASCADE ); '
				+ 'ALTER TABLE "post_categories" ADD PRIMARY KEY ("post_id", "category_id");',
		)
	})
})

describe('sequence options', () => {
	const sequenceColumn = (sequence: Record<string, unknown>) => ({
		name: 'position',
		columnName: 'position',
		type: Model.ColumnType.Int,
		columnType: 'integer',
		nullable: false,
		sequence,
	})

	test('a sequence precedence with SQL in it is rejected', () => {
		const field = sequenceColumn({ precedence: 'ALWAYS AS IDENTITY, ADD x int; DROP TABLE "article"; --' })
		expect(() => testGenerateSql(articleSchema, [{ modification: 'createColumn', entityName: 'Article', field }], ''))
			.toThrow('Invalid sequence precedence "ALWAYS AS IDENTITY, ADD x int; DROP TABLE \\"article\\"; --": expected ALWAYS or BY DEFAULT')
	})

	test('a sequence start with SQL in it is rejected', () => {
		const field = sequenceColumn({ precedence: 'ALWAYS', start: '1); DROP TABLE "article"; --' })
		expect(() => testGenerateSql(articleSchema, [{ modification: 'createColumn', entityName: 'Article', field }], ''))
			.toThrow('Invalid sequence option start')
	})

	test('an updated sequence precedence or start with SQL in it is rejected', () => {
		const schema = createSchema(SequenceSchema)
		const update = (sequence: Record<string, unknown>, valueMigrationStrategy?: string): Migration.Modification[] => [
			{
				modification: 'updateColumnDefinition',
				entityName: 'Article',
				fieldName: 'position',
				definition: sequenceColumn(sequence),
				valueMigrationStrategy,
			},
		]
		expect(() => testGenerateSql(schema, update({ precedence: 'BY DEFAULT; DROP TABLE "article"; --' }), '')).toThrow('Invalid sequence precedence')
		expect(() => testGenerateSql(createSchema(NullableIntSchema), update({ precedence: 'ALWAYS', start: '1; DROP TABLE "article"; --' }, 'update'), ''))
			.toThrow('Invalid sequence option start')
	})

	test('the model validator reports an invalid sequence', () => {
		const migrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
		const field = sequenceColumn({ precedence: 'ALWAYS; --', start: 1.5 })
		const schema = migrator.applyModifications(articleSchema, [{ modification: 'createColumn', entityName: 'Article', field }], VERSION_LATEST)
		expect(new ModelValidator(schema.model).validate()).toStrictEqual([
			{
				code: 'MODEL_INVALID_COLUMN_DEFINITION',
				message: 'Invalid sequence precedence "ALWAYS; --": expected ALWAYS or BY DEFAULT',
				path: ['entities', 'Article', 'position'],
			},
			{
				code: 'MODEL_INVALID_COLUMN_DEFINITION',
				message: 'Invalid sequence start "1.5": expected an integer',
				path: ['entities', 'Article', 'position'],
			},
		])
	})
})
