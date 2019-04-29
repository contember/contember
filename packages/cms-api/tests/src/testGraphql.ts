import { expect } from 'chai'
import { graphql, GraphQLSchema } from 'graphql'
import { maskErrors } from 'graphql-errors'
import { testUuid } from './testUuid'
import * as uuid from '../../src/utils/uuid'
import * as date from '../../src/utils/date'
import sinon from 'sinon'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	return: object
}

export const executeGraphQlTest = async (test: Test) => {
	maskErrors(test.schema)

	let id = 1
	const uuidStub = sinon.stub(uuid, 'uuid').callsFake(() => testUuid(id++))
	const nowStub = sinon.stub(date, 'now').callsFake(() => new Date('2018-10-12T08:00:00.000Z'))

	try {
		const response = await graphql(test.schema, test.query, null, test.context)
		// console.log(response)
		expect(response).deep.equal(test.return)
	} finally {
		uuidStub.restore()
		nowStub.restore()
	}
}
