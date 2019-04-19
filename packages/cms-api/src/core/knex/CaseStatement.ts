import KnexWrapper from './KnexWrapper'
import QueryBuilder from './QueryBuilder'
import Literal from './Literal'

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
					when: QueryBuilder.columnExpressionToLiteral(this.wrapper, when) || new Literal('null'),
					then: QueryBuilder.columnExpressionToLiteral(this.wrapper, then) || new Literal('null'),
				},
			],
		})
	}

	public else(elseClause: QueryBuilder.ColumnExpression): CaseStatement {
		return new CaseStatement(this.wrapper, {
			...this.options,
			elseClause: QueryBuilder.columnExpressionToLiteral(this.wrapper, elseClause) || new Literal('null'),
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

export default CaseStatement
