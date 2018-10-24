import * as Knex from 'knex'
import KnexWrapper from './KnexWrapper'

export default class KnexConnection {
	constructor(public readonly knex: Knex, private readonly schema: string) {}

	async transaction<T>(transactionScope: (trx: KnexConnection) => Promise<T> | void): Promise<T> {
		return await this.knex.transaction(trx => transactionScope(new KnexConnection(trx, this.schema)))
	}

	queryBuilder(): Knex.QueryBuilder {
		return this.knex.queryBuilder()
	}

	raw(sql: string): Knex.Raw {
		return this.knex.raw(sql)
	}

	wrapper(): KnexWrapper {
		return new KnexWrapper(this.knex, this.schema)
	}
}
