import { Client, Connection } from '../client/index.js'

interface AsyncIterableX<T, TReturn = any, TNext = undefined> {
	[Symbol.asyncIterator](): AsyncIterator<T, TReturn, TNext>
}

export async function* asyncIterableTransaction<T, TReturn = any, TNext = undefined>(db: Client, cb: (db2: Client<Connection.TransactionLike>) => AsyncIterableX<T, TReturn, TNext>): AsyncIterableX<T, TReturn, TNext> {
	// eslint-disable-next-line promise/param-names
	return yield* await new Promise(async resolveOuter => {
		try {
			await db.transaction((db2: Client<Connection.TransactionLike>) => {
				// eslint-disable-next-line promise/param-names
				return new Promise<void>((resolveInner, rejectInner) => {
					resolveOuter((async function* () {
						try {
							const result = yield* cb(db2)
							resolveInner()
							return result

						} finally { // required to close the transaction when the generator is externally closed, or exceptions are thrown
							if (!db2.connection.isClosed) {
								rejectInner()
							}
						}
					})())
				})
			})

		} catch (e) {
			// suppress the error caused by rejectInner(), it was already propagated out of asyncIterableTransaction()
		}
	})
}
