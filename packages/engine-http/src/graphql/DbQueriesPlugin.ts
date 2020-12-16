import { Client, EventManager } from '@contember/database'
import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-core'

type Query = { sql: string; bindings: any; elapsed: number; error?: string; meta?: any }

type Context = { db?: Client }
export default class DbQueriesPlugin implements ApolloServerPlugin<Context> {
	constructor(private readonly dbResolver: (context: Record<string, any>) => Client) {}

	requestDidStart({ context }: GraphQLRequestContext): GraphQLRequestListener<Context> {
		const db = this.dbResolver(context)
		if (!db) {
			return {}
		}
		const queries: Query[] = []
		const listener: EventManager.QueryEndCallback = ({ sql, parameters, meta }, { timing }) =>
			queries.push({ sql, bindings: parameters, elapsed: timing ? timing.selfDuration : 0, meta })
		db.eventManager.on(EventManager.Event.queryEnd, listener)
		return {
			willSendResponse: ({ response, context }) => {
				const db = this.dbResolver(context)
				if (!db) {
					return
				}
				db.eventManager.removeListener(EventManager.Event.queryEnd, listener)
				const extensions = response.extensions || (response.extensions = {})
				extensions.dbQueries = queries.map(it => ({
					...it,
					path: (it.meta && it.meta.path) || [],
				}))
			},
		}
	}
}
