import { Literal } from '../Literal'
import { Value } from '../types'
import { ColumnExpressionFactory } from './ColumnExpressionFactory'
import { Compiler } from './Compiler'
import { SelectBuilder } from './SelectBuilder'

interface QueryBuilder {
	createQuery(context: Compiler.Context): Literal
}

namespace QueryBuilder {
	type ColumnFqn = string
	type TableAliasAndColumn = [string, string]
	export type ColumnIdentifier = ColumnFqn | TableAliasAndColumn

	export type Values = { [columnName: string]: QueryBuilder.ColumnExpression | Value }
	export type ResolvedValues = { [columnName: string]: Literal }

	export type ColumnExpression = Literal | ((expressionFactory: ColumnExpressionFactory) => Literal | undefined)
	export type ColumnExpressionMap = { [columnName: string]: QueryBuilder.ColumnExpression }

	export interface Orderable<R> {
		orderBy(columnName: QueryBuilder.ColumnIdentifier | Literal, direction?: SelectBuilder.OrderByDirection): R
	}
}

export { QueryBuilder }
