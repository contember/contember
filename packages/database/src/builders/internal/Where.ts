import { wrapIdentifier } from '../../utils'
import { Literal } from '../../Literal'
import { ConditionBuilder, ConditionCallback } from '../ConditionBuilder'
import { Value } from '../../types'

namespace Where {
	export interface Options {
		where: Statement
	}

	export class Statement {
		constructor(public readonly values: (Literal | ValueWhere)[]) {}

		public withWhere(expression: Expression): Statement {
			if (typeof expression !== 'function') {
				return new Statement([...this.values, expression])
			}
			const builder = ConditionBuilder.invoke(expression)
			const sql = builder.getSql()
			if (!sql) {
				return this
			}
			return new Statement([...this.values, sql])
		}

		public compile(): Literal {
			if (this.values.length === 0) {
				return new Literal('')
			}

			const valueWhereToLiteral = (where: Where.ValueWhere): Literal =>
				new Literal('').appendAll(
					Object.keys(where).map(it => new Literal(wrapIdentifier(it) + ' = ?', [where[it]])),
					' and ',
				)

			return new Literal(' where ').appendAll(
				this.values.map(it => (it instanceof Literal ? it : valueWhereToLiteral(it))),
				' and ',
			)
		}

		public apply<Builder extends { where: (arg: Where.Expression) => Builder }>(builder: Builder): Builder {
			return this.values.reduce((builder, value) => builder.where(value), builder)
		}
	}

	export interface Aware {
		where(expression: Expression): any
	}

	export type ValueWhere = { [columnName: string]: Value }
	export type Expression = ValueWhere | ConditionCallback | Literal
}

export { Where }
