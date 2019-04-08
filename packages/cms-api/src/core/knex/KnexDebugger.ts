import * as Knex from 'knex'

type Query = {
	__knexQueryUid: string
	sql: string
	bindings: any
	options: Record<string, any>
}

type Meta = { startTime: Date; elapsed?: number; error?: string }
type Subscriber = (query: Query & Meta & { elapsed: number }) => void

class KnexDebugger {
	private _queries: { [uuid: string]: Query & Meta } = {}

	private subscribers: (Subscriber)[] = []

	get queries() {
		return this._queries
	}

	public subscribe(subscriber: Subscriber): void {
		this.subscribers.push(subscriber)
	}

	public register(knex: Knex) {
		knex
			.on('query', (query: Query) => {
				const uid = query.__knexQueryUid
				this._queries[uid] = {
					...query,
					startTime: new Date(),
				}
			})
			.on('query-response', (response: any, query: Query) => {
				const uid = query.__knexQueryUid
				const q = this._queries[uid]
				if (!q) {
					return
				}
				delete this._queries[uid]
				const q2 = {
					...q,
					elapsed: new Date().getTime() - q.startTime.getTime(),
				}
				this.subscribers.forEach(s => s(q2))
				// console.log(query.sql)
				// console.log(query.bindings)
			})
			.on('query-error', (error: any, query: Query) => {
				const uid = query.__knexQueryUid
				const q = this._queries[uid]
				if (!q) {
					return
				}
				delete this._queries[uid]
				const q2 = {
					...q,
					error,
					elapsed: new Date().getTime() - q.startTime.getTime(),
				}
				this.subscribers.forEach(s => s(q2))
			})
	}
}

export default KnexDebugger
