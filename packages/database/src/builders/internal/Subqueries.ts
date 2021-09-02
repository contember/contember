import { Compiler } from '../Compiler'
import { Literal } from '../../Literal'
import { SelectBuilder } from '../SelectBuilder'
import { QueryBuilder } from '../QueryBuilder'

export type SubQueryLiteralFactory<Builder extends QueryBuilder = QueryBuilder> = (context: Compiler.Context, preprocessor?: (query: SelectBuilder | Builder) => QueryBuilder) => Literal
export type SubQueryExpression<Builder extends QueryBuilder = QueryBuilder> = SelectBuilder.Callback | Literal | Builder

const noop = <T>(value: T): T => value

export function createSubQueryLiteralFactory<Builder extends QueryBuilder = QueryBuilder>(expr: SubQueryExpression<Builder>): SubQueryLiteralFactory<Builder> {
	if (typeof expr === 'function') {
		return (ctx, preprocessor) => (preprocessor ?? noop)(expr(SelectBuilder.create())).createQuery(ctx)
	} else if (((expr: any): expr is QueryBuilder => 'createQuery' in expr)(expr)) {
		return (ctx, preprocessor) => ((preprocessor ?? noop)(expr)).createQuery(ctx)
	} else {
		return () => expr
	}
}
