import { graphql, printIntrospectionSchema, printSchema } from 'graphql'
import { Acl, Model } from '@contember/schema'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {
	AllowAllPermissionFactory,
	SchemaBuilder,
	SchemaDefinition,
	SchemaDefinition as def,
} from '@contember/schema-definition'
import { Authorizator, GraphQlSchemaBuilderFactory } from '../../../../src'
import * as model from './model'
import { assert, describe, it } from 'vitest'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Test {
	schema: (builder: SchemaBuilder) => SchemaBuilder | Model.Schema
	permissions: (schema: Model.Schema) => Acl.Permissions
	graphQlSchemaFile: string
}

const testSchema = async (test: Test) => {
	const schemaResult = test.schema(new SchemaBuilder())

	const schemaFactory = new GraphQlSchemaBuilderFactory()
	const schema = schemaResult instanceof SchemaBuilder ? schemaResult.buildSchema() : schemaResult
	const schemaWithAcl = { ...schema, acl: { roles: {}, variables: {} } }
	const permissions = test.permissions(schemaWithAcl)
	const authorizator = new Authorizator(permissions, false)
	const graphQlSchemaBuilder = schemaFactory.create(schemaWithAcl, authorizator)
	const graphQlSchema = graphQlSchemaBuilder.build()

	const result = await graphql({
		schema: graphQlSchema,
		source: `
			{
				_info {
					description
				}
			}
		`,
	})
	const errors = (result.errors || []).map(it => it.message)
	assert.deepEqual(errors, [])

	const textSchema = printSchema(graphQlSchema) + '\n'

	const filename = path.join(dirname(fileURLToPath(import.meta.url)), test.graphQlSchemaFile)
	let expectedSchema: string
	try {
		expectedSchema = await fs.readFile(filename, { encoding: 'utf8' })
	} catch (e) {
		await fs.writeFile(filename, textSchema, { encoding: 'utf8' })
		throw new Error(`Schema file ${filename} not found, creating with current schema`)
	}
	if (expectedSchema) {
		assert.deepEqual(textSchema, expectedSchema)
	}
}
describe('GraphQL schema builder', () => {


	it('basic schema', async () => {
		await testSchema({
			schema: builder =>
				builder
					.entity('Author', e =>
						e
							.column('name', c => c.type(Model.ColumnType.String))
							.oneHasMany('posts', r => r.target('Post').ownedBy('author')),
					)
					.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.entity('Post', e =>
						e
							.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
							.oneHasMany('locales', r =>
								r.target('PostLocale', e => e.column('title', c => c.type(Model.ColumnType.String))),
							)
							.manyHasMany('categories', r => r.target('Category').inversedBy('posts')),
					),
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-basic.gql',
		})
	})

	it('restricted access to fields by permissions', async () => {
		await testSchema({
			schema: builder =>
				builder.entity('Test', e =>
					e
						.column('a', c => c.type(Model.ColumnType.String))
						.column('b', c => c.type(Model.ColumnType.String))
						.column('c', c => c.type(Model.ColumnType.String)),
				),
			permissions: () => ({
				Test: {
					predicates: {},
					operations: {
						create: {
							id: true,
							a: true,
						},
						update: {
							id: true,
							b: true,
						},
						read: {
							id: true,
							c: true,
						},
					},
				},
			}),
			graphQlSchemaFile: 'schema-acl.gql',
		})
	})

	it('read only', async () => {
		await testSchema({
			schema: builder =>
				builder.entity('Test', e =>
					e
						.column('a', c => c.type(Model.ColumnType.String))
						.column('b', c => c.type(Model.ColumnType.String)),
				),
			permissions: () => ({
				Test: {
					predicates: {},
					operations: {
						read: {
							id: true,
							a: true,
							b: true,
						},
					},
				},
			}),
			graphQlSchemaFile: 'schema-read-only.gql',
		})
	})


	it('conditionally restricted read of some fields', async () => {
		await testSchema({
			schema: builder =>
				builder.entity('Test', e =>
					e
						.column('a', c => c.type(Model.ColumnType.String).notNull()),
				),
			permissions: () => ({
				Test: {
					predicates: {
						testPredicate: {
							a: { eq: 'Foo' },
						},
					},
					operations: {
						read: {
							id: true,
							a: 'testPredicate',
						},
					},
				},
			}),
			graphQlSchemaFile: 'schema-acl-predicate.gql',
		})
	})


	it('conditionally restricted read of whole row', async () => {
		await testSchema({
			schema: builder =>
				builder.entity('Test', e =>
					e
						.column('a', c => c.type(Model.ColumnType.String).notNull()),
				),
			permissions: () => ({
				Test: {
					predicates: {
						testPredicate: {
							a: { eq: 'Foo' },
						},
					},
					operations: {
						read: {
							id: 'testPredicate',
							a: 'testPredicate',
						},
					},
				},
			}),
			graphQlSchemaFile: 'schema-acl-predicate2.gql',
		})
	})

	const oneHasManySchema = (builder: SchemaBuilder) =>
		builder.entity('Root', e =>
			e
				.column('foo', c => c.type(Model.ColumnType.String))
				.oneHasMany('r', r =>
					r.target('OneHasManyEntity', e => e.column('a', c => c.type(Model.ColumnType.String))).ownedBy('r2'),
				),
		)

	it('ACL with relations - everything allowed', async () => {
		await testSchema({
			schema: oneHasManySchema,
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-acl-allowed.gql',
		})
	})

	it('ACL with relations - restricted delete', async () => {
		await testSchema({
			schema: oneHasManySchema,
			permissions: () => ({
				Root: {
					predicates: {},
					operations: {
						create: { id: true },
						update: { id: true },
						read: { id: true },
						delete: true,
					},
				},
				OneHasManyEntity: {
					predicates: {},
					operations: {
						create: { id: true, a: true, r2: true },
						update: { id: true, a: true, r2: true },
						read: { id: true, a: true },
					},
				},
			}),
			graphQlSchemaFile: 'schema-acl-restricted-delete.gql',
		})
	})

	it('ACL with relations - restricted update', async () => {
		await testSchema({
			schema: oneHasManySchema,
			permissions: () => ({
				Root: {
					predicates: {},
					operations: {
						create: { id: true, r: true },
						update: { id: true, r: true },
						read: { id: true, r: true },
						delete: true,
					},
				},
				OneHasManyEntity: {
					predicates: {},
					operations: {
						create: { id: true, a: true, r2: true },
						read: { id: true, a: true },
						delete: true,
					},
				},
			}),
			graphQlSchemaFile: 'schema-acl-restricted-update.gql',
		})
	})

	it('ACL with relations - restricted create', async () => {
		await testSchema({
			schema: oneHasManySchema,
			permissions: () => ({
				Root: {
					predicates: {},
					operations: {
						update: { id: true, r: true },
						read: { id: true, r: true },
						delete: true,
					},
				},
				OneHasManyEntity: {
					predicates: {},
					operations: {
						update: { id: true, a: true, r2: true },
						read: { id: true, a: true },
						delete: true,
					},
				},
			}),
			graphQlSchemaFile: 'schema-acl-restricted-create.gql',
		})
	})

	it('has many relation reduction', async () => {
		await testSchema({
			schema: builder =>
				builder.entity('Post', e =>
					e
						.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
						.oneHasMany('locales', r =>
							r.ownedBy('post').target('PostLocale', e =>
								e
									.unique(['locale', 'post'])
									.column('locale', c => c.type(Model.ColumnType.String))
									.column('title', c => c.type(Model.ColumnType.String)),
							),
						),
				),
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-has-many-reduction.gql',
		})
	})

	it('bug with multiple relations 66', async () => {
		await testSchema({
			schema: builder =>
				builder
					.enum('one', ['one'])
					.entity('Video', entity => entity.column('vimeoId'))
					.entity('FrontPage', entity =>
						entity
							.column('unique', column => column.type(Model.ColumnType.Enum, { enumName: 'one' }).unique().notNull())
							.oneHasOne('introVideo', relation => relation.target('Video').notNull().inversedBy('frontPageForIntro'))
							.oneHasMany('inHouseVideos', relation => relation.target('Video').ownedBy('frontPage')),
					),
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-bug-66.gql',
		})
	})

	it('basic schema with new builder', async () => {
		const schema1 = SchemaDefinition.createModel(model)
		const relation = schema1.entities['Author'].fields['posts']
		assert.deepEqual((relation as Model.OneHasManyRelation).orderBy, [
			{ path: ['publishedAt'], direction: Model.OrderDirection.desc },
		])
		await testSchema({
			schema: () => schema1,
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-new-builder.gql',
		})
	})

	it('allow only create', async () => {
		const schema = SchemaDefinition.createModel(model)
		await testSchema({
			schema: () => schema,
			permissions: schema => new AllowAllPermissionFactory([Acl.Operation.create]).create(schema),
			graphQlSchemaFile: 'schema-acl-create-only.gql',
		})
	})

	it('custom primary allowed', async () => {
		await testSchema({
			schema: builder =>
				builder
					.entity('Author', e =>
						e
							.column('name', c => c.type(Model.ColumnType.String))
							.oneHasMany('posts', r => r.target('Post').ownedBy('author')),
					)
					.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.entity('Post', e =>
						e
							.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
							.oneHasMany('locales', r =>
								r.target('PostLocale', e => e.column('title', c => c.type(Model.ColumnType.String))),
							)
							.manyHasMany('categories', r => r.target('Category').inversedBy('posts')),
					),
			permissions: schema => new AllowAllPermissionFactory().create(schema, true),
			graphQlSchemaFile: 'schema-custom-primary.gql',
		})
	})

	it('aliased type', async () => {
		await testSchema({
			schema: builder =>
				builder.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String).typeAlias('AuthorName'))),
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-aliased-type.gql',
		})
	})


	it('view entity', async () => {
		await testSchema({
			schema: () => SchemaDefinition.createModel(ViewEntity),
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-view-entity.gql',
		})
	})

	it('descriptions', async () => {
		await testSchema({
			schema: () => SchemaDefinition.createModel(ModelWithDescriptions),
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-description.gql',
		})
	})
})

namespace ViewEntity {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}

namespace ModelWithDescriptions {
	@def.Description('description of entity Article')
	export class Article {
		title = def.stringColumn().description('description of Article.title')
		category = def.manyHasOne(Category, 'articles').description('description of Article.category')
		tags = def.manyHasMany(Tag, 'articles').description('description of Article.tags')
		stats = def.oneHasOne(ArticleStats, 'article').description('description of Article.stats')
	}

	@def.Description('description of entity ArticleStats')
	export class ArticleStats {
		article = def.manyHasManyInverse(Article, 'stats').description('description of ArticleStats.article')
	}

	@def.Description('description of entity Category')
	export class Category {
		name = def.stringColumn().description('description of Category.name')
		articles = def.oneHasMany(Article, 'category').description('description of Category.articles')
	}

	@def.Description('description of entity Tag')
	export class Tag {
		name = def.stringColumn().description('description of Tag.name')
		articles = def.manyHasManyInverse(Article, 'tags').description('description of Tag.articles')
	}
}
