import { DocumentNode, execute, GraphQLError, GraphQLSchema, parse, validate, validateSchema } from 'graphql'
import { KoaContext } from '../koa'
import LRUCache from 'lru-cache'

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

interface FactoryArgs<Context, KoaState> {
	schema: GraphQLSchema
	contextFactory: (ctx: KoaContext<KoaState>) => Context | Promise<Context>
	listeners: GraphQLListener<Context>[]
}

export type GraphQLQueryHandler<KoaState> = (context: KoaContext<KoaState>) => any

export const createGraphQLQueryHandler = <Context, KoaState>({
	schema,
	contextFactory,
	listeners,
}: FactoryArgs<Context, KoaState>): GraphQLQueryHandler<KoaState> => {
	let schemaValidated = false
	const documentCache = new LRUCache<string, DocumentNode>()
	return async ctx => {
		const listenersQueue = listeners

		listenersQueue.forEach(it => {
			it.onStart && listenersQueue.push(it.onStart({}) || {})
		})

		const respond = (code: number, data: any) => {
			ctx.status = code
			ctx.body = JSON.stringify(data)
			ctx.set('Content-type', 'application/json')

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
			const request = ctx.method === 'POST' ? (ctx.request.body as any) : ctx.query
			if (!request.query) {
				return respond(400, {
					errors: { message: 'Missing request query' },
				})
			}
			let doc = documentCache.get(request.query)
			if (!doc) {
				try {
					doc = parse(request.query)
					const validationResult = validate(schema, doc)
					if (validationResult.length) {
						return respond(400, { errors: validationResult })
					}
					documentCache.set(request.query, doc)
				} catch (e) {
					if (e instanceof GraphQLError) {
						return respond(400, { errors: [e] })
					}
					throw e
				}
			}
			const document = doc

			const context = await contextFactory(ctx)
			listenersQueue.forEach(it => {
				it.onExecute && listenersQueue.push(it.onExecute({ context, document }) || {})
			})
			const response = await execute({
				schema,
				document,
				variableValues: request.variables,
				contextValue: context,
			})
			listenersQueue.forEach(it => {
				it.onResponse && listenersQueue.push(it.onResponse({ context, response }) || {})
			})
			respond(200, response)
		} catch (e) {
			if (e instanceof GraphQLError) {
				return respond(400, { errors: [e] })
			}
			return respond(500, { errors: [{ message: 'Internal error' }] })
		}
	}
}
