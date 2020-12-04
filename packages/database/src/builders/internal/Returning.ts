import { QueryBuilder } from '../'
import { Literal } from '../../Literal'
import { Connection } from '../../client'
import { toFqnWrap } from '../utils'

class Returning {
	constructor(private readonly columns: (QueryBuilder.ColumnIdentifier | Literal)[] = []) {}

	public compile(): Literal {
		if (this.columns.length === 0) {
			return new Literal('')
		}
		const columns = this.columns.map(it => (it instanceof Literal ? it : new Literal(toFqnWrap(it))))
		return new Literal(' returning ').appendAll(columns, ', ')
	}

	public parseResponse<ProcessedResult extends number | Returning.Result[]>(
		result: Connection.Result,
	): ProcessedResult {
		if (this.columns.length === 0) {
			return result.rowCount as ProcessedResult
		}
		return result.rows as ProcessedResult
	}
}

namespace Returning {
	export interface Aware {
		returning(...columns: ReturningColumn[]): any
	}
	export type Result = Record<string, any>
	export type ReturningColumn = QueryBuilder.ColumnIdentifier | Literal
}

export { Returning }
