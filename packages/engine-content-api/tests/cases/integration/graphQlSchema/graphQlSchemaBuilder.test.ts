import { graphql, printSchema } from 'graphql'
import { Acl, Model } from '@contember/schema'
import * as path from 'path'

import { AllowAllPermissionFactory, SchemaBuilder, SchemaDefinition } from '@contember/schema-definition'
import { GraphQlSchemaBuilderFactory, StaticAuthorizator } from '../../../../src'
import * as model from './model'
import { promises as fs } from 'fs'
import * as assert from 'uvu/assert'
import { suite } from 'uvu'
import { SchemaDefinition as def } from '@contember/schema-definition'

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
	const authorizator = new StaticAuthorizator(permissions)
	const graphQlSchemaBuilder = schemaFactory.create(schemaWithAcl, authorizator)
	const graphQlSchema = graphQlSchemaBuilder.build()

	const result = await graphql(
		graphQlSchema,
		`
			{
				_info {
					description
				}
			}
		`,
	)
	const errors = (result.errors || []).map(it => it.message)
	assert.equal(errors, [])

	const textSchema = printSchema(graphQlSchema)

	const filename = path.join(__dirname, test.graphQlSchemaFile)
	let expectedSchema: string
	try {
		expectedSchema = await fs.readFile(filename, { encoding: 'utf8' })
	} catch (e) {
		await fs.writeFile(filename, textSchema, { encoding: 'utf8' })
		throw new Error(`Schema file ${filename} not found, creating with current schema`)
	}
	if (expectedSchema) {
		assert.equal(textSchema, expectedSchema)
	}
}
const graphqlSchemaBuilderTest = suite('GraphQL schema builder')

graphqlSchemaBuilderTest('basic schema', async () => {
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

graphqlSchemaBuilderTest('restricted access to fields by permissions', async () => {
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
const oneHasManySchema = (builder: SchemaBuilder) =>
	builder.entity('Root', e =>
		e
			.column('foo', c => c.type(Model.ColumnType.String))
			.oneHasMany('r', r =>
				r.target('OneHasManyEntity', e => e.column('a', c => c.type(Model.ColumnType.String))).ownedBy('r2'),
			),
	)

graphqlSchemaBuilderTest('ACL with relations - everything allowed', async () => {
	await testSchema({
		schema: oneHasManySchema,
		permissions: schema => new AllowAllPermissionFactory().create(schema),
		graphQlSchemaFile: 'schema-acl-allowed.gql',
	})
})

graphqlSchemaBuilderTest('ACL with relations - restricted delete', async () => {
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

graphqlSchemaBuilderTest('ACL with relations - restricted update', async () => {
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

graphqlSchemaBuilderTest('ACL with relations - restricted create', async () => {
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

graphqlSchemaBuilderTest('has many relation reduction', async () => {
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

graphqlSchemaBuilderTest('bug with multiple relations 66', async () => {
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

graphqlSchemaBuilderTest('basic schema with new builder', async () => {
	const schema1 = SchemaDefinition.createModel(model)
	const relation = schema1.entities['Author'].fields['posts']
	assert.equal((relation as Model.OneHasManyRelation).orderBy, [
		{ path: ['publishedAt'], direction: Model.OrderDirection.desc },
	])
	await testSchema({
		schema: () => schema1,
		permissions: schema => new AllowAllPermissionFactory().create(schema),
		graphQlSchemaFile: 'schema-new-builder.gql',
	})
})

graphqlSchemaBuilderTest('allow only create', async () => {
	const schema = SchemaDefinition.createModel(model)
	await testSchema({
		schema: () => schema,
		permissions: schema => new AllowAllPermissionFactory([Acl.Operation.create]).create(schema),
		graphQlSchemaFile: 'schema-acl-create-only.gql',
	})
})

graphqlSchemaBuilderTest('custom primary allowed', async () => {
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

graphqlSchemaBuilderTest('aliased type', async () => {
	await testSchema({
		schema: builder =>
			builder.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String).typeAlias('AuthorName'))),
		permissions: schema => new AllowAllPermissionFactory().create(schema),
		graphQlSchemaFile: 'schema-aliased-type.gql',
	})
})

namespace ViewEntity {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}
graphqlSchemaBuilderTest('view entity', async () => {
	await testSchema({
		schema: () => SchemaDefinition.createModel(ViewEntity),
		permissions: schema => new AllowAllPermissionFactory().create(schema),
		graphQlSchemaFile: 'schema-view-entity.gql',
	})
})
graphqlSchemaBuilderTest.run()
