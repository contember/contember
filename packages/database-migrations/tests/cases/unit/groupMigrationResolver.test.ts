import { assert, describe, test } from 'vitest'
import { GroupMigrationsResolver, Migration } from '../../../src'

describe('group migration resolver', () => {

	test('merges migrations', () => {
		const runner = () => null
		const resolver = new GroupMigrationsResolver({
			resolveMigrations: () => [new Migration('2023-07-26-104000-xyz', runner, null)],
		}, {
			someGroup: {
				resolveMigrations: () => [new Migration('2023-07-26-104001-abcd', runner, null)],
			},
		})
		assert.deepEqual(resolver.resolveMigrations({ runMigrations: [] }), [
			new Migration('2023-07-26-104000-xyz', runner, null),
			new Migration('2023-07-26-104001-abcd', runner, 'someGroup'),
		])
	})

	test('sort migrations with same timestamp', () => {
		const resolver = new GroupMigrationsResolver({
			resolveMigrations: () => [new Migration('2023-07-26-104000-xyz', () => null, null)],
		}, {
			someGroup: {
				resolveMigrations: () => [new Migration('2023-07-26-104000-abcd', () => null, null)],
			},
		})
		assert.deepEqual(resolver.resolveMigrations({ runMigrations: [] }).map(it => it.name), [
			'2023-07-26-104000-xyz',
			'2023-07-26-104000-abcd',
		])
	})

	test('pass correct run migrations', () => {
		let baseRunMigrations
		let groupRunMigrations
		const resolver = new GroupMigrationsResolver({
			resolveMigrations: ({ runMigrations }) => {
				baseRunMigrations = runMigrations
				return []
			},
		}, {
			someGroup: {
				resolveMigrations: ({ runMigrations }) => {
					groupRunMigrations = runMigrations
					return []
				},
			},
		})
		resolver.resolveMigrations({
			runMigrations: [
				{ name: 'abc', group: null },
				{ name: 'xyz', group: 'someGroup' },
			],
		})
		assert.deepEqual(baseRunMigrations, [
			{ name: 'abc', group: null },
		])
		assert.deepEqual(groupRunMigrations, [
			{ name: 'xyz', group: 'someGroup' },
		])
	})
})
