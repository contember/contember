import { wrapIdentifier } from '../../utils'
import { Literal } from '../../Literal'
import { Compiler } from '../Compiler'
import { SubQueryExpression, SubQueryLiteralFactory } from './Subqueries'

namespace With {
	export class Statement {
		constructor(public readonly ctes: { [alias: string]: SubQueryLiteralFactory }) {}

		public compile(context: Compiler.Context): [Literal, Compiler.Context] {
			const ctes = Object.entries(this.ctes)
			if (ctes.length === 0) {
				return [new Literal(''), context]
			}
			const literal = new Literal('with ').appendAll(
				ctes.map(([alias, expr]) => {
					const literal = expr(context)
					context = context.withAlias(alias)
					return new Literal(wrapIdentifier(alias) + ' as (' + literal.sql + ')', literal.parameters)
				}),
				', ',
			)
			return [literal, context]
		}

		public withCte(alias: string, expression: SubQueryLiteralFactory): Statement {
			return new Statement({ ...this.ctes, [alias]: expression })
		}

		public includes(alias: string): boolean {
			return this.getAliases().includes(alias)
		}

		public getAliases(): string[] {
			return Object.keys(this.ctes)
		}
	}

	export interface Options {
		with: Statement
	}

	export interface Aware {
		with(alias: string, expression: SubQueryExpression): any
	}
}

export { With }
