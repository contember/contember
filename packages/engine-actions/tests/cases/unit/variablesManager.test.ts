import { describe, expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, DatabaseContextFactory } from '@contember/engine-system-api'
import { VariablesManager } from '../../../src/model/VariablesManager.js'
import { testUuid } from '../../src/uuid.js'

const selectVariables = (rows: { name: string; value: string }[]): ExpectedQuery => ({
	sql: 'select * from "system"."actions_variable"',
	parameters: [],
	response: { rows },
})

const transaction = (...queries: ExpectedQuery[]): ExpectedQuery[] => [
	{ sql: 'BEGIN;', response: { rowCount: 1 } },
	{ sql: 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ', response: { rowCount: 1 } },
	...queries,
	{ sql: 'COMMIT;', response: { rowCount: 1 } },
]

const createDb = (queries: ExpectedQuery[]): DatabaseContext =>
	new DatabaseContextFactory('system', { uuid: () => testUuid(1) }).create(createConnectionMock(queries))

describe('variables from the environment', () => {
	test('a project-scoped env variable overrides a stored row', async () => {
		const manager = new VariablesManager({ MY_PROJECT_ACTIONS_VARIABLE_API_KEY: 'from-env' })
		const db = createDb([selectVariables([{ name: 'API_KEY', value: 'from-db' }])])

		expect(await manager.fetchVariables(db, 'my-project')).toEqual({ API_KEY: 'from-env' })
	})

	test('a project-scoped env variable works without any stored row', async () => {
		const manager = new VariablesManager({ MY_PROJECT_ACTIONS_VARIABLE_API_KEY: 'from-env' })
		const db = createDb([selectVariables([])])

		expect(await manager.fetchVariables(db, 'my-project')).toEqual({ API_KEY: 'from-env' })
	})

	test('the shared DEFAULT_ value applies to every project, the project-scoped one wins', async () => {
		const manager = new VariablesManager({
			DEFAULT_ACTIONS_VARIABLE_API_KEY: 'shared',
			DEFAULT_ACTIONS_VARIABLE_BASE_URL: 'https://example.com',
			MY_PROJECT_ACTIONS_VARIABLE_API_KEY: 'mine',
		})
		const db = createDb([selectVariables([])])

		expect(await manager.fetchVariables(db, 'my-project')).toEqual({
			API_KEY: 'mine',
			BASE_URL: 'https://example.com',
		})
	})

	test('another project and unrelated env variables are ignored', async () => {
		const manager = new VariablesManager({
			OTHER_ACTIONS_VARIABLE_API_KEY: 'not-mine',
			MY_PROJECT_ACTIONS_VARIABLE_: 'no-name',
			MY_PROJECT_ACTIONS_VARIABLE_BLANK: '',
			CONTEMBER_ROOT_TOKEN: 'unrelated',
		})
		const db = createDb([selectVariables([{ name: 'API_KEY', value: 'from-db' }])])

		expect(await manager.fetchVariables(db, 'my-project')).toEqual({ API_KEY: 'from-db' })
	})

	test('a stored variable is unaffected when the environment supplies nothing', async () => {
		const manager = new VariablesManager({})
		const db = createDb([selectVariables([{ name: 'API_KEY', value: 'from-db' }, { name: 'baseUrl', value: 'http://localhost' }])])

		expect(await manager.fetchVariables(db, 'my-project')).toEqual({ API_KEY: 'from-db', baseUrl: 'http://localhost' })
	})

	test('listing reports where each value comes from', async () => {
		const manager = new VariablesManager({ MY_PROJECT_ACTIONS_VARIABLE_API_KEY: 'from-env' })
		const db = createDb([selectVariables([{ name: 'API_KEY', value: 'from-db' }, { name: 'baseUrl', value: 'http://localhost' }])])

		expect(await manager.listVariables(db, 'my-project')).toEqual([
			{ name: 'baseUrl', value: 'http://localhost', source: 'DATABASE' },
			{ name: 'API_KEY', value: 'from-env', source: 'ENVIRONMENT' },
		])
	})
})

describe('setVariables', () => {
	test('rejects a name supplied by the environment without touching the database', async () => {
		const manager = new VariablesManager({ MY_PROJECT_ACTIONS_VARIABLE_API_KEY: 'from-env' })
		const db = createDb([])

		await expect(manager.setVariables(db, { variables: [{ name: 'API_KEY', value: 'attempted' }] }, 'my-project')).rejects.toThrow(
			'Variables supplied by the environment are read-only: API_KEY',
		)
	})

	test('writes a variable the environment does not supply', async () => {
		const manager = new VariablesManager({ MY_PROJECT_ACTIONS_VARIABLE_API_KEY: 'from-env' })
		const db = createDb(transaction(
			selectVariables([]),
			{
				sql:
					'insert into "system"."actions_variable" ("id", "name", "value") values (?, ?, ?) on conflict ("name") do update set "value" = ?, "updated_at" = NOW()',
				parameters: [testUuid(1), 'baseUrl', 'http://localhost', 'http://localhost'],
				response: { rowCount: 1 },
			},
		))

		await manager.setVariables(db, { variables: [{ name: 'baseUrl', value: 'http://localhost' }] }, 'my-project')
	})

	test('SET mode drops the stored rows that are not submitted', async () => {
		const manager = new VariablesManager({})
		const db = createDb(transaction(
			selectVariables([{ name: 'baseUrl', value: 'http://localhost' }, { name: 'stale', value: 'gone' }]),
			{
				sql: 'delete from "system"."actions_variable" where "name" in (?)',
				parameters: ['stale'],
				response: { rowCount: 1 },
			},
		))

		await manager.setVariables(db, { variables: [{ name: 'baseUrl', value: 'http://localhost' }], mode: 'SET' }, 'my-project')
	})
})
