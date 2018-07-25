import Queryable from './Queryable'

export default interface Query<Q extends Queryable<Q>, R> {
  fetch(queryable: Q): Promise<R>
}
