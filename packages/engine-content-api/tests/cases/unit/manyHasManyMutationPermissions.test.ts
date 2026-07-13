import { expect, test } from 'bun:test'
import { Client, emptyDatabaseMetadata } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'
import { Acl, Input, Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { acceptFieldVisitor, AllowAllPermissionFactory, emptySchema, getEntity } from '@contember/schema-utils'
import { Authorizator } from '../../../src/acl/index.js'
import { ExecutionContainerFactory, Mapper } from '../../../src/index.js'
import { MutationAccess, MutationJunctionOperations, normalizeMutationJunctionOperations } from '../../../src/mapper/MutationAccess.js'
import { CreateEntityRelationAllowedOperationsVisitor, UpdateEntityRelationAllowedOperationsVisitor } from '../../../src/schema/mutations/index.js'
import { testUuid } from '../../src/testUuid.js'

const bidirectionalModel = new SchemaBuilder()
	.entity('Post', entity => entity.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts')))
	.entity('Category', entity => entity)
	.buildSchema()

const unidirectionalModel = new SchemaBuilder()
	.entity('Post', entity => entity.manyHasMany('categories', relation => relation.target('Category')))
	.entity('Category', entity => entity)
	.buildSchema()

const selfReferentialModel = new SchemaBuilder()
	.entity('Person', entity => entity.manyHasMany('friends', relation => relation.target('Person').inversedBy('friendOf')))
	.buildSchema()

const permissions = ({
	postCreateCategories = true,
	postUpdateCategories = true,
	categoryCreatePosts = true,
	categoryUpdatePosts = true,
}: {
	postCreateCategories?: boolean
	postUpdateCategories?: boolean
	categoryCreatePosts?: boolean
	categoryUpdatePosts?: boolean
} = {}): Acl.Permissions => ({
	Post: {
		predicates: {},
		operations: {
			read: { id: true },
			create: { id: true, ...(postCreateCategories ? { categories: true } : {}) },
			update: { id: true, ...(postUpdateCategories ? { categories: true } : {}) },
			delete: true,
		},
	},
	Category: {
		predicates: {},
		operations: {
			read: { id: true },
			create: { id: true, ...(categoryCreatePosts ? { posts: true } : {}) },
			update: { id: true, ...(categoryUpdatePosts ? { posts: true } : {}) },
			delete: true,
		},
	},
})

const visitCreate = (
	model: typeof bidirectionalModel,
	entityName: 'Post' | 'Category',
	field: 'categories' | 'posts',
	authorizator: Authorizator,
): Input.CreateRelationOperation[] =>
	acceptFieldVisitor(model, getEntity(model, entityName), field, new CreateEntityRelationAllowedOperationsVisitor(authorizator))

const visitUpdate = (
	model: typeof bidirectionalModel,
	entityName: 'Post' | 'Category',
	field: 'categories' | 'posts',
	authorizator: Authorizator,
): Input.UpdateRelationOperation[] =>
	acceptFieldVisitor(model, getEntity(model, entityName), field, new UpdateEntityRelationAllowedOperationsVisitor(authorizator))

test('M:N create connect requires source create and target update permissions', () => {
	const authorizator = new Authorizator(permissions({ categoryUpdatePosts: false }), false, false)
	expect(visitCreate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([Input.CreateRelationOperation.create])
})

test('M:N create create requires source create and target create permissions', () => {
	const authorizator = new Authorizator(permissions({ categoryCreatePosts: false }), false, false)
	expect(visitCreate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([Input.CreateRelationOperation.connect])
})

test('M:N create connectOrCreate is hidden unless both lifecycle branches are permitted', () => {
	const authorizator = new Authorizator(permissions(), false, false)
	expect(visitCreate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([
		Input.CreateRelationOperation.connect,
		Input.CreateRelationOperation.create,
		Input.CreateRelationOperation.connectOrCreate,
	])
})

test('unidirectional M:N does not require a nonexistent target relation permission', () => {
	const authorizator = new Authorizator(permissions({ categoryUpdatePosts: false, categoryCreatePosts: false }), false, false)
	expect(visitCreate(unidirectionalModel, 'Post', 'categories', authorizator)).toEqual([
		Input.CreateRelationOperation.connect,
		Input.CreateRelationOperation.create,
		Input.CreateRelationOperation.connectOrCreate,
	])
})

test('M:N update emits only operations with matching target lifecycles', () => {
	const authorizator = new Authorizator(permissions({ categoryCreatePosts: false }), false, false)
	expect(visitUpdate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([
		Input.UpdateRelationOperation.connect,
		Input.UpdateRelationOperation.disconnect,
		Input.UpdateRelationOperation.update,
		Input.UpdateRelationOperation.delete,
	])
})

test('M:N update preserves only target-new operations when the target cannot be updated', () => {
	const authorizator = new Authorizator(permissions({ categoryUpdatePosts: false }), false, false)
	expect(visitUpdate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([
		Input.UpdateRelationOperation.create,
		Input.UpdateRelationOperation.delete,
	])
})

test('M:N update exposes every lifecycle operation only when both target branches are permitted', () => {
	const authorizator = new Authorizator(permissions(), false, false)
	expect(visitUpdate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([
		Input.UpdateRelationOperation.connect,
		Input.UpdateRelationOperation.disconnect,
		Input.UpdateRelationOperation.create,
		Input.UpdateRelationOperation.update,
		Input.UpdateRelationOperation.upsert,
		Input.UpdateRelationOperation.delete,
		Input.UpdateRelationOperation.connectOrCreate,
	])
})

test('M:N inverse orientation uses the target endpoint lifecycle permission', () => {
	const authorizator = new Authorizator(permissions({ postUpdateCategories: false }), false, false)
	expect(visitUpdate(bidirectionalModel, 'Category', 'posts', authorizator)).toEqual([
		Input.UpdateRelationOperation.create,
		Input.UpdateRelationOperation.delete,
	])
})

test('M:N update remains closed when the source relation cannot be updated', () => {
	const authorizator = new Authorizator(permissions({ postUpdateCategories: false }), false, false)
	expect(visitUpdate(bidirectionalModel, 'Post', 'categories', authorizator)).toEqual([])
})

test('self-referential M:N normalizes source and target lifecycle permissions by relation endpoint', () => {
	const authorizator = new Authorizator(
		{
			Person: {
				predicates: {},
				operations: {
					read: { id: true },
					create: { id: true, friends: true, friendOf: true },
					update: { id: true, friends: true, friendOf: true },
				},
			},
		},
		false,
		false,
	)
	const person = getEntity(selfReferentialModel, 'Person')
	expect(
		acceptFieldVisitor(
			selfReferentialModel,
			person,
			'friends',
			new CreateEntityRelationAllowedOperationsVisitor(authorizator),
		),
	).toEqual([
		Input.CreateRelationOperation.connect,
		Input.CreateRelationOperation.create,
		Input.CreateRelationOperation.connectOrCreate,
	])
})

test('legacy junction operations normalize through the public Mapper APIs', async () => {
	expect(normalizeMutationJunctionOperations()).toEqual({ source: Acl.Operation.update, target: Acl.Operation.update })
	expect(normalizeMutationJunctionOperations(Acl.Operation.create)).toEqual({ source: Acl.Operation.create, target: Acl.Operation.create })
	const endpointOperations: MutationJunctionOperations = { source: Acl.Operation.create, target: Acl.Operation.update }
	expect(normalizeMutationJunctionOperations(endpointOperations)).toBe(endpointOperations)

	const post = getEntity(bidirectionalModel, 'Post')
	const relation = post.fields.categories
	if (relation.type !== Model.RelationType.ManyHasMany || !('joiningTable' in relation)) {
		throw new Error('Expected an owning many-has-many relation')
	}
	const source = testUuid(1)
	const target = testUuid(2)
	const insertQuery = {
		sql: 'insert into "public"."post_categories" ("post_id", "category_id") values (?, ?) on conflict do nothing',
		parameters: [source, target],
		response: { rows: [], rowCount: 1 },
	}
	const connection = createConnectionMock([
		{
			sql: 'select set_config(?, ?, false)',
			parameters: ['tenant.identity_id', testUuid(3)],
			response: { rows: [], rowCount: 1 },
		},
		{
			sql: 'select set_config(?, ?, false)',
			parameters: ['system.transaction_id', testUuid(4)],
			response: { rows: [], rowCount: 1 },
		},
		...Array.from({ length: 9 }, () => insertQuery),
	])
	const schema = { ...emptySchema, model: bidirectionalModel }
	const mapper: Mapper = new ExecutionContainerFactory({ uuid: () => testUuid(4), now: () => new Date(0) })
		.createBuilder({
			schema,
			schemaMeta: {},
			schemaDatabaseMetadata: emptyDatabaseMetadata,
			db: new Client(connection, 'public', {}),
			identityId: testUuid(3),
			identityVariables: {},
			permissions: new AllowAllPermissionFactory().create(bidirectionalModel),
			systemSchema: 'system',
			project: { slug: 'test' },
			stage: { id: testUuid(5), slug: 'live' },
			userInfo: { ipAddress: null, userAgent: null },
		})
		.build()
		.mapperFactory.create()
	const access = new MutationAccess(mapper)

	await mapper.connectJunction(post, relation, source, target)
	await mapper.connectJunction(post, relation, source, target, Acl.Operation.create)
	await mapper.connectJunction(post, relation, source, target, endpointOperations)
	await mapper.connectJunctionWithAccess(access, post, relation, source, target)
	await mapper.connectJunctionWithAccess(access, post, relation, source, target, Acl.Operation.create)
	await mapper.connectJunctionWithAccess(access, post, relation, source, target, endpointOperations)
	await access.connectJunction(post, relation, source, target)
	await access.connectJunction(post, relation, source, target, Acl.Operation.create)
	await access.connectJunction(post, relation, source, target, endpointOperations)
})
