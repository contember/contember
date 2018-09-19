import { Input } from 'cms-common'
import SqlConditionBuilder from '../../../core/knex/ConditionBuilder'
import QueryBuilder from '../../../core/knex/QueryBuilder'

export default class ConditionBuilder {
	public build(
		clause: SqlConditionBuilder,
		tableName: string,
		columnName: string,
		condition: Input.Condition<any>
	): void {
		const keys = Object.keys(condition)
		if (keys.length > 1) {
			throw new Error()
		}

		clause.and(clause => {
			if (condition.and !== undefined) {
				condition.and.forEach(it => this.build(clause, tableName, columnName, it))
			}
			if (condition.or !== undefined) {
				condition.or.forEach(it => clause.or(clause => this.build(clause, tableName, columnName, it)))
			}
			if (condition.not !== undefined) {
				clause.not(qb => this.build(qb, tableName, columnName, condition))
			}

			const columnIdentifier: QueryBuilder.ColumnIdentifier = [tableName, columnName]

			if (condition.eq !== undefined) {
				clause.compare(columnIdentifier, SqlConditionBuilder.Operator.eq, condition.eq)
			}
			if (condition.null !== undefined) {
				condition.null ? clause.null(columnIdentifier) : clause.not(clause => clause.null(columnIdentifier))
			}
			if (condition.notEq !== undefined) {
				clause.compare(columnIdentifier, SqlConditionBuilder.Operator.notEq, condition.notEq)
			}
			if (condition.in !== undefined) {
				clause.in(columnIdentifier, condition.in)
			}
			if (condition.notIn !== undefined) {
				const values = condition.notIn
				clause.not(clause => clause.in(columnIdentifier, values))
			}
			if (condition.lt !== undefined) {
				clause.compare(columnIdentifier, SqlConditionBuilder.Operator.lt, condition.lt)
			}
			if (condition.lte !== undefined) {
				clause.compare(columnIdentifier, SqlConditionBuilder.Operator.lte, condition.lte)
			}
			if (condition.gt !== undefined) {
				clause.compare(columnIdentifier, SqlConditionBuilder.Operator.gt, condition.gt)
			}
			if (condition.gte !== undefined) {
				clause.compare(columnIdentifier, SqlConditionBuilder.Operator.gte, condition.gte)
			}
			if (condition.never) {
				clause.raw('false')
			}
			if (condition.always) {
				clause.raw('true')
			}
		})
	}
}
