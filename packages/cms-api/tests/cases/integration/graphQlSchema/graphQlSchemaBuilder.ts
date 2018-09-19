import 'mocha'
import { printSchema } from 'graphql'
import { expect } from 'chai'
import { Acl, Model } from 'cms-common'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import GraphQlSchemaBuilderFactory from '../../../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import AllowAllPermissionFactory from '../../../../src/acl/AllowAllPermissionFactory'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

interface Test {
	schema: (builder: SchemaBuilder) => SchemaBuilder
	permissions: (schema: Model.Schema) => Acl.Permissions
	graphQlSchemaFile: string
}

const testSchema = async (test: Test) => {
	const builder = test.schema(new SchemaBuilder())

	const schemaFactory = new GraphQlSchemaBuilderFactory()
	const schema = builder.buildSchema()
	const schemaWithAcl = { ...schema, acl: { roles: {}, variables: {} } }
	const permissions = test.permissions(schemaWithAcl)
	const graphQlSchemaBuilder = schemaFactory.create(schemaWithAcl, permissions)
	const graphQlSchema = graphQlSchemaBuilder.build()

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
		expect(textSchema).equals(expectedSchema)
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
							.oneHasMany('posts', r => r.target('Post').ownedBy('author'))
					)
					.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
					.entity('Post', e =>
						e
							.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
							.oneHasMany('locales', r =>
								r.target('PostLocale', e => e.column('title', c => c.type(Model.ColumnType.String)))
							)
							.manyHasMany('categories', r => r.target('Category').inversedBy('posts'))
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
						.column('c', c => c.type(Model.ColumnType.String))
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
						r.target('OneHasManyEntity', e => e.column('a', c => c.type(Model.ColumnType.String))).ownedBy('r2')
					)
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
})
