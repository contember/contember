import { Client, EventManager } from '@contember/database'
import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-core'

type Query = { sql: string; bindings: any; elapsed: number; error?: string; meta?: any }

type Context = { db?: Client }
export default class DbQueriesPlugin implements ApolloServerPlugin<Context> {
	private readonly queries: Query[] = []

	private listener: EventManager.QueryEndCallback = ({ sql, parameters, meta }, { timing }) =>
		this.queries.push({ sql, bindings: parameters, elapsed: timing ? timing.selfDuration : 0, meta })

	requestDidStart({ context: { db } }: GraphQLRequestContext<Context>): GraphQLRequestListener<Context> {
		if (!db) {
			return {}
		}
		db.eventManager.on(EventManager.Event.queryEnd, this.listener)
		return {
			willSendResponse: ({ response, context: { db } }) => {
				if (!db) {
					return
				}
				db.eventManager.removeListener(EventManager.Event.queryEnd, this.listener)
				const extensions = response.extensions || (response.extensions = {})
				extensions.dbQueries = this.queries.map(it => ({
					...it,
					path: (it.meta && it.meta.path) || [],
				}))
			},
		}
	}
}
