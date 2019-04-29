import QueryHandler from '../query/QueryHandler'
import Queryable from '../query/Queryable'
import QueryHandlerAccessor from '../query/QueryHandlerAccessor'
import Client from './Client'
import SelectBuilder from './SelectBuilder'

export default class DbQueryable implements Queryable<DbQueryable> {
	constructor(public readonly wrapper: Client, private readonly handlerAccessor: QueryHandlerAccessor<DbQueryable>) {}

	getHandler(): QueryHandler<DbQueryable> {
		return this.handlerAccessor.get()
	}

	createSelectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result> {
		return this.wrapper.selectBuilder<Result>()
	}

	createWrapper(): Client {
		return this.wrapper
	}
}
