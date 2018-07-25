import QueryHandler from './QueryHandler'

export default interface Queryable<Q extends Queryable<Q>> {
  getHandler(): QueryHandler<Q>
}
