import { GraphQLExtension } from 'graphql-extensions'
import { Client, EventManager } from '@contember/database'

type Query = { sql: string; bindings: any; elapsed: number; error?: string; meta?: any }

export default class DbQueriesExtension extends GraphQLExtension<{ db: Client }> {
	private readonly queries: Query[] = []

	private listener: EventManager.QueryEndCallback = ({ sql, parameters, meta }, { timing }) =>
		this.queries.push({ sql, bindings: parameters, elapsed: timing ? timing.selfDuration : 0, meta })

	requestDidStart({ context: { db } }: { context: { db: Client } }): void {
		db.eventManager.on(EventManager.Event.queryEnd, this.listener)
	}

	willSendResponse({ context: { db } }: { context: { db: Client } }): void {
		db.eventManager.removeListener(EventManager.Event.queryEnd, this.listener)
	}

	format(): [string, any] | undefined {
		return [
			'dbQueries',
			this.queries.map(it => ({
				...it,
				path: (it.meta && it.meta.path) || [],
			})),
		]
	}
}
