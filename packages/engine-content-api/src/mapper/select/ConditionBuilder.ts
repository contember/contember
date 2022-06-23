import { Input } from '@contember/schema'
import { QueryBuilder, ConditionBuilder as SqlConditionBuilder, Operator } from '@contember/database'
import { UserError } from '../../exception.js'

export class ConditionBuilder {
	public build(
		builder: SqlConditionBuilder,
		tableName: string,
		columnName: string,
		columnType: string,
		condition: Input.Condition<any>,
	): SqlConditionBuilder {
		const entries = Object.entries(condition)
			.filter(<T extends keyof Input.Condition>(it: [string, any]): it is [T, Input.Condition[T]] =>
				it[1] !== null,
			)
		if (entries.length === 0) {
			return builder
		}
		if (entries.length > 1) {
			throw new UserError(
				'Only single field is allowed. If you want to combine multiple conditions, use "and" or "or". Got: ' +
					JSON.stringify(condition),
			)
		}
		const columnIdentifier: QueryBuilder.ColumnIdentifier = [tableName, columnName]

		const handler: {
			[K in keyof Required<Input.Condition<any>>]: (
				builder: SqlConditionBuilder,
				param: Exclude<Input.Condition<any>[K], undefined>,
			) => SqlConditionBuilder
		} = {
			and: (builder, expressions) => builder.and(builder2 => expressions.reduce((builder3, expr) => this.build(builder3, tableName, columnName, columnType, expr), builder2)),
			or: (builder, expressions) => builder.or(builder2 => expressions.reduce((builder3, expr) => this.build(builder3, tableName, columnName, columnType, expr), builder2)),
			not: (builder, expression) => builder.not(builder2 => this.build(builder2, tableName, columnName, columnType, expression)),
			eq: (builder, value) => builder.compare(columnIdentifier, Operator.eq, value),
			notEq: (builder, value) => builder.compare(columnIdentifier, Operator.notEq, value),
			isNull: (builder, value) => value ? builder.isNull(columnIdentifier) : builder.not(clause => clause.isNull(columnIdentifier)),
			in: (builder, values) => builder.in(columnIdentifier, values, columnType),
			notIn: (builder, values) => builder.not(builder2 => builder2.in(columnIdentifier, values)),
			lt: (builder, value) => builder.compare(columnIdentifier, Operator.lt, value),
			lte: (builder, value) => builder.compare(columnIdentifier, Operator.lte, value),
			gt: (builder, value) => builder.compare(columnIdentifier, Operator.gt, value),
			gte: (builder, value) => builder.compare(columnIdentifier, Operator.gte, value),
			contains: (builder, value) => builder.compare(columnIdentifier, Operator.contains, value),
			startsWith: (builder, value) => builder.compare(columnIdentifier, Operator.startsWith, value),
			endsWith: (builder, value) => builder.compare(columnIdentifier, Operator.endsWith, value),
			containsCI: (builder, value) => builder.compare(columnIdentifier, Operator.containsCI, value),
			startsWithCI: (builder, value) => builder.compare(columnIdentifier, Operator.startsWithCI, value),
			endsWithCI: (builder, value) => builder.compare(columnIdentifier, Operator.endsWithCI, value),
			never: builder => builder.raw('false'),
			always: builder => builder.raw('true'),

			// deprecated
			null: (builder, value) => value ? builder.isNull(columnIdentifier) : builder.not(clause => clause.isNull(columnIdentifier)),
		}

		return handler[entries[0][0]](builder, entries[0][1])
	}
}
