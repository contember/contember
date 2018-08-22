import * as Knex from 'knex'
import { Input } from 'cms-common'

export default class ConditionBuilder {
	public build(qb: Knex.QueryBuilder, tableName: string, columnName: string, condition: Input.Condition<any>): void {
		const keys = Object.keys(condition)
		if (keys.length > 1) {
			throw new Error()
		}

		qb.andWhere(qb => {
			if (condition.and !== undefined) {
				condition.and.forEach(it => this.build(qb, tableName, columnName, it))
			}
			if (condition.or !== undefined) {
				condition.or.forEach(it => qb.orWhere(qb => this.build(qb, tableName, columnName, it)))
			}
			if (condition.not !== undefined) {
				qb.whereNot(qb => this.build(qb, tableName, columnName, condition))
			}
			const fqn = `${tableName}.${columnName}`

			if (condition.eq !== undefined) {
				qb.where(fqn, condition.eq)
			}
			if (condition.null !== undefined) {
				condition.null ? qb.whereNull(fqn) : qb.whereNotNull(fqn)
			}
			if (condition.notEq !== undefined) {
				qb.whereNot(fqn, condition.notEq)
			}
			if (condition.in !== undefined) {
				qb.whereIn(fqn, condition.in)
			}
			if (condition.notIn !== undefined) {
				qb.whereNotIn(fqn, condition.notIn)
			}
			if (condition.lt !== undefined) {
				qb.where(fqn, '<', condition.lt)
			}
			if (condition.lte !== undefined) {
				qb.where(fqn, '<=', condition.lte)
			}
			if (condition.gt !== undefined) {
				qb.where(fqn, '>', condition.gt)
			}
			if (condition.gte !== undefined) {
				qb.where(fqn, '>=', condition.gte)
			}
			if (condition.never) {
				qb.whereRaw('false')
			}
			if (condition.always) {
				qb.whereRaw('true')
			}
		})
	}
}
