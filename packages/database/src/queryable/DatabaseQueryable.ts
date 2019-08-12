import { Queryable, QueryHandler, QueryHandlerAccessor } from '@contember/queryable'
import { Client, SelectBuilder } from '../'

export class DatabaseQueryable implements Queryable<DatabaseQueryable> {
	constructor(
		public readonly wrapper: Client,
		private readonly handlerAccessor: QueryHandlerAccessor<DatabaseQueryable>,
	) {}

	getHandler(): QueryHandler<DatabaseQueryable> {
		return this.handlerAccessor.get()
	}

	createSelectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result> {
		return this.wrapper.selectBuilder<Result>()
	}

	createWrapper(): Client {
		return this.wrapper
	}
}
