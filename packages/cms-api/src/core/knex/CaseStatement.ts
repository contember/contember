import * as Knex from 'knex'
import KnexWrapper from './KnexWrapper'
import QueryBuilder from './QueryBuilder'

class CaseStatement {
	constructor(private readonly wrapper: KnexWrapper, private readonly options: CaseStatement.Options) {}

	public static createEmpty(wrapper: KnexWrapper): CaseStatement {
		return new CaseStatement(wrapper, { whenClauses: [], elseClause: undefined })
	}

	public when(when: QueryBuilder.ColumnExpression, then: QueryBuilder.ColumnExpression): CaseStatement {
		return new CaseStatement(this.wrapper, {
			...this.options,
			whenClauses: [
				...this.options.whenClauses,
				{
					when: QueryBuilder.columnExpressionToRaw(this.wrapper, when) || this.wrapper.raw('null'),
					then: QueryBuilder.columnExpressionToRaw(this.wrapper, then) || this.wrapper.raw('null'),
				},
			],
		})
	}

	public else(elseClause: QueryBuilder.ColumnExpression): CaseStatement {
		return new CaseStatement(this.wrapper, {
			...this.options,
			elseClause: QueryBuilder.columnExpressionToRaw(this.wrapper, elseClause) || this.wrapper.raw('null'),
		})
	}

	createExpression(): Knex.Raw {
		const sql =
			'case ' +
			this.options.whenClauses.map(() => 'when ?? then ?? ') +
			(this.options.elseClause ? 'else ?? ' : '') +
			'end'
		const bindings: Knex.Raw[] = []
		this.options.whenClauses.forEach(({ when, then }) => bindings.push(when, then))
		if (this.options.elseClause) {
			bindings.push(this.options.elseClause)
		}

		return this.wrapper.raw(sql, ...bindings)
	}
}

namespace CaseStatement {
	export interface Options {
		whenClauses: { when: Knex.Raw; then: Knex.Raw }[]
		elseClause: Knex.Raw | undefined
	}
}

export default CaseStatement
