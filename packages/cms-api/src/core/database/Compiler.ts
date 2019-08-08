import SelectBuilder from './SelectBuilder'
import Literal from './Literal'
import { aliasLiteral, prependSchema, wrapIdentifier } from './utils'
import { assertNever } from 'cms-common'
import DeleteBuilder from './DeleteBuilder'
import InsertBuilder from './InsertBuilder'
import UpdateBuilder from './UpdateBuilder'
import QueryBuilder from './QueryBuilder'

class Compiler {
	compileSelect(options: SelectBuilder.Options, namespaceContext: Compiler.NamespaceContext): Literal {
		return Literal.empty
			.append(options.with.compile())
			.appendString(' select')
			.append(this.compileSelectStatement(options.select))
			.append(this.compileFromStatement(options.from, namespaceContext))
			.append(this.compileJoin(options.join, namespaceContext))
			.append(options.where.compile())
			.append(this.compileOrderBy(options.orderBy))
			.append(this.compileLimit(options.limit))
			.append(this.compileLock(options.lock))
			.trim()
	}

	compileDelete(options: DeleteBuilder.Options, namespaceContext: Compiler.NamespaceContext): Literal {
		const { from, using, where, returning } = options
		if (from === undefined) {
			throw Error()
		}

		return Literal.empty
			.append(options.with.compile())
			.appendString(' delete from')
			.append(this.prependSchema(from, namespaceContext))
			.append(this.compileUsing(using, namespaceContext))
			.append(where.compile())
			.append(returning.compile())
			.trim()
	}

	compileInsert(options: InsertBuilder.ResolvedOptions, namespaceContext: Compiler.NamespaceContext): Literal {
		return Literal.empty
			.append(options.with.compile())
			.appendString(' insert into ')
			.append(this.compileIntoStatement(options.into, options.values, namespaceContext))
			.append(options.from ? options.from : new Literal(' values ').append(this.createValues(options.values)))
			.append(this.compileOnConflictStatement(options.onConflict))
			.append(options.returning.compile())
			.trim()
	}

	compileUpdate(options: UpdateBuilder.ResolvedOptions, namespaceContext: Compiler.NamespaceContext): Literal {
		return Literal.empty
			.append(options.with.compile())
			.appendString(' update ')
			.append(this.prependSchema(options.table, namespaceContext))
			.appendString(' set ')
			.append(this.createSet(options.values))
			.append(options.from || options.where.compile())
			.append(options.returning.compile())
			.trim()
	}

	private compileUsing(using: DeleteBuilder.Options['using'], namespaceContext: Compiler.NamespaceContext): Literal {
		const usingEntries = Object.entries(using)
		if (usingEntries.length === 0) {
			return Literal.empty
		}
		return new Literal(' using ').appendAll(
			usingEntries.map(([alias, table]) => aliasLiteral(this.prependSchema(table, namespaceContext), alias)),
			', ',
		)
	}

	private compileLimit(limitExpr: SelectBuilder.Options['limit']): Literal {
		if (!limitExpr) {
			return Literal.empty
		}
		const [limit, offset] = limitExpr
		return new Literal(' limit ' + Number(limit) + (offset ? ' offset ' + Number(offset) : ''))
	}

	private compileOrderBy(orderBy: SelectBuilder.Options['orderBy']): Literal {
		if (orderBy.length === 0) {
			return Literal.empty
		}
		return new Literal(' order by ').appendAll(
			orderBy.map(([column, direction]) => column.appendString(' ' + direction)),
			', ',
		)
	}

	private compileLock(lock?: SelectBuilder.Options['lock']): Literal {
		if (!lock) {
			return Literal.empty
		}
		switch (lock) {
			case SelectBuilder.LockType.forUpdate:
				return new Literal(' for update')
			case SelectBuilder.LockType.forNoKeyUpdate:
				return new Literal(' for no key update')
			case SelectBuilder.LockType.forShare:
				return new Literal(' for share')
			case SelectBuilder.LockType.forKeyShare:
				return new Literal(' for key share')
			default:
				return assertNever(lock)
		}
	}

	private compileJoin(join: SelectBuilder.Options['join'], namespaceContext: Compiler.NamespaceContext): Literal {
		return join.reduce((query, { table, alias, condition, type }) => {
			const tableArg = aliasLiteral(this.prependSchema(table, namespaceContext), alias)
			const conditionArg = condition || new Literal('true')
			switch (type) {
				case 'inner':
					return query
						.appendString(' inner join ')
						.append(tableArg)
						.appendString(' on ')
						.append(conditionArg)
				case 'left':
					return query
						.appendString(' left join ')
						.append(tableArg)
						.appendString(' on ')
						.append(conditionArg)
				default:
					return assertNever(type)
			}
		}, Literal.empty)
	}

	private compileSelectStatement(select: SelectBuilder.Options['select']): Literal {
		if (select.length > 0) {
			return Literal.empty.appendAll(select, ', ')
		}
		return new Literal('*')
	}

	private compileFromStatement(
		fromExpr: SelectBuilder.Options['from'],
		namespaceContext: Compiler.NamespaceContext,
	): Literal {
		if (!fromExpr) {
			return Literal.empty
		}
		const [from, alias] = fromExpr
		return new Literal(' from ').append(aliasLiteral(this.prependSchema(from, namespaceContext), alias))
	}

	private compileIntoStatement(
		into: Exclude<InsertBuilder.Options['into'], undefined>,
		values: Exclude<InsertBuilder.Options['values'], undefined>,
		namespaceContext: Compiler.NamespaceContext,
	): Literal {
		return this.prependSchema(into, namespaceContext).appendAll(
			Object.keys(values).map(it => new Literal(wrapIdentifier(it))),
			', ',
			[' (', ')'],
		)
	}

	private compileOnConflictStatement(onConflict: InsertBuilder.Options['onConflict']): Literal {
		if (!onConflict) {
			return Literal.empty
		}
		switch (onConflict.type) {
			case InsertBuilder.ConflictActionType.doNothing:
				return new Literal(' on conflict ')
					.append(this.compileOnConflictTarget(onConflict.target))
					.appendString(' do nothing')
			case InsertBuilder.ConflictActionType.update:
				return new Literal('on conflict ')
					.append(this.compileOnConflictTarget(onConflict.target))
					.appendString(' do update set ')
					.append(this.createSet(onConflict.values))
			default:
				return assertNever(onConflict)
		}
	}

	private compileOnConflictTarget(target?: InsertBuilder.ConflictTarget) {
		if (!target) {
			return Literal.empty
		}
		if (Array.isArray(target)) {
			return Literal.empty.appendAll(target.map(it => new Literal(wrapIdentifier(it))), ', ', ['(', ')'])
		}
		return new Literal('on constraint ' + wrapIdentifier(target.constraint))
	}

	private createSet(values: QueryBuilder.ResolvedValues): Literal {
		return Literal.empty.appendAll(
			Object.entries(values).map(([col, value]) => new Literal(wrapIdentifier(col) + ' = ').append(value)),
			', ',
		)
	}

	private createValues(values: QueryBuilder.ResolvedValues): Literal {
		return Literal.empty.appendAll(Object.entries(values).map(([col, value]) => value), ', ', ['(', ')'])
	}

	private prependSchema(tableExpression: string | Literal, { schema, cteAliases }: Compiler.NamespaceContext): Literal {
		return prependSchema(tableExpression, schema, cteAliases)
	}
}

namespace Compiler {
	export class NamespaceContext {
		constructor(public readonly schema: string, public cteAliases: Set<string>) {}
	}
}

export default Compiler
