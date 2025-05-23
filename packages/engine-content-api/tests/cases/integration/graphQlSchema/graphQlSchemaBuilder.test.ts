import { graphql, printSchema } from 'graphql'
import { Acl, Model } from '@contember/schema'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {
	AllowAllPermissionFactory,
	SchemaBuilder,
	SchemaDefinition,
	c,
	createSchema,
	SchemaDefinition as def,
} from '@contember/schema-definition'
import { Authorizator, GraphQlSchemaBuilderFactory, PermissionFactory } from '../../../../src'
import * as model from './model'
import { expect, describe, it } from 'bun:test'
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
	const authorizator = new Authorizator(permissions, false, false)
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
	expect(errors).toStrictEqual([])

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
		expect(textSchema).toStrictEqual(expectedSchema)
	}
}
describe('GraphQL schema builder', () => {
	it('column types', async () => {
		await testSchema({
			schema: () => createSchema({
				Columns: class Columns {
					string = c.stringColumn()
					int = c.intColumn()
					float = c.doubleColumn()
					boolean = c.boolColumn()
					date = c.dateColumn()
					dateTime = c.dateTimeColumn()
					json = c.jsonColumn()
					uuid = c.uuidColumn()
					time = c.timeColumn()
					enum = c.enumColumn(c.createEnum('a', 'b', 'c'))
				},
			}).model,
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-column-types.gql',
		})
	})

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
		expect((relation as Model.OneHasManyRelation).orderBy).toStrictEqual([
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

	it('no root ops', async () => {
		const schema = createSchema(NoRootOperation)

		await testSchema({
			schema: () => schema.model,
			permissions: () => {
				const factory = new PermissionFactory()
				return factory.create(schema, ['editor'])
			},
			graphQlSchemaFile: 'schema-no-root-ops.gql',
		})
	})


	it('array', async () => {
		const schema = createSchema({
			Foo: class Foo {
				stringArrayValue = c.stringColumn().list()
				enumArrayValue = c.enumColumn(c.createEnum('a', 'b', 'c')).list()
				intArrayValue = c.intColumn().list()
			},
		})

		await testSchema({
			schema: () => schema.model,
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema-array.gql',
		})
	})
})

namespace ViewEntity {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}

namespace NoRootOperation {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, {
		read: true,
		create: true,
		delete: true,
		update: true,
	})
	export class Article {
		title = c.stringColumn()
		coverImage = c.oneHasOne(Image)
	}

	@c.Allow(editorRole, {
		through: true,
		read: true,
		create: true,
		delete: true,
		update: true,
	})
	export class Image {
		url = c.stringColumn()
	}
}
