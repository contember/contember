import QueryHandler from './QueryHandler'
import Queryable from './Queryable'

export default interface QueryHandlerAccessor<Q extends Queryable<Q>> {
  get(): QueryHandler<Q>
}
