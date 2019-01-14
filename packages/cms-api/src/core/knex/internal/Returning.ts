import * as Knex from 'knex'
import { Value } from '../types'
import { QueryResult } from 'pg'
import QueryBuilder from '../QueryBuilder'

class Returning {
	constructor(private readonly column: QueryBuilder.ColumnIdentifier | Knex.Raw | null = null) {}

	public modifyQuery(sql: string, bindings: Value[]): [string, Value[]] {
		if (this.column) {
			const column = Array.isArray(this.column) ? QueryBuilder.toFqn(this.column) : this.column
			return [sql + ' returning ??', [...bindings, column]]
		}
		return [sql, bindings]
	}

	public parseResponse<ProcessedResult extends number | Returning.Result[]>(result: QueryResult): ProcessedResult {
		const returningColumn = this.column
		if (returningColumn) {
			return (typeof returningColumn === 'string'
				? result.rows.map(it => it[returningColumn])
				: result) as ProcessedResult
		} else {
			return result.rowCount as ProcessedResult
		}
	}
}

namespace Returning {
	export interface Aware {
		returning(column: QueryBuilder.ColumnIdentifier | Knex.Raw): any
	}

	export type Result = number | string
}

export default Returning
