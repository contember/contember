import { Queryable } from './/index.js'

export interface Query<Q extends Queryable<Q>, R> {
	fetch(queryable: Q): Promise<R>
}
