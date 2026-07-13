import { expect, test } from 'bun:test'
import { Acl, Input } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { Authorizator } from '../../../src/acl/index.js'
import { CreateEntityRelationAllowedOperationsVisitor, UpdateEntityRelationAllowedOperationsVisitor } from '../../../src/schema/mutations/index.js'

const model = new SchemaBuilder()
	.entity('Post', entity => entity.manyHasMany('categories', relation => relation.target('Category').inversedBy('posts')))
	.entity('Category', entity => entity)
	.buildSchema()

const permissions = (inverseRelationPermission: boolean): Acl.Permissions => ({
	Post: {
		predicates: {},
		operations: {
			create: { id: true, categories: true },
			update: { id: true, categories: true },
		},
	},
	Category: {
		predicates: {},
		operations: {
			read: { id: true },
			create: inverseRelationPermission ? { id: true, posts: true } : { id: true },
			update: inverseRelationPermission ? { id: true, posts: true } : { id: true },
			delete: true,
		},
	},
})

const post = getEntity(model, 'Post')

const visitCreate = (authorizator: Authorizator): Input.CreateRelationOperation[] =>
	acceptFieldVisitor(model, post, 'categories', new CreateEntityRelationAllowedOperationsVisitor(authorizator))

const visitUpdate = (authorizator: Authorizator): Input.UpdateRelationOperation[] =>
	acceptFieldVisitor(model, post, 'categories', new UpdateEntityRelationAllowedOperationsVisitor(authorizator))

test('M:N create operations are hidden when the inverse relation cannot be created', () => {
	const visitor = new CreateEntityRelationAllowedOperationsVisitor(new Authorizator(permissions(false), false, false))
	expect(acceptFieldVisitor(model, post, 'categories', visitor)).toEqual([])
})

test('M:N update exposes only operations whose runtime permissions can pass', () => {
	const visitor = new UpdateEntityRelationAllowedOperationsVisitor(new Authorizator(permissions(false), false, false))
	expect(acceptFieldVisitor(model, post, 'categories', visitor)).toEqual([Input.UpdateRelationOperation.delete])
})

test('M:N junction operations are exposed when both relation sides are updatable', () => {
	const authorizator = new Authorizator(permissions(true), false, false)
	expect(visitCreate(authorizator)).toContain(Input.CreateRelationOperation.connect)
	expect(visitUpdate(authorizator)).toContain(Input.UpdateRelationOperation.disconnect)
})
