import SelectBuilder from '../SelectBuilder'
import Client from '../Client'
import Literal from '../Literal'
import { wrapIdentifier } from '../utils'
import QueryBuilder from '../QueryBuilder'

namespace With {
	export class Statement {
		constructor(public readonly ctes: { [alias: string]: Literal }) {}

		public compile(): Literal {
			const ctes = Object.entries(this.ctes)
			if (ctes.length === 0) {
				return new Literal('')
			}
			return new Literal('with ').appendAll(
				ctes.map(([alias, expr]) => {
					return new Literal(wrapIdentifier(alias) + ' as (' + expr.sql + ')', expr.parameters)
				}),
				', ',
			)
		}

		public withCte(alias: string, expression: Literal): Statement {
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

	export type Expression = SelectBuilder.Callback | Literal | QueryBuilder

	export interface Aware {
		with(alias: string, expression: Expression): any
	}

	export function createLiteral(wrapper: Client, expr: Expression): Literal {
		if (typeof expr === 'function') {
			return expr(SelectBuilder.create(wrapper)).createQuery()
		} else if (((expr: any): expr is QueryBuilder => 'createQuery' in expr)(expr)) {
			return expr.createQuery()
		} else {
			return expr
		}
	}
}

export default With
