import { Queryable, QueryHandler, QueryHandlerAccessor } from '@contember/queryable'
import { Client, SelectBuilder } from '..//index.js'

export class DatabaseQueryable implements Queryable<DatabaseQueryable> {
	constructor(public readonly db: Client, private readonly handlerAccessor: QueryHandlerAccessor<DatabaseQueryable>) {}

	getHandler(): QueryHandler<DatabaseQueryable> {
		return this.handlerAccessor.get()
	}
}
