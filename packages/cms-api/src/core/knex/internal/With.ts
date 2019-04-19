import SelectBuilder from '../SelectBuilder'
import KnexWrapper from '../KnexWrapper'
import Literal from '../Literal'
import { wrapIdentifier } from '../utils'
import QueryBuilder from '../QueryBuilder'

namespace With {
	export class Statement {
		constructor(private readonly wrapper: KnexWrapper, public readonly ctes: { [alias: string]: Expression }) {}

		public compile(): Literal {
			const ctes = Object.entries(this.ctes)
			if (ctes.length === 0) {
				return new Literal('')
			}
			return new Literal('with ').appendAll(
				ctes.map(([alias, expr]) => {
					const raw = this.createLiteral(expr)
					return new Literal(wrapIdentifier(alias) + ' as (' + raw.sql + ')', raw.parameters)
				}),
				', '
			)
		}

		public withCte(alias: string, expression: Expression): Statement {
			return new Statement(this.wrapper, { ...this.ctes, [alias]: expression })
		}

		public includes(alias: string): boolean {
			return this.getAliases().includes(alias)
		}

		public getAliases(): string[] {
			return Object.keys(this.ctes)
		}

		private createLiteral(expr: Expression): Literal {
			if (typeof expr === 'function') {
				return expr(SelectBuilder.create(this.wrapper)).createQuery()
			} else if (((expr: any): expr is QueryBuilder => 'createQuery' in expr)(expr)) {
				return expr.createQuery()
			} else {
				return expr
			}
		}
	}

	export interface Options {
		with: Statement
	}

	export type Expression = SelectBuilder.Callback | Literal | SelectBuilder<any>

	export interface Aware {
		with(alias: string, expression: Expression): any
	}
}

export default With
