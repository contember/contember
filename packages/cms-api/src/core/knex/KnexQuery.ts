import Query from '../query/Query'
import KnexQueryable from './KnexQueryable'
import ImplementationException from '../exceptions/ImplementationException'

export default abstract class KnexQuery<T> implements Query<KnexQueryable, T> {
	abstract async fetch(queryable: KnexQueryable): Promise<T>

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
