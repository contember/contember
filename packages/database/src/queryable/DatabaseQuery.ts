import { Query } from '@contember/queryable'
import { DatabaseQueryable } from '../'
import { ImplementationException } from '../exceptions'

export abstract class DatabaseQuery<T> implements Query<DatabaseQueryable, T> {
	abstract fetch(queryable: DatabaseQueryable): Promise<T>

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
