import SelectBuilder from '../SelectBuilder'
import Knex from 'knex'
import KnexWrapper from '../KnexWrapper'
import { Raw } from '../types'

namespace With {
	export class Statement {
		constructor(private readonly wrapper: KnexWrapper, private readonly ctes: { [alias: string]: Expression }) {}

		public apply(qb: Knex.QueryBuilder) {
			Object.entries(this.ctes).forEach(([alias, expr]) => {
				if (typeof expr === 'function') {
					const raw: Knex.Raw = expr(SelectBuilder.create(this.wrapper)).createQuery()
					qb.with(alias, raw)
				} else if ('createQuery' in expr) {
					qb.with(alias, expr.createQuery())
				} else {
					qb.with(alias, expr)
				}
			})
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
	}

	export interface Options {
		with: Statement
	}

	export type Expression = SelectBuilder.Callback | Raw | SelectBuilder<any>

	export interface Aware {
		with(alias: string, expression: Expression): any
	}
}

export default With
