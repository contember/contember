import { Client, EventManager } from '@contember/database'
import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-core'

type Query = { sql: string; bindings: any; elapsed?: number; error?: string; meta?: any; rowCount?: number }

export default class DbQueriesPlugin<Ctx extends Record<string, any>> implements ApolloServerPlugin<Ctx> {
	constructor(private readonly dbResolver: (context: Ctx) => Client) {}

	requestDidStart({ context }: GraphQLRequestContext<Ctx>): GraphQLRequestListener<Ctx> {
		const db = this.dbResolver(context)
		if (!db) {
			return {}
		}
		const queries: Query[] = []
		const listener: EventManager.QueryEndCallback = ({ sql, parameters, meta }, { timing, rowCount }) =>
			queries.push({ sql, bindings: parameters, elapsed: timing ? timing.selfDuration : 0, meta, rowCount })
		const errorListener: EventManager.QueryErrorCallback = ({ sql, parameters, meta }, error) =>
			queries.push({
				sql,
				bindings: parameters,
				meta,
				error: 'message' in error ? error.message : 'unknown error',
			})
		db.eventManager.on(EventManager.Event.queryEnd, listener)
		db.eventManager.on(EventManager.Event.queryError, errorListener)
		return {
			willSendResponse: ({ response, context }) => {
				const db = this.dbResolver(context)
				if (!db) {
					return
				}
				db.eventManager.removeListener(EventManager.Event.queryEnd, listener)
				db.eventManager.removeListener(EventManager.Event.queryError, errorListener)
				const extensions = response.extensions || (response.extensions = {})
				extensions.dbQueries = queries.map(it => ({
					...it,
					path: (it.meta && it.meta.path) || [],
				}))
			},
		}
	}
}
