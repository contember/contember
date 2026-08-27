import { describe, expect, test } from 'bun:test'
import Koa from 'koa'
import { GraphQLObjectType, GraphQLSchema, GraphQLString, OperationTypeNode } from 'graphql'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createGraphQLQueryHandler, GraphQLListener, PreparedGraphQLRequest } from '../../../src/graphql/execution.js'

type TestContext = { marker: string }

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: {
			hello: { type: GraphQLString, resolve: () => 'world' },
			echo: {
				type: GraphQLString,
				args: { value: { type: GraphQLString } },
				resolve: (_source, args: { value?: string }) => args.value,
			},
		},
	}),
	mutation: new GraphQLObjectType({
		name: 'Mutation',
		fields: {
			touch: { type: GraphQLString, resolve: () => 'touched' },
		},
	}),
})

const createHandler = (listeners: GraphQLListener<TestContext>[] = []) => createGraphQLQueryHandler<TestContext>({ schema, listeners })

const createKoaContext = ({ method = 'POST', url = '/', body }: { method?: string; url?: string; body?: unknown } = {}) => {
	const request = new IncomingMessage(new Socket())
	request.method = method
	request.url = url
	const context = new Koa().createContext(request, new ServerResponse(request))
	Object.assign(context.request, { body })
	return context
}

const parseBody = (context: { response: { body?: unknown } }) => JSON.parse(String(context.response.body))

const prepareOk = (handler: ReturnType<typeof createHandler>, body: unknown): PreparedGraphQLRequest => {
	const result = handler.prepare(createKoaContext({ body }).request)
	if (!result.ok) {
		throw new Error('Expected prepare to succeed')
	}
	return result.prepared
}

describe('graphql handler prepare', () => {
	test('resolves the query operation', () => {
		const prepared = prepareOk(createHandler(), { query: '{ hello }' })
		expect(prepared.operation).toBe(OperationTypeNode.QUERY)
		expect(prepared.operationName).toBeNull()
	})

	test('resolves the mutation operation', () => {
		const prepared = prepareOk(createHandler(), { query: 'mutation { touch }' })
		expect(prepared.operation).toBe(OperationTypeNode.MUTATION)
	})

	test('a query document mentioning the word mutation is still a query', () => {
		const prepared = prepareOk(createHandler(), { query: 'query mutationLike { hello }' })
		expect(prepared.operation).toBe(OperationTypeNode.QUERY)
	})

	test('honours operationName when the document holds several operations', () => {
		const handler = createHandler()
		const query = 'query A { hello } mutation B { touch }'
		expect(prepareOk(handler, { query, operationName: 'A' }).operation).toBe(OperationTypeNode.QUERY)
		expect(prepareOk(handler, { query, operationName: 'B' }).operation).toBe(OperationTypeNode.MUTATION)
	})

	test('reads the query from the query string on GET', () => {
		const handler = createHandler()
		const result = handler.prepare(createKoaContext({ method: 'GET', url: '/?query=' + encodeURIComponent('{ hello }') }).request)
		if (!result.ok) {
			throw new Error('Expected prepare to succeed')
		}
		expect(result.prepared.operation).toBe(OperationTypeNode.QUERY)
	})

	test('passes the variables through', () => {
		const prepared = prepareOk(createHandler(), { query: 'query ($value: String) { echo(value: $value) }', variables: { value: 'hi' } })
		expect(prepared.variables).toEqual({ value: 'hi' })
	})

	test('missing query responds with 400', () => {
		const context = createKoaContext({ body: {} })
		const result = createHandler().prepare(context.request)
		if (result.ok) {
			throw new Error('Expected prepare to fail')
		}
		result.respond(context.response)
		expect(context.response.status).toBe(400)
		expect(context.response.get('Content-type')).toContain('application/json')
		expect(parseBody(context).errors).toEqual([{ message: 'Missing request query' }])
	})

	test('parse error responds with 400 and an errors body', () => {
		const context = createKoaContext({ body: { query: '{ hello' } })
		const result = createHandler().prepare(context.request)
		if (result.ok) {
			throw new Error('Expected prepare to fail')
		}
		result.respond(context.response)
		expect(context.response.status).toBe(400)
		expect(parseBody(context).errors).toHaveLength(1)
		expect(parseBody(context).errors[0].message).toContain('Syntax Error')
	})

	test('validation error responds with 400', () => {
		const context = createKoaContext({ body: { query: '{ unknownField }' } })
		const result = createHandler().prepare(context.request)
		if (result.ok) {
			throw new Error('Expected prepare to fail')
		}
		result.respond(context.response)
		expect(context.response.status).toBe(400)
		expect(parseBody(context).errors[0].message).toContain('unknownField')
	})

	test('a document with no matching operation responds with 400', () => {
		const context = createKoaContext({ body: { query: 'query A { hello }', operationName: 'B' } })
		const result = createHandler().prepare(context.request)
		if (result.ok) {
			throw new Error('Expected prepare to fail')
		}
		result.respond(context.response)
		expect(context.response.status).toBe(400)
		expect(parseBody(context).errors[0].message).toBe('Must provide an operation.')
	})

	test('serves the same document from the cache once the query is a repeat hit', () => {
		const handler = createHandler()
		const body = { query: '{ hello }' }
		const first = prepareOk(handler, body)
		const second = prepareOk(handler, body)
		const third = prepareOk(handler, body)
		// the first hit only warms the hit cache, the document itself is cached from the second one on
		expect(second.document).not.toBe(first.document)
		expect(third.document).toBe(second.document)
	})

	test('runs no listener', () => {
		const events: string[] = []
		const handler = createHandler([{
			onStart: () => void events.push('start'),
			onExecute: () => void events.push('execute'),
			onResponse: () => void events.push('response'),
			onShutdown: () => void events.push('shutdown'),
		}])
		prepareOk(handler, { query: '{ hello }' })
		expect(events).toEqual([])
	})

	test('the failure response still runs the base onShutdown listeners', () => {
		const events: string[] = []
		const handler = createHandler([{
			onStart: () => void events.push('start'),
			onExecute: () => void events.push('execute'),
			onResponse: () => void events.push('response'),
			onShutdown: () => void events.push('shutdown'),
		}])
		const context = createKoaContext({ body: { query: '{ hello' } })
		const result = handler.prepare(context.request)
		if (result.ok) {
			throw new Error('Expected prepare to fail')
		}
		result.respond(context.response)
		expect(context.response.status).toBe(400)
		expect(events).toEqual(['shutdown'])
	})
})

describe('graphql handler execute', () => {
	test('executes a prepared request', async () => {
		const handler = createHandler()
		const context = createKoaContext({ body: { query: '{ hello }' } })
		const result = handler.prepare(context.request)
		if (!result.ok) {
			throw new Error('Expected prepare to succeed')
		}
		const operations: OperationTypeNode[] = []
		await handler.execute({
			prepared: result.prepared,
			request: context.request,
			response: context.response,
			createContext: ({ operation }) => {
				operations.push(operation)
				return { marker: 'test' }
			},
		})
		expect(operations).toEqual([OperationTypeNode.QUERY])
		expect(context.response.status).toBe(200)
		expect(parseBody(context)).toEqual({ data: { hello: 'world' } })
	})

	test('applies the variables of a prepared request', async () => {
		const handler = createHandler()
		const context = createKoaContext({ body: { query: 'query ($value: String) { echo(value: $value) }', variables: { value: 'hi' } } })
		const result = handler.prepare(context.request)
		if (!result.ok) {
			throw new Error('Expected prepare to succeed')
		}
		await handler.execute({
			prepared: result.prepared,
			request: context.request,
			response: context.response,
			createContext: () => ({ marker: 'test' }),
		})
		expect(parseBody(context)).toEqual({ data: { echo: 'hi' } })
	})
})

describe('graphql handler callable form', () => {
	test('prepares and executes in one go', async () => {
		const handler = createHandler()
		const context = createKoaContext({ body: { query: 'mutation { touch }' } })
		const operations: OperationTypeNode[] = []
		await handler({
			request: context.request,
			response: context.response,
			createContext: ({ operation }) => {
				operations.push(operation)
				return { marker: 'test' }
			},
		})
		expect(operations).toEqual([OperationTypeNode.MUTATION])
		expect(context.response.status).toBe(200)
		expect(parseBody(context)).toEqual({ data: { touch: 'touched' } })
	})

	test('responds with 400 and never builds a context when the request does not parse', async () => {
		const handler = createHandler()
		const context = createKoaContext({ body: { query: '{ hello' } })
		const operations: OperationTypeNode[] = []
		await handler({
			request: context.request,
			response: context.response,
			createContext: ({ operation }) => {
				operations.push(operation)
				return { marker: 'test' }
			},
		})
		expect(operations).toEqual([])
		expect(context.response.status).toBe(400)
		expect(parseBody(context).errors).toHaveLength(1)
	})

	test('keeps the listener queue semantics', async () => {
		const events: string[] = []
		const handler = createHandler([{
			onStart: () => {
				events.push('start')
				return { onExecute: () => void events.push('start:execute') }
			},
			onExecute: () => {
				events.push('execute')
				return { onResponse: () => void events.push('execute:response') }
			},
			onResponse: () => void events.push('response'),
			onShutdown: () => void events.push('shutdown'),
		}])
		const context = createKoaContext({ body: { query: '{ hello }' } })
		await handler({
			request: context.request,
			response: context.response,
			createContext: () => ({ marker: 'test' }),
		})
		expect(events).toEqual(['start', 'execute', 'start:execute', 'response', 'execute:response', 'shutdown'])
	})
})
