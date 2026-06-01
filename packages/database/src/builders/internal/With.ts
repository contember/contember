import { wrapIdentifier } from '../../utils/index.js'
import { Literal } from '../../Literal.js'
import { Compiler } from '../Compiler.js'
import { SubQueryExpression, SubQueryLiteralFactory } from './Subqueries.js'

namespace With {
	type CteOptions = {
		literalFactory: SubQueryLiteralFactory
		recursive: boolean
		columns?: string[]
	}

	export class Statement {
		constructor(public readonly ctes: { [alias: string]: CteOptions }) {}

		public compile(context: Compiler.Context): [Literal, Compiler.Context] {
			const ctes = Object.entries(this.ctes)
			const hasRecursive = ctes.some(([, { recursive }]) => recursive)
			if (ctes.length === 0) {
				return [new Literal(''), context]
			}
			if (hasRecursive) {
				context = context.withAlias(...Object.keys(this.ctes))
			}
			const literal = new Literal(hasRecursive ? 'with recursive ' : 'with ').appendAll(
				ctes.map(([alias, { literalFactory, columns }]) => {
					const literal = literalFactory(context)
					context = !hasRecursive ? context.withAlias(alias) : context
					const columnsStr = columns ? '(' + columns.map(wrapIdentifier).join(', ') + ')' : ''
					return new Literal(wrapIdentifier(alias) + columnsStr + ' as (' + literal.sql + ')', literal.parameters)
				}),
				', ',
			)
			return [literal, context]
		}

		public withCte(
			alias: string,
			literalFactory: SubQueryLiteralFactory,
			recursive: boolean = false,
			columns?: string[],
		): Statement {
			return new Statement({ ...this.ctes, [alias]: { literalFactory, recursive, columns } })
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
