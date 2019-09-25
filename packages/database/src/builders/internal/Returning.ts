import { QueryBuilder } from '../'
import { Literal } from '../../Literal'
import { Connection } from '../../client'
import { toFqnWrap } from '../utils'

class Returning {
	constructor(private readonly column: QueryBuilder.ColumnIdentifier | Literal | null = null) {}

	public compile(): Literal {
		if (this.column === null) {
			return new Literal('')
		}
		if (this.column instanceof Literal) {
			return new Literal(' returning ').append(this.column)
		}
		return new Literal(' returning ' + toFqnWrap(this.column))
	}

	public parseResponse<ProcessedResult extends number | Returning.Result[]>(
		result: Connection.Result,
	): ProcessedResult {
		const returningColumn = this.column
		if (returningColumn) {
			return (typeof returningColumn === 'string'
				? result.rows.map(it => it[returningColumn])
				: result.rows) as ProcessedResult
		} else {
			return result.rowCount as ProcessedResult
		}
	}
}

namespace Returning {
	export interface Aware {
		returning(column: QueryBuilder.ColumnIdentifier | Literal): any
	}

	export type Result = number | string
}

export { Returning }
