import { suite } from 'uvu'
import { CreatedRowReferenceDependencyBuilder } from '../../../../src/model/events/dependency'
import { SchemaBuilder } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { CreateEvent, UpdateEvent } from '@contember/engine-common'
import { testUuid } from '@contember/engine-api-tester'
import { unnamedIdentity } from '../../../../src'
import * as assert from '../../../src/asserts'

const test = suite('Created row reference dependency builder')

const now = new Date('2020-10-28 10:00')

test('basic reference', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
		.entity('Author', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new CreatedRowReferenceDependencyBuilder()
	const authorEventId = testUuid(10)
	const authorEntityId = testUuid(11)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const events = [
		new CreateEvent(authorEventId, now, unnamedIdentity, trxId, [authorEntityId], 'author', {
			name: 'John doe',
		}),
		new CreateEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post', {
			title: 'foo',
			author_id: authorEntityId,
		}),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 1)
	assert.ok(deps.has(postEventId))
	assert.not.ok(deps.has(authorEventId))
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const postDeps = deps.get(postEventId)!
	assert.is(postDeps.size, 1)
	assert.ok(postDeps.has(authorEventId))
})

test('uuid collision in different table', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
		.entity('Author', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new CreatedRowReferenceDependencyBuilder()
	const authorEventId = testUuid(10)
	const authorEntityId = testUuid(11)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const events = [
		new CreateEvent(authorEventId, now, unnamedIdentity, trxId, [authorEntityId], 'authorXXX', {}),
		new CreateEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post', {
			title: 'foo',
			author_id: authorEntityId,
		}),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 0)
})

test('update of created row', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
		.entity('Author', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new CreatedRowReferenceDependencyBuilder()
	const authorEventId = testUuid(10)
	const authorEventId2 = testUuid(12)
	const authorEntityId = testUuid(11)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const events = [
		new CreateEvent(authorEventId, now, unnamedIdentity, trxId, [authorEntityId], 'author', {
			name: 'John doe',
		}),
		new UpdateEvent(authorEventId2, now, unnamedIdentity, trxId, [authorEntityId], 'author', {
			name: 'Jack black',
		}),
		new CreateEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post', {
			title: 'foo',
			author_id: authorEntityId,
		}),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 1)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const postDeps = deps.get(postEventId)!
	assert.is(postDeps.size, 1)
	assert.ok(postDeps.has(authorEventId2))
})

test('junction table', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasMany('categories', r => r.target('Category')))
		.entity('Category', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new CreatedRowReferenceDependencyBuilder()
	const categoryEventId = testUuid(10)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const junctionEventId = testUuid(30)
	const events = [
		new CreateEvent(categoryEventId, now, unnamedIdentity, trxId, [categoryEventId], 'category', {
			name: 'lorem',
		}),
		new CreateEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post', {
			title: 'foo',
		}),
		new CreateEvent(
			junctionEventId,
			now,
			unnamedIdentity,
			trxId,
			[postEventId, categoryEventId],
			'post_categories',
			{},
		),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 1)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const junctionDeps = deps.get(junctionEventId)!
	assert.is(junctionDeps.size, 2)
	assert.ok(junctionDeps.has(categoryEventId))
	assert.ok(junctionDeps.has(postEventId))
})

test.run()
