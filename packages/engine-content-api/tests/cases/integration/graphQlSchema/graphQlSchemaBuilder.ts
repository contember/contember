import 'jasmine'
import { graphql, printSchema } from 'graphql'
import { Acl, Model } from '@contember/schema'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import { SchemaBuilder, AllowAllPermissionFactory, SchemaDefinition } from '@contember/schema-definition'
import GraphQlSchemaBuilderFactory from '../../../../src/graphQLSchema/GraphQlSchemaBuilderFactory'
import * as model from './model'
import { graphqlObjectFactories } from '../../../src/graphqlObjectFactories'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

interface Test {
	schema: (builder: SchemaBuilder) => SchemaBuilder | Model.Schema
	permissions: (schema: Model.Schema) => Acl.Permissions
	graphQlSchemaFile: string
}

const testSchema = async (test: Test) => {
	const schemaResult = test.schema(new SchemaBuilder())

	const schemaFactory = new GraphQlSchemaBuilderFactory(graphqlObjectFactories)
	const schema = schemaResult instanceof SchemaBuilder ? schemaResult.buildSchema() : schemaResult
	const schemaWithAcl = { ...schema, acl: { roles: {}, variables: {} } }
	const permissions = test.permissions(schemaWithAcl)
	const graphQlSchemaBuilder = schemaFactory.create(schemaWithAcl, permissions)
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
	expect(errors).toEqual([])

	const textSchema = printSchema(graphQlSchema)

	const filename = path.join(__dirname, test.graphQlSchemaFile)
	let expectedSchema: string
	try {
		expectedSchema = await readFile(filename, { encoding: 'utf8' })
	} catch (e) {
		await writeFile(filename, textSchema, { encoding: 'utf8' })
		throw new Error(`Schema file ${filename} not found, creating with current schema`)
	}
	if (expectedSchema) {
		expect(textSchema).toEqual(expectedSchema)
	}
}

describe('build gql schema from model schema', () => {
	it('builds basic schema', async () => {
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
			graphQlSchemaFile: 'schema1.gql',
		})
	})

	it('restricts access to fields by permissions', async () => {
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
			graphQlSchemaFile: 'schema2.gql',
		})
	})

	describe('one has many', () => {
		const oneHasManySchema = (builder: SchemaBuilder) =>
			builder.entity('Root', e =>
				e
					.column('foo', c => c.type(Model.ColumnType.String))
					.oneHasMany('r', r =>
						r.target('OneHasManyEntity', e => e.column('a', c => c.type(Model.ColumnType.String))).ownedBy('r2'),
					),
			)

		it('all allowed', async () => {
			await testSchema({
				schema: oneHasManySchema,
				permissions: schema => new AllowAllPermissionFactory().create(schema),
				graphQlSchemaFile: 'schema3.gql',
			})
		})

		it('restricted delete', async () => {
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
				graphQlSchemaFile: 'schema4.gql',
			})
		})

		it('restricted update', async () => {
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
				graphQlSchemaFile: 'schema5.gql',
			})
		})

		it('restricted create', async () => {
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
				graphQlSchemaFile: 'schema6.gql',
			})
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
			graphQlSchemaFile: 'schema7.gql',
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
			graphQlSchemaFile: 'schema8.gql',
		})
	})

	it('builds basic schema with new builder', async () => {
		const schema1 = SchemaDefinition.createModel(model)
		const relation = schema1.entities['Author'].fields['posts']
		expect((relation as Model.OneHasManyRelation).orderBy).toEqual([
			{ path: ['publishedAt'], direction: Model.OrderDirection.desc },
		])
		await testSchema({
			schema: () => schema1,
			permissions: schema => new AllowAllPermissionFactory().create(schema),
			graphQlSchemaFile: 'schema9.gql',
		})
	})

	it('allows only create', async () => {
		const schema = SchemaDefinition.createModel(model)
		await testSchema({
			schema: () => schema,
			permissions: schema => new AllowAllPermissionFactory([Acl.Operation.create]).create(schema),
			graphQlSchemaFile: 'schema10.gql',
		})
	})
})
