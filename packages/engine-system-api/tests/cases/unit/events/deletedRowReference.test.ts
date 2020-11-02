import { suite } from 'uvu'
import { DeletedRowReferenceDependencyBuilder } from '../../../../src/model/events/dependency'
import { SchemaBuilder } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { CreateEvent, DeleteEvent, UpdateEvent } from '@contember/engine-common'
import { testUuid } from '@contember/engine-api-tester'
import { unnamedIdentity } from '../../../../src'
import * as assert from '../../../src/asserts'

const test = suite('Deleted row reference dependency builder')

const now = new Date('2020-10-28 10:00')

test('basic reference', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
		.entity('Author', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new DeletedRowReferenceDependencyBuilder()
	const authorEventId = testUuid(10)
	const authorEntityId = testUuid(11)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const events = [
		new UpdateEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post', {
			author_id: authorEntityId,
		}),
		new DeleteEvent(authorEventId, now, unnamedIdentity, trxId, [authorEntityId], 'author'),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 1)
	assert.ok(deps.has(authorEventId))
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const authorDeps = deps.get(authorEventId)!
	assert.is(authorDeps.size, 1)
	assert.ok(authorDeps.has(postEventId))
})

test('uuid collision in different table', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
		.entity('Author', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new DeletedRowReferenceDependencyBuilder()
	const authorEventId = testUuid(10)
	const authorEntityId = testUuid(11)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const events = [
		new UpdateEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post', {
			author_id: authorEntityId,
		}),
		new DeleteEvent(authorEventId, now, unnamedIdentity, trxId, [authorEntityId], 'authorX'),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 0)
})

test('junction table', async () => {
	const model = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasMany('categories', r => r.target('Category')))
		.entity('Category', e => e.column('name'))
		.buildSchema()
	const dependencyBuilder = new DeletedRowReferenceDependencyBuilder()
	const categoryEventId = testUuid(10)
	const trxId = testUuid(500)
	const postEventId = testUuid(20)
	const junctionEventId = testUuid(30)
	const events = [
		new CreateEvent(
			junctionEventId,
			now,
			unnamedIdentity,
			trxId,
			[postEventId, categoryEventId],
			'post_categories',
			{},
		),
		new DeleteEvent(categoryEventId, now, unnamedIdentity, trxId, [categoryEventId], 'category'),
		new DeleteEvent(postEventId, now, unnamedIdentity, trxId, [postEventId], 'post'),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 2)
	assert.ok(deps.has(categoryEventId))
	assert.ok(deps.has(postEventId))
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const categoryEventDeps = deps.get(categoryEventId)!
	assert.is(categoryEventDeps.size, 1)
	assert.ok(categoryEventDeps.has(junctionEventId))
	const postEventDeps = deps.get(postEventId)!
	assert.is(postEventDeps.size, 1)
	assert.ok(postEventDeps.has(junctionEventId))
})

test.run()
