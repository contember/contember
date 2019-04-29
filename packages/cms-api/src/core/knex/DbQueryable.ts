import QueryHandler from '../query/QueryHandler'
import Queryable from '../query/Queryable'
import QueryHandlerAccessor from '../query/QueryHandlerAccessor'
import KnexWrapper from './KnexWrapper'
import SelectBuilder from './SelectBuilder'

export default class DbQueryable implements Queryable<DbQueryable> {
	constructor(
		public readonly wrapper: KnexWrapper,
		private readonly handlerAccessor: QueryHandlerAccessor<DbQueryable>
	) {
	}

	getHandler(): QueryHandler<DbQueryable> {
		return this.handlerAccessor.get()
	}

	createSelectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result> {
		return this.wrapper.selectBuilder<Result>()
	}

	createWrapper(): KnexWrapper {
		return this.wrapper
	}
}
