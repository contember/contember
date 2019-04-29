import Query from '../query/Query'
import DbQueryable from './DbQueryable'
import ImplementationException from '../exceptions/ImplementationException'

export default abstract class DbQuery<T> implements Query<DbQueryable, T> {
	abstract async fetch(queryable: DbQueryable): Promise<T>

	protected fetchOneOrNull<R>(rows: Array<R>): R | null {
		if (rows.length === 0) {
			return null
		}

		if (rows.length > 1) {
			throw new ImplementationException()
		}

		return rows[0]
	}
}
