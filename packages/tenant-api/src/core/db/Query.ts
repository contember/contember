import Queryable from './Queryable'

export default interface Query<Q extends Queryable, R> {
  fetch(queryable: Q): Promise<R>
}
