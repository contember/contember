import QueryHandler from '../query/QueryHandler'
import Queryable from '../query/Queryable'
import QueryHandlerAccessor from '../query/QueryHandlerAccessor'
import KnexWrapper from './KnexWrapper'
import SelectBuilder from './SelectBuilder'

export default class DbQueryable implements Queryable<DbQueryable> {
	constructor(
		private readonly knexWrapper: KnexWrapper,
		private readonly handlerAccessor: QueryHandlerAccessor<DbQueryable>
	) {
	}

	getHandler(): QueryHandler<DbQueryable> {
		return this.handlerAccessor.get()
	}

	createSelectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result> {
		return this.knexWrapper.selectBuilder<Result>()
	}

	createWrapper(): KnexWrapper {
		return this.knexWrapper
	}
}
