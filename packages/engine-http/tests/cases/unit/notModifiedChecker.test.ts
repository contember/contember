import { describe, expect, test } from 'bun:test'
import { OperationTypeNode } from 'graphql'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { Connection, EventManager } from '@contember/database'
import { DatabaseContextFactory } from '@contember/engine-system-api'
import { NotModifiedChecker } from '../../../src/content/NotModifiedChecker.js'
import { Timer } from '../../../src/application/index.js'

/** In-memory stand-in for a pooled connection: records every statement and replays canned rows. */
class FakeConnection implements Connection.AcquiredConnectionLike {
	public readonly eventManager = new EventManager()
	public readonly queries: { sql: string; parameters: readonly unknown[] }[] = []

	constructor(private readonly rows: readonly Record<string, unknown>[]) {}

	async query<Row extends Record<string, any>>(sql: string, parameters: readonly unknown[] = []): Promise<Connection.Result<Row>> {
		this.queries.push({ sql, parameters })
		const rows = JSON.parse(JSON.stringify(this.rows))
		return { rows, rowCount: rows.length }
	}

	async scope<Result>(callback: (connection: Connection.AcquiredConnectionLike) => Promise<Result> | Result): Promise<Result> {
		return await callback(this)
	}

	async transaction<Result>(): Promise<Result> {
		throw new Error('Transactions are not supported by this test double')
	}

	on(): () => void {
		return () => {}
	}
}

const timer: Timer = (event, cb) => cb()
const stageId = 'a4c9b8f2-6a1e-4a3f-9a4b-1f2e3d4c5b6a'

const createSystemDatabase = (transactionIds: readonly string[]) => {
	const connection = new FakeConnection(transactionIds.map(transaction_id => ({ transaction_id })))
	const databaseContext = new DatabaseContextFactory('system', { uuid: () => stageId }).create(connection)
	return { connection, databaseContext }
}

const createRequest = (headers: Record<string, string>): IncomingMessage => {
	const request = new IncomingMessage(new Socket())
	request.headers = { ...request.headers, ...headers }
	return request
}

const createResponse = (statusCode: number): ServerResponse => {
	const response = new ServerResponse(new IncomingMessage(new Socket()))
	response.statusCode = statusCode
	return response
}

const check = async (
	{ operation, headers, transactionIds }: {
		operation: OperationTypeNode
		headers: Record<string, string>
		transactionIds: readonly string[]
	},
) => {
	const { connection, databaseContext } = createSystemDatabase(transactionIds)
	const result = await new NotModifiedChecker().checkNotModified({
		request: createRequest(headers),
		operation,
		timer,
		systemDatabase: databaseContext,
		stageId,
	})
	return { result, connection }
}

describe('not modified checker', () => {
	test('skips a mutation without touching the database', async () => {
		const { result, connection } = await check({
			operation: OperationTypeNode.MUTATION,
			headers: { 'x-contember-ref': 'abc' },
			transactionIds: ['abc'],
		})
		expect(result).toBeNull()
		expect(connection.queries).toEqual([])
	})

	test('skips a subscription without touching the database', async () => {
		const { result, connection } = await check({
			operation: OperationTypeNode.SUBSCRIPTION,
			headers: { 'x-contember-ref': 'abc' },
			transactionIds: ['abc'],
		})
		expect(result).toBeNull()
		expect(connection.queries).toEqual([])
	})

	test('skips a request without the ref header without touching the database', async () => {
		const { result, connection } = await check({
			operation: OperationTypeNode.QUERY,
			headers: {},
			transactionIds: ['abc'],
		})
		expect(result).toBeNull()
		expect(connection.queries).toEqual([])
	})

	// the operation type now comes from the parsed document, so the word "mutation" in the query text no longer matters
	test('checks a query operation against the latest transaction', async () => {
		const { result, connection } = await check({
			operation: OperationTypeNode.QUERY,
			headers: { 'x-contember-ref': 'abc' },
			transactionIds: ['abc'],
		})
		expect(connection.queries).toHaveLength(1)
		expect(connection.queries[0].sql).toContain('stage_transaction')
		expect(result?.isModified).toBe(false)
	})

	test('reports a modified stage when the refs differ', async () => {
		const { result } = await check({
			operation: OperationTypeNode.QUERY,
			headers: { 'x-contember-ref': 'abc' },
			transactionIds: ['def'],
		})
		expect(result?.isModified).toBe(true)
	})

	test('returns null when the stage has no transaction yet', async () => {
		const { result, connection } = await check({
			operation: OperationTypeNode.QUERY,
			headers: { 'x-contember-ref': 'abc' },
			transactionIds: [],
		})
		expect(connection.queries).toHaveLength(1)
		expect(result).toBeNull()
	})

	test('sets the response header on 200 only', async () => {
		const { result } = await check({
			operation: OperationTypeNode.QUERY,
			headers: { 'x-contember-ref': 'abc' },
			transactionIds: ['def'],
		})
		if (!result) {
			throw new Error('Expected a check result')
		}
		const okResponse = createResponse(200)
		result.setResponseHeader(okResponse)
		expect(okResponse.getHeader('x-contember-ref')).toBe('def')

		const errorResponse = createResponse(500)
		result.setResponseHeader(errorResponse)
		expect(errorResponse.getHeader('x-contember-ref')).toBeUndefined()
	})
})
