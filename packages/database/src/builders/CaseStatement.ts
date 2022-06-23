import { QueryBuilder } from './QueryBuilder.js'
import { Literal } from '../Literal.js'
import { columnExpressionToLiteral } from './utils.js'

class CaseStatement {
	constructor(private readonly options: CaseStatement.Options) {}

	public static createEmpty(): CaseStatement {
		return new CaseStatement({ whenClauses: [], elseClause: undefined })
	}

	public when(when: QueryBuilder.ColumnExpression, then: QueryBuilder.ColumnExpression): CaseStatement {
		return new CaseStatement({
			...this.options,
			whenClauses: [
				...this.options.whenClauses,
				{
					when: columnExpressionToLiteral(when) || new Literal('null'),
					then: columnExpressionToLiteral(then) || new Literal('null'),
				},
			],
		})
	}

	public else(elseClause: QueryBuilder.ColumnExpression): CaseStatement {
		return new CaseStatement({
			...this.options,
			elseClause: columnExpressionToLiteral(elseClause) || new Literal('null'),
		})
	}

	compile(): Literal {
		let sql = 'case '
		const bindings: any[] = []
		for (const { when, then } of this.options.whenClauses) {
			sql += 'when ' + when.sql + ' then ' + then.sql + ' '
			bindings.push(...when.parameters, ...then.parameters)
		}
		if (this.options.elseClause) {
			sql += 'else ' + this.options.elseClause.sql + ' '
			bindings.push(...this.options.elseClause.parameters)
		}
		sql += 'end'
		return new Literal(sql, bindings)
	}
}

namespace CaseStatement {
	export interface Options {
		whenClauses: { when: Literal; then: Literal }[]
		elseClause: Literal | undefined
	}
}

export { CaseStatement }
