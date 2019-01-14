import { Value } from '../types'
import ConditionBuilder from '../ConditionBuilder'
import KnexWrapper from '../KnexWrapper'
import * as knex from 'knex'

namespace Where {
	export interface Options {
		where: Statement
	}

	export class Statement {
		constructor(private readonly wrapper: KnexWrapper, public readonly values: (knex.Raw | ValueWhere)[]) {}

		public withWhere(expression: Expression): Statement {
			if (typeof expression !== 'function') {
				return new Statement(this.wrapper, [...this.values, expression])
			}
			const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
			expression(builder)
			const sql = builder.getSql()
			if (!sql) {
				return this
			}
			return new Statement(this.wrapper, [...this.values, sql])
		}

		public apply<Builder extends { where: (expression: knex.Raw | ValueWhere) => Builder }>(builder: Builder): Builder {
			return this.values.reduce((builder, value) => builder.where(value), builder)
		}
	}

	export interface Aware {
		where(expression: Expression): any
	}

	export type ConditionCallback = (whereClause: ConditionBuilder) => void
	export type ValueWhere = { [columName: string]: Value }
	export type Expression = ValueWhere | ConditionCallback | knex.Raw
}

export default Where
