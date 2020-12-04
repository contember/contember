import { suite } from 'uvu'
import { TransactionDependencyBuilder } from '../../../../src/model/events/dependency'
import { SchemaBuilder } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { UpdateEvent } from '@contember/engine-common'
import { testUuid } from '@contember/engine-api-tester'
import { unnamedIdentity } from '../../../../src'
import * as assert from '../../../src/asserts'

const test = suite('Same transaction dependency builder')

const now = new Date('2020-10-28 10:00')

test('basic deps', async () => {
	const model = new SchemaBuilder().entity('Author', e => e.column('name')).buildSchema()

	const dependencyBuilder = new TransactionDependencyBuilder()
	const event1 = testUuid(30)
	const event2 = testUuid(31)
	const event3 = testUuid(32)
	const authorEntityId = testUuid(10)

	const trxId1 = testUuid(500)
	const trxId2 = testUuid(501)
	const events = [
		new UpdateEvent(event1, now, unnamedIdentity, trxId1, [authorEntityId], 'author', {}),
		new UpdateEvent(event2, now, unnamedIdentity, trxId1, [authorEntityId], 'author', {}),
		new UpdateEvent(event3, now, unnamedIdentity, trxId2, [authorEntityId], 'author', {}),
	]
	const deps = await dependencyBuilder.build({ ...emptySchema, model }, events)
	assert.is(deps.size, 3)
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const event1deps = deps.get(event1)!
	// it also includes self-dep
	assert.is(event1deps.size, 2)
	assert.ok(event1deps.has(event2))
	const event2deps = deps.get(event2)!
	assert.is(event2deps.size, 2)
	assert.ok(event2deps.has(event1))

	const event3deps = deps.get(event3)!
	assert.is(event3deps.size, 1)
	assert.not.ok(event3deps.has(event1))
	assert.not.ok(event3deps.has(event2))
})

test.run()
