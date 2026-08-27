import {
	DocumentNode,
	execute,
	GraphQLError,
	GraphQLSchema,
	Kind,
	OperationDefinitionNode,
	OperationTypeNode,
	parse,
	validate,
	validateSchema,
} from 'graphql'
import { LRUCache } from 'lru-cache'
import { createHash } from 'node:crypto'
import { Request, Response } from 'koa'
import { logger } from '@contember/logger'
import { ForbiddenError } from '@contember/graphql-utils'
import { UserError } from '@contember/engine-content-api'

export interface GraphQLListener<Context> {
	onStart?: (ctx: {}) => Omit<GraphQLListener<Context>, 'onStart'> | void
	onExecute?: (ctx: {
		context: Context
		document: DocumentNode
		operation: OperationTypeNode
	}) => Omit<GraphQLListener<Context>, 'onStart' | 'onExecute'> | void
	onResponse?: (ctx: {
		response: any
		context: Context
	}) => Omit<GraphQLListener<Context>, 'onStart' | 'onExecute' | 'onResponse'> | void
	onShutdown?: (ctx: {
		response: any
	}) => Omit<GraphQLListener<Context>, 'onStart' | 'onExecute' | 'onResponse' | 'onShutdown'> | void
}

interface FactoryArgs<Context> {
	schema: GraphQLSchema
	listeners: GraphQLListener<Context>[]
}

/** Outcome of parsing a GraphQL request, before any context or database connection exists. */
export interface PreparedGraphQLRequest {
	readonly document: DocumentNode
	readonly operation: OperationTypeNode
	readonly operationName: string | null
	/** Unvalidated: on GET this is the raw query-string value, not necessarily an object. */
	readonly variables: unknown
}

export type PrepareResult<Context> =
	| { ok: true; prepared: PreparedGraphQLRequest }
	| { ok: false; respond: (response: Response) => void }

export type GraphQLQueryHandlerArgs<Context> = {
	request: Request
	response: Response
	createContext: (ctx: { operation: OperationTypeNode }) => Context
}

export type GraphQLQueryHandler<Context> =
	& ((args: GraphQLQueryHandlerArgs<Context>) => Promise<void>)
	& {
		/** Parses and validates the request so the caller can route by operation type before executing. */
		prepare(request: Request): PrepareResult<Context>
		execute(args: GraphQLQueryHandlerArgs<Context> & { prepared: PreparedGraphQLRequest }): Promise<void>
	}

const hitCacheMaxAgeSeconds = 10 * 60
const documentCacheMaxAgeSeconds = hitCacheMaxAgeSeconds * 10
const pruneIntervalSeconds = documentCacheMaxAgeSeconds / 2
const documentCacheMax = 100
const hitCacheMax = documentCacheMax * 2

export const createGraphQLQueryHandler = <Context>({
	schema,
	listeners,
}: FactoryArgs<Context>): GraphQLQueryHandler<Context> => {
	let schemaValidated = false
	const hitCache = new LRUCache<string, true>({
		max: hitCacheMax,
		ttl: hitCacheMaxAgeSeconds * 1000,
	})
	const documentCache = new LRUCache<string, DocumentNode>({
		max: documentCacheMax,
		ttl: documentCacheMaxAgeSeconds * 1000,
	})
	let lastPrune = Date.now()

	const sendResponse = (response: Response, listenersQueue: GraphQLListener<Context>[], code: number, data: unknown) => {
		response.status = code
		response.body = JSON.stringify(data)
		response.set('Content-type', 'application/json')

		listenersQueue.forEach(it => {
			it.onShutdown && listenersQueue.push(it.onShutdown({ response: data }) || {})
		})
	}

	const prepare = (request: Request): PrepareResult<Context> => {
		const now = Date.now()
		if ((now - lastPrune) > pruneIntervalSeconds * 1000) {
			documentCache.purgeStale()
			lastPrune = now
		}
		// a fresh queue is enough here: onStart runs in execute, so nothing has been appended yet
		const fail = (code: number, data: unknown): PrepareResult<Context> => ({
			ok: false,
			respond: response => sendResponse(response, [...listeners], code, data),
		})
		try {
			if (!schemaValidated) {
				const validationResult = validateSchema(schema)
				if (validationResult.length) {
					return fail(400, {
						errors: validationResult,
					})
				}
				schemaValidated = true
			}
			const resolvedRequest = request.method === 'POST' ? (request.body as any) : request.query
			if (!resolvedRequest.query) {
				return fail(400, {
					errors: [{ message: 'Missing request query' }],
				})
			}
			const queryHash = createHash('md5').update(resolvedRequest.query).digest('hex')
			let doc = documentCache.get(queryHash)
			if (!doc) {
				doc = parse(resolvedRequest.query)
				const validationResult = validate(schema, doc)
				if (validationResult.length) {
					return fail(400, { errors: validationResult })
				}
				if (hitCache.get(queryHash)) {
					documentCache.set(queryHash, doc)
				}
				hitCache.set(queryHash, true)
			}
			const document = doc
			const operationName = resolvedRequest.operationName ?? null
			const operation = resolveOperationType(document, operationName)

			return {
				ok: true,
				prepared: { document, operation, operationName, variables: resolvedRequest.variables },
			}
		} catch (e) {
			if (e instanceof GraphQLError) {
				return fail(e instanceof ForbiddenError ? 403 : 400, { errors: [e] })
			}
			logger.error(e)
			return fail(500, { errors: [{ message: 'Internal error' }] })
		}
	}

	const executePrepared = async (
		{ prepared, response, createContext }: GraphQLQueryHandlerArgs<Context> & { prepared: PreparedGraphQLRequest },
	): Promise<void> => {
		const listenersQueue = [...listeners]

		listenersQueue.forEach(it => {
			it.onStart && listenersQueue.push(it.onStart({}) || {})
		})

		const respond = (code: number, data: unknown) => sendResponse(response, listenersQueue, code, data)
		try {
			const { document, operation, operationName, variables } = prepared
			const context = createContext({ operation })
			listenersQueue.forEach(it => {
				it.onExecute && listenersQueue.push(it.onExecute({ context, document, operation }) || {})
			})
			const result = await execute({
				schema,
				document,
				operationName: operationName,
				// graphql-js wants a variable map; on GET the raw query-string value is not one
				variableValues: typeof variables === 'object' && variables !== null ? { ...variables } : undefined,
				contextValue: context,
			})
			listenersQueue.forEach(it => {
				it.onResponse && listenersQueue.push(it.onResponse({ context, response: result }) || {})
			})
			if (result.errors && result.errors.length > 0) {
				const [code, errors] = processErrors(result.errors)
				respond(code && !result.data ? code : 200, { ...result, errors })
			} else {
				respond(200, result)
			}
		} catch (e) {
			if (e instanceof GraphQLError) {
				return respond(e instanceof ForbiddenError ? 403 : 400, { errors: [e] })
			}
			logger.error(e)
			return respond(500, { errors: [{ message: 'Internal error' }] })
		}
	}

	const handler = async (args: GraphQLQueryHandlerArgs<Context>): Promise<void> => {
		const prepareResult = prepare(args.request)
		if (!prepareResult.ok) {
			return prepareResult.respond(args.response)
		}
		return await executePrepared({ ...args, prepared: prepareResult.prepared })
	}

	return Object.assign(handler, { prepare, execute: executePrepared })
}

export const extractOriginalError = (e: Error): Error => {
	if (e instanceof GraphQLError && e.originalError) {
		return extractOriginalError(e.originalError)
	}
	if ('errors' in e && Array.isArray((e as any).errors) && (e as any).errors.length === 1) {
		return extractOriginalError((e as any).errors[0])
	}
	return e
}

const processErrors = (errors: readonly any[]): [number | null, any[]] => {
	const resultErrors = []
	let has400 = false
	let has403 = false
	let has500 = false
	for (const error of errors) {
		const originalError = extractOriginalError(error)
		if (originalError instanceof GraphQLError) {
			resultErrors.push(error)
			has400 = true
		} else if (originalError instanceof ForbiddenError) {
			resultErrors.push(error)
			has403 = true
		} else if (originalError instanceof UserError) {
			resultErrors.push({ message: error.message, locations: error.locations, path: error.path })
			has400 = true
		} else {
			logger.error(originalError || error)
			resultErrors.push({ message: 'Internal server error', locations: undefined, path: undefined })
			has500 = true
		}
	}
	return [has500 ? 500 : has400 ? 400 : has403 ? 403 : null, resultErrors]
}

const resolveOperationType = (document: DocumentNode, operationName: string | null): OperationTypeNode => {
	for (const definition of document.definitions) {
		if (definition.kind === Kind.OPERATION_DEFINITION) {
			if (operationName === null || definition.name?.value === operationName) {
				return definition.operation
			}
		}
	}
	throw new GraphQLError('Must provide an operation.')
}
