import { Queryable } from './'

export interface Query<Q extends Queryable<Q>, R> {
	fetch(queryable: Q): Promise<R>
}
