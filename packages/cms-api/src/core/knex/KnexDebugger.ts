import * as Knex from 'knex'

type Query = {
	__knexQueryUid: string
	sql: string
	bindings: any
}

class KnexDebugger {
	private queries: { [uuid: string]: Query & { startTime: Date } } = {}

	public register(knex: Knex) {
		knex
			.on('query', (query: Query) => {
				const uid = query.__knexQueryUid
				this.queries[uid] = {
					...query,
					startTime: new Date(),
				}
			})
			.on('query-response', (response: any, query: Query) => {
				const uid = query.__knexQueryUid
				const q = this.queries[uid]
				if (!q) {
					return
				}
				console.log(query.sql)
				console.log(JSON.stringify(query.bindings))
				console.log('Elapsed time: ' + (new Date().getTime() - q.startTime.getTime()) + ' ms')
				delete this.queries[uid]
			})
			.on('query-error', (error: any, query: Query) => {
				const uid = query.__knexQueryUid
				delete this.queries[uid]
				console.log('Query failed:')
				console.log(error)
				console.log(query.sql)
				console.log(JSON.stringify(query.bindings))
			})
	}
}

export default KnexDebugger
