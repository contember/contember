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
			if (typeof expression === 'function' || expression instanceof ConditionBuilder) {
				const sql = ConditionBuilder.process(expression).getSql()
				return sql ? this.withWhere(sql) : this
			}
			return new Statement([...this.values, expression])
		}

		public compile(): Literal {
			if (this.values.length === 0) {
				return new Literal('')
			}

			const valueWhereToLiteral = (where: Where.ValueWhere): Literal =>
				new Literal('').appendAll(
					Object.keys(where).map(it => {
						const identifier = wrapIdentifier(it)
						if (where[it] === null) {
							return new Literal(`${identifier} is null`)
						}
						return new Literal(`${identifier} = ?`, [where[it]])
					}),
					' and ',
				)

			return new Literal(' where ').appendAll(
				this.values.map(it => (it instanceof Literal ? it : valueWhereToLiteral(it))).filter(it => it.sql !== ''),
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
	export type Expression = ValueWhere | ConditionCallback | ConditionBuilder | Literal
}

export { Where }
