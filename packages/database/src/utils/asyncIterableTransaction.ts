import { Client, Connection } from '../client/index.js'

interface AsyncIterableX<T, TReturn = any, TNext = undefined> {
	[Symbol.asyncIterator](): AsyncIterator<T, TReturn, TNext>
}

export async function* asyncIterableTransaction<T, TReturn = any, TNext = undefined>(db: Client, cb: (db2: Client<Connection.TransactionLike>) => AsyncIterableX<T, TReturn, TNext>): AsyncIterableX<T, TReturn, TNext> {
	// eslint-disable-next-line promise/param-names
	return yield* await new Promise(async resolveOuter => {
		await db.transaction((db2: Client<Connection.TransactionLike>) => {
			// eslint-disable-next-line promise/param-names
			return new Promise<void>(resolveInner => {
				resolveOuter((async function* () {
					const result = yield* cb(db2)
					resolveInner()
					return result
				})())
			})
		})
	})
}
