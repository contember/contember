import * as Knex from 'knex'
import { Value } from '../types'
import { QueryResult } from 'pg'

class Returning {
	constructor(private readonly column: string | Knex.Raw | null = null) {}

	public modifyQuery(sql: string, bindings: Value[]): [string, Value[]] {
		if (this.column) {
			return [sql + ' returning ??', [...bindings, this.column]]
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
		returning(column: string | Knex.Raw): any
	}

	export type Result = number | string
}

export default Returning
