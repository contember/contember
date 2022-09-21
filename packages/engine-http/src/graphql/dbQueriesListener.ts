import { Client, EventManager } from '@contember/database'
import { GraphQLListener } from './execution'

type Query = { sql: string; bindings: any; elapsed?: number; error?: string; meta?: any; rowCount?: number }

export const createDbQueriesListener = <Context extends { requestDebug: boolean } | {}>(dbResolver: (state: Context) => Client, globalDebug: boolean): GraphQLListener<Context> => ({
	onExecute: ({ context }) => {
		if (!globalDebug && !(context as any).requestDebug) {
			return
		}
		const db = dbResolver(context)
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
			onResponse: ({ response }) => {
				db.eventManager.removeListener(EventManager.Event.queryEnd, listener)
				db.eventManager.removeListener(EventManager.Event.queryError, errorListener)
				const extensions = response.extensions || (response.extensions = {})
				extensions.dbQueries = queries.map(it => ({
					...it,
					path: (it.meta && it.meta.path) || [],
				}))
			},
		}
	},
})
