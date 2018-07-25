import QueryHandler from './QueryHandler'

export default interface Queryable {
  getHandler(): QueryHandler<Queryable>
}
