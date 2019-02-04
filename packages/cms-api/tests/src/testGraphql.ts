import { expect } from 'chai'
import { graphql, GraphQLSchema } from 'graphql'
import { maskErrors } from 'graphql-errors'
import knex from 'knex'
import mockKnex from 'mock-knex'
import { testUuid } from './testUuid'
import * as uuid from '../../src/utils/uuid'
import * as date from '../../src/utils/date'
import sinon from 'sinon'

export interface SqlQuery {
	sql: string
	parameters?: any[]
	response: any[] | any
}

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	executes: SqlQuery[]
	return: object
}

export const executeGraphQlTest = async (connection: knex, test: Test) => {
	maskErrors(test.schema)

	mockKnex.mock(connection)

	let id = 1
	const uuidStub = sinon.stub(uuid, 'uuid').callsFake(() => testUuid(id++))
	const nowStub = sinon.stub(date, 'now').callsFake(() => new Date('2018-10-12T08:00:00.000Z'))

	const tracker = mockKnex.getTracker()
	tracker.install()
	let failed: number | null = null
	tracker.on('query', (query, step) => {
		const queryDefinition = test.executes[step - 1]
		if (query.sql === 'ROLLBACK;') {
			query.response([])
			return
		}
		const actualSql = query.sql.replace(/\s+/g, ' ')
		// console.log(actualSql)
		// console.log(queryDefinition.sql)
		// console.log(query.bindings)
		if (!queryDefinition) {
			throw new Error(`Unexpected query #${step} '${query.sql}'`)
		}
		try {
			expect(actualSql).equals(queryDefinition.sql)
			if (queryDefinition.parameters) {
				expect(query.bindings.length).equals(queryDefinition.parameters.length)
				for (let index in queryDefinition.parameters) {
					const rule = queryDefinition.parameters[index]
					const binding = query.bindings[index]
					if (typeof rule === 'function') {
						expect(rule(binding)).equal(true)
					} else if (rule instanceof Date && binding instanceof Date) {
						expect(rule.getTime()).equal(binding.getTime())
					} else {
						expect(binding).equals(rule)
					}
				}
			}
		} catch (e) {
			failed = step
			throw e
		}
		query.response(queryDefinition.response || [])
	})
	try {
		const response = await graphql(test.schema, test.query, null, test.context)
		// console.log(response)
		expect(response).deep.equal(test.return)
	} finally {
		tracker.uninstall()
		mockKnex.unmock(connection)
		uuidStub.restore()
		nowStub.restore()
	}
}
