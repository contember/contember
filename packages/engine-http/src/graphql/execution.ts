import { DocumentNode, execute, GraphQLError, GraphQLSchema, parse, validate, validateSchema } from 'graphql'
import LRUCache from 'lru-cache'
import { createHash } from 'crypto'
import { Request, Response } from 'koa'
import { logger } from '@contember/logger'
import { ForbiddenError } from '@contember/graphql-utils'
import { UserError } from '@contember/engine-content-api'

export interface GraphQLListener<Context> {
	onStart?: (ctx: {}) => Omit<GraphQLListener<Context>, 'onStart'> | void
	onExecute?: (ctx: {
		context: Context
		document: DocumentNode
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

export type GraphQLQueryHandler<Context> = (args: {request: Request; response: Response; context: Context }) => any

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

	return async ({ request, response, context }) => {

		const now = Date.now()
		if ((now - lastPrune) > pruneIntervalSeconds * 1000) {
			documentCache.prune()
			lastPrune = now
		}
		const listenersQueue = [...listeners]

		listenersQueue.forEach(it => {
			it.onStart && listenersQueue.push(it.onStart({}) || {})
		})

		const respond = (code: number, data: any) => {
			response.status = code
			response.body = JSON.stringify(data)
			response.set('Content-type', 'application/json')

			listenersQueue.forEach(it => {
				it.onShutdown && listenersQueue.push(it.onShutdown({ response: data }) || {})
			})
		}
		try {
			if (!schemaValidated) {
				const validationResult = validateSchema(schema)
				if (validationResult.length) {
					return respond(400, {
						errors: validationResult,
					})
				}
				schemaValidated = true
			}
			const resolvedRequest = request.method === 'POST' ? (request.body as any) : request.query
			if (!resolvedRequest.query) {
				return respond(400, {
					errors: [{ message: 'Missing request query' }],
				})
			}
			const queryHash = createHash('md5').update(resolvedRequest.query).digest('hex')
			let doc = documentCache.get(queryHash)
			if (!doc) {
				try {
					doc = parse(resolvedRequest.query)
					const validationResult = validate(schema, doc)
					if (validationResult.length) {
						return respond(400, { errors: validationResult })
					}
					if (hitCache.get(queryHash)) {
						documentCache.set(queryHash, doc)
					}
					hitCache.set(queryHash, true)
				} catch (e) {
					if (e instanceof GraphQLError) {
						return respond(400, { errors: [e] })
					}
					throw e
				}
			}
			const document = doc

			listenersQueue.forEach(it => {
				it.onExecute && listenersQueue.push(it.onExecute({ context, document }) || {})
			})
			const response = await execute({
				schema,
				document,
				variableValues: resolvedRequest.variables,
				contextValue: context,
			})
			listenersQueue.forEach(it => {
				it.onResponse && listenersQueue.push(it.onResponse({ context, response }) || {})
			})
			if (response.errors && response.errors.length > 0) {
				const errors = processErrors(response.errors)
				respond(200, { ...response, errors })
			} else {
				respond(200, response)
			}
		} catch (e) {
			if (e instanceof GraphQLError) {
				return respond(400, { errors: [e] })
			}
			return respond(500, { errors: [{ message: 'Internal error' }] })
		}
	}
}


const extractOriginalError = (e: Error): Error => {
	if (e instanceof GraphQLError && e.originalError) {
		return extractOriginalError(e.originalError)
	}
	if ('errors' in e && Array.isArray((e as any).errors) && (e as any).errors.length === 1) {
		return extractOriginalError((e as any).errors[0])
	}
	return e
}

const processErrors = (errors: readonly any[]): any[] => {
	const resultErrors = []
	for (const error of errors) {
		const originalError = extractOriginalError(error)
		if (originalError instanceof GraphQLError) {
			resultErrors.push(error)
		} else if (originalError instanceof ForbiddenError) {
			resultErrors.push(error)
		} else if (originalError instanceof UserError) {
			resultErrors.push({ message: error.message, locations: error.locations, path: error.path })
		} else {
			logger.error(originalError || error)
			resultErrors.push({ message: 'Internal server error', locations: undefined, path: undefined })
		}
	}
	return resultErrors
}

