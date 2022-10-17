import { aliasLiteral, assertNever, prependSchema, wrapIdentifier } from '../utils'
import { SelectBuilder } from './SelectBuilder'
import { Literal } from '../Literal'
import { DeleteBuilder } from './DeleteBuilder'
import { InsertBuilder } from './InsertBuilder'
import { UpdateBuilder } from './UpdateBuilder'
import { QueryBuilder } from './QueryBuilder'
import { LockType } from './LockType'
import { ConflictActionType } from './ConflictActionType'

class Compiler {
	compileSelect(options: SelectBuilder.Options, namespaceContext: Compiler.Context): Literal {
		const [withLiteral, namespaceContextFinal] = options.with.compile(namespaceContext)
		return this.finalizeLiteral(
			Literal.empty
				.append(withLiteral)
				.appendString(' select')
				.append(this.compileDistinctStatement(options.distinct))
				.append(this.compileSelectStatement(options.select))
				.append(this.compileFromStatement(options.from, namespaceContextFinal))
				.append(this.compileJoin(options.join, namespaceContextFinal))
				.append(options.where.compile())
				.append(this.compileGrouping(options.grouping))
				.append(this.compileUnion(options.union, namespaceContextFinal))
				.append(this.compileOrderBy(options.orderBy))
				.append(this.compileLimit(options.limit))
				.append(this.compileLock(options.lock)),
			namespaceContextFinal,
		)
	}

	compileDelete(options: DeleteBuilder.Options, namespaceContext: Compiler.Context): Literal {
		const { from, using, where, returning } = options
		if (from === undefined) {
			throw Error()
		}
		const [withLiteral, namespaceContextFinal] = options.with.compile(namespaceContext)

		return this.finalizeLiteral(
			Literal.empty
				.append(withLiteral)
				.appendString(' delete from')
				.append(this.prependSchema(from, namespaceContextFinal))
				.append(this.compileUsing(using, namespaceContextFinal))
				.append(where.compile())
				.append(returning.compile()),
			namespaceContextFinal,
		)
	}

	compileInsert(options: InsertBuilder.ResolvedOptions, namespaceContext: Compiler.Context): Literal {
		const [withLiteral, namespaceContextFinal] = options.with.compile(namespaceContext)
		return this.finalizeLiteral(
			Literal.empty
				.append(withLiteral)
				.appendString(' insert into ')
				.append(this.compileIntoStatement(options.into, options.values, namespaceContextFinal))
				.append(options.from ? options.from : new Literal(' values ').append(this.createValues(options.values)))
				.append(this.compileOnConflictStatement(options.onConflict))
				.append(options.returning.compile()),
			namespaceContextFinal,
		)
	}

	compileUpdate(options: UpdateBuilder.ResolvedOptions, namespaceContext: Compiler.Context): Literal {
		const [withLiteral, namespaceContextFinal] = options.with.compile(namespaceContext)
		return this.finalizeLiteral(
			Literal.empty
				.append(withLiteral)
				.appendString(' update ')
				.append(this.prependSchema(options.table, namespaceContextFinal))
				.appendString(' set ')
				.append(this.createSet(options.values))
				.append(options.from || options.where.compile())
				.append(options.returning.compile()),
			namespaceContextFinal,
		)
	}

	private finalizeLiteral(literal: Literal, context: Compiler.Context): Literal {
		if (context.schema !== Compiler.SCHEMA_PLACEHOLDER) {
			const sql = literal.sql.trim().replace(new RegExp(Compiler.SCHEMA_PLACEHOLDER, 'g'), context.schema)
			return new Literal(sql, literal.parameters)
		}
		return literal.trim()
	}

	private compileUsing(using: DeleteBuilder.Options['using'], namespaceContext: Compiler.Context): Literal {
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
		const limitSql = limit !== undefined ? ' limit ' + Number(limit) : ''
		const offsetSql = offset !== undefined ? ' offset ' + Number(offset) : ''
		return new Literal(limitSql + offsetSql)
	}

	private compileOrderBy(orderBy: SelectBuilder.Options['orderBy']): Literal {
		if (orderBy.length === 0) {
			return Literal.empty
		}
		return new Literal(' order by ').appendAll(
			orderBy.map(([column, direction]) => {
				if (!SelectBuilder.orderByDirection.has(direction)) {
					throw new Error()
				}
				return column.appendString(' ' + direction)
			}),
			', ',
		)
	}

	private compileGrouping(grouping: SelectBuilder.Options['grouping']): Literal {
		if (grouping.groupingElement.length === 0) {
			return Literal.empty
		}
		return new Literal(' group by ').appendAll(grouping.groupingElement, ', ')
	}

	private compileUnion(grouping: SelectBuilder.Options['union'], namespaceContext: Compiler.Context): Literal {
		if (!grouping) {
			return Literal.empty
		}
		return new Literal(` union ${grouping.type} (`).append(grouping.literal(namespaceContext)).appendString(')')
	}

	private compileLock(lock?: SelectBuilder.Options['lock']): Literal {
		if (!lock) {
			return Literal.empty
		}
		return new Literal(` ${lock.type} ${lock.modifier}`)
	}

	private compileJoin(join: SelectBuilder.Options['join'], namespaceContext: Compiler.Context): Literal {
		return join.reduce((query, { table, alias, condition, type }) => {
			const tableArg = aliasLiteral(this.prependSchema(table, namespaceContext), alias)
			const conditionArg = condition || new Literal('true')
			switch (type) {
				case 'inner':
					return query //
						.appendString(' inner join ')
						.append(tableArg)
						.appendString(' on ')
						.append(conditionArg)
				case 'left':
					return query //
						.appendString(' left join ')
						.append(tableArg)
						.appendString(' on ')
						.append(conditionArg)
				default:
					return assertNever(type)
			}
		}, Literal.empty)
	}

	private compileDistinctStatement(distinct: SelectBuilder.Options['distinct']): Literal {
		if (distinct === undefined) {
			return Literal.empty
		}
		return new Literal(' distinct').appendAll(distinct, ', ', [' on (', ')'])
	}

	private compileSelectStatement(select: SelectBuilder.Options['select']): Literal {
		if (select.length > 0) {
			return Literal.empty.appendAll(select, ', ')
		}
		return new Literal('*')
	}

	private compileFromStatement(fromExpr: SelectBuilder.Options['from'], namespaceContext: Compiler.Context): Literal {
		if (!fromExpr) {
			return Literal.empty
		}
		return new Literal(' from ').appendAll(
			fromExpr.map(([from, alias]) => aliasLiteral(this.prependSchema(from, namespaceContext), alias)),
			', ',
		)
	}

	private compileIntoStatement(
		into: Exclude<InsertBuilder.Options['into'], undefined>,
		values: Exclude<InsertBuilder.Options['values'], undefined>,
		namespaceContext: Compiler.Context,
	): Literal {
		if (values.length === 0) {
			throw new Error()
		}
		return this.prependSchema(into, namespaceContext).appendAll(
			Object.keys(values[0]).map(it => new Literal(wrapIdentifier(it))),
			', ',
			[' (', ')'],
		)
	}

	private compileOnConflictStatement(onConflict: InsertBuilder.Options['onConflict']): Literal {
		if (!onConflict) {
			return Literal.empty
		}
		switch (onConflict.type) {
			case ConflictActionType.doNothing:
				return new Literal(' on conflict ')
					.append(this.compileOnConflictTarget(onConflict.target))
					.appendString(' do nothing')
			case ConflictActionType.update:
				return new Literal('on conflict ')
					.append(this.compileOnConflictTarget(onConflict.target))
					.appendString(' do update set ')
					.append(this.createSet(onConflict.values))
					.append(onConflict.where.compile())
			default:
				return assertNever(onConflict)
		}
	}

	private compileOnConflictTarget(target?: InsertBuilder.ConflictTargetOptions) {
		if (!target) {
			return Literal.empty
		}
		const createColumnList = (columns: string[]) =>
			Literal.empty.appendAll(
				columns.map(it => new Literal(wrapIdentifier(it))),
				', ',
				['(', ')'],
			)

		if (Array.isArray(target)) {
			return createColumnList(target)
		}
		if ('columns' in target) {
			return createColumnList(target.columns).append(target.where.compile())
		}
		return new Literal('on constraint ' + wrapIdentifier(target.constraint))
	}

	private createSet(values: QueryBuilder.ResolvedValues): Literal {
		return Literal.empty.appendAll(
			Object.entries(values).map(([col, value]) => new Literal(wrapIdentifier(col) + ' = ').append(value)),
			', ',
		)
	}

	private createValues(values: QueryBuilder.ResolvedValues[]): Literal {
		return Literal.empty.appendAll(
			values.map(it => Literal.empty.appendAll(
				Object.entries(it).map(([col, value]) => value),
				', ',
				['(', ')'],
			)),
			', ',
		)
	}

	private prependSchema(tableExpression: string | Literal, { schema, cteAliases }: Compiler.Context): Literal {
		return prependSchema(tableExpression, schema, cteAliases)
	}
}

namespace Compiler {
	export class Context {
		constructor(public readonly schema: string, public cteAliases: Set<string>) {}

		withAlias(...alias: string[]) {
			return new Context(this.schema, new Set([...this.cteAliases.values(), ...alias]))
		}
	}
	export const SCHEMA_PLACEHOLDER = '__SCHEMA__'
}

export { Compiler }
