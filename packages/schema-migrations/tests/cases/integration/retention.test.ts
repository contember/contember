import { Retention } from '@contember/schema'
import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests.js'
import { c, createSchema } from '@contember/schema-definition'

namespace Model {
	export class Token {
		value = c.stringColumn()
		used = c.boolColumn()
		expiresAt = c.dateTimeColumn()
	}
}

const base = createSchema(Model)

const policy: Retention.Policy = {
	name: 'token_retention',
	entity: 'Token',
	strategy: 'raw',
	olderThan: { field: 'expiresAt', interval: '30 days' },
	where: { used: { eq: true } },
	schedule: { cron: '17 3 * * *' },
	batchSize: 5000,
	maxPerRun: 1000000,
}

const updatedPolicy: Retention.Policy = {
	...policy,
	olderThan: { field: 'expiresAt', interval: '90 days' },
}

describe('create retention policy', () =>
	testMigrations({
		original: { ...base, retention: { policies: {} } },
		updated: { ...base, retention: { policies: { token_retention: policy } } },
		diff: [
			{
				modification: 'createRetentionPolicy',
				policy,
			},
		],
		sql: '', // schema-only, no SQL
	}))

describe('update retention policy', () =>
	testMigrations({
		original: { ...base, retention: { policies: { token_retention: policy } } },
		updated: { ...base, retention: { policies: { token_retention: updatedPolicy } } },
		diff: [
			{
				modification: 'updateRetentionPolicy',
				name: 'token_retention',
				policy: updatedPolicy,
			},
		],
		sql: '',
	}))

describe('remove retention policy', () =>
	testMigrations({
		original: { ...base, retention: { policies: { token_retention: policy } } },
		updated: { ...base, retention: { policies: {} } },
		diff: [
			{
				modification: 'removeRetentionPolicy',
				name: 'token_retention',
			},
		],
		sql: '',
	}))
