import { Literal } from '../Literal.js'
import { Value } from '../types.js'
import { ColumnExpressionFactory } from './ColumnExpressionFactory.js'
import { Compiler } from './Compiler.js'
import { SelectBuilder } from './SelectBuilder.js'

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
