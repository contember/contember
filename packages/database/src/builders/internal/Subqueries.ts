import { Compiler } from '../Compiler'
import { Literal } from '../../Literal'
import { SelectBuilder } from '../SelectBuilder'
import { QueryBuilder } from '../QueryBuilder'

export type SubQueryLiteralFactory = (context: Compiler.Context) => Literal
export type SubQueryExpression = SelectBuilder.Callback | Literal | QueryBuilder

export function createSubQueryLiteralFactory(expr: SubQueryExpression): SubQueryLiteralFactory {
	if (typeof expr === 'function') {
		return ctx => expr(SelectBuilder.create()).createQuery(ctx)
	} else if (((expr: any): expr is QueryBuilder => 'createQuery' in expr)(expr)) {
		return ctx => expr.createQuery(ctx)
	} else {
		return () => expr
	}
}
