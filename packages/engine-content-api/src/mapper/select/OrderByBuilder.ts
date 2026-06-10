import { Acl, Input, Model } from '@contember/schema'
import { Path } from './Path.js'
import { JoinBuilder } from './JoinBuilder.js'
import { CaseStatement, ConditionBuilder as SqlConditionBuilder, Literal, QueryBuilder, SelectBuilder, wrapIdentifier } from '@contember/database'
import { acceptFieldVisitor, getColumnName, getTargetEntity } from '@contember/schema-utils'
import { UserError } from '../../exception.js'
import { PredicateFactory } from '../../acl/index.js'
import { WhereBuilder } from './WhereBuilder.js'

const orderByMapping = {
	asc: 'asc',
	desc: 'desc',
	ascNullsFirst: 'asc nulls first',
	descNullsLast: 'desc nulls last',
} as const

export class OrderByBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
	) {}

	public build<Orderable extends QueryBuilder.Orderable<any> | null>(
		qb: SelectBuilder<SelectBuilder.Result>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.OrderBy[],
		relationPath: Model.AnyRelationContext[] = [],
	): [SelectBuilder<SelectBuilder.Result>, Orderable] {
		return orderBy.reduce<[SelectBuilder<SelectBuilder.Result>, Orderable]>(
			([qb, orderable], fieldOrderBy) => this.buildOne(qb, orderable, entity, path, fieldOrderBy, relationPath, true),
			[qb, orderable],
		)
	}

	private buildOne<Orderable extends QueryBuilder.Orderable<any> | null>(
		qb: SelectBuilder<SelectBuilder.Result>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.OrderBy,
		relationPath: Model.AnyRelationContext[],
		// True while we are still on the ACL-filtered query entity (its row-level predicate is in the WHERE).
		// Becomes false once we traverse into a relation, whose join is not ACL-filtered.
		isAclFiltered: boolean,
	): [SelectBuilder<SelectBuilder.Result>, Orderable] {
		const entries = Object.entries(orderBy)
		if (entries.length !== 1) {
			const fields = entries.map(it => it[0]).join(', ')
			throw new UserError('Order by: only one field is expected in each item of order by clause, got: ' + fields)
		}
		if (orderBy._random || orderBy._randomSeeded) {
			if (orderBy._randomSeeded) {
				const seed = orderBy._randomSeeded / Math.pow(2, 31)
				if (seed < -1 || seed > 1) {
					throw new UserError(`Order by: random seed must be in range of 32bit signed integer`)
				}
				qb = qb
					.with('rand_seed', qb => qb.select(expr => expr.raw('setseed(?)', seed)))
					.join('rand_seed', undefined, expr => expr.raw('true'))
			}

			qb = qb.orderBy(new Literal('random()'))
			if (orderable !== null) {
				orderable = orderable.orderBy(new Literal('random()'))
			}
			return [qb, orderable]
		}

		const [fieldName, value]: [string, Input.FieldOrderBy] = entries[0]

		if (typeof value === 'string') {
			const columnName = getColumnName(this.schema, entity, fieldName)
			return this.buildColumnOrder(qb, orderable, entity, path, fieldName, columnName, orderByMapping[value], relationPath, isAclFiltered)
		} else {
			const targetEntity = getTargetEntity(this.schema, entity, fieldName)
			if (!targetEntity) {
				throw new Error(`OrderByBuilder: target entity for relation ${entity.name}::${fieldName} not found`)
			}
			const newPath = path.for(fieldName)
			const joined = this.joinBuilder.join(qb, newPath, entity, fieldName)
			const relationContext = acceptFieldVisitor<Model.AnyRelationContext>(this.schema, entity, fieldName, {
				visitColumn: () => {
					throw new Error(`OrderByBuilder: ${entity.name}::${fieldName} is not a relation`)
				},
				visitRelation: context => context,
			})

			return this.buildOne(joined, orderable, targetEntity, newPath, value, [...relationPath, relationContext], false)
		}
	}

	/**
	 * Orders by a column, guarding the order key with the field's read predicate so that ordering can never
	 * leak a value the role cannot read. A row whose value fails the predicate sorts as NULL (`CASE WHEN
	 * <predicate> THEN <column> END`), mirroring how projection masks the same value to NULL.
	 *
	 * On the ACL-filtered query entity only cell-level fields (a read predicate stricter than the row-level
	 * predicate) need guarding — the row-level predicate is already enforced in the WHERE. When ordering
	 * THROUGH a relation the join is not ACL-filtered, so the order key is guarded by the full field read
	 * predicate (which also implies row-level readability) unconditionally.
	 */
	private buildColumnOrder<Orderable extends QueryBuilder.Orderable<any> | null>(
		qb: SelectBuilder<SelectBuilder.Result>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		fieldName: string,
		columnName: string,
		direction: typeof orderByMapping[keyof typeof orderByMapping],
		relationPath: Model.AnyRelationContext[],
		isAclFiltered: boolean,
	): [SelectBuilder<SelectBuilder.Result>, Orderable] {
		const orderColumn: QueryBuilder.ColumnIdentifier = [path.alias, columnName]
		const applyPlain = <O extends QueryBuilder.Orderable<any>>(o: O) => o.orderBy(orderColumn, direction)

		const isRoot = relationPath.length === 0
		const fieldPredicate = this.predicateFactory.getFieldPredicate(entity, Acl.Operation.read, fieldName, isRoot)

		// On the ACL-filtered entity a field whose read predicate equals the row-level predicate is readable
		// for every returned row, so no guard is needed. Through a relation we always guard.
		const guardPredicate = isAclFiltered && fieldPredicate.isSameAsPrimary ? true : fieldPredicate.predicate

		if (guardPredicate === true) {
			qb = applyPlain(qb)
			if (orderable !== null) {
				orderable = applyPlain(orderable as QueryBuilder.Orderable<any>)
			}
			return [qb, orderable]
		}
		if (guardPredicate === false) {
			// The field is never readable: the order key is unconditionally NULL.
			const nullLiteral = new Literal('null')
			qb = qb.orderBy(nullLiteral, direction)
			if (orderable !== null) {
				orderable = orderable.orderBy(nullLiteral, direction)
			}
			return [qb, orderable]
		}

		const relationContext = relationPath[relationPath.length - 1]
		const predicateWhere = this.predicateFactory.buildPredicates(entity, [guardPredicate], relationContext, isRoot)
		// The row-level predicate is already guaranteed in the WHERE of the ACL-filtered entity, so let the
		// optimizer simplify it out of the cell-level predicate (mirrors SelectBuilder's predicate column).
		const evaluatedPredicates = isAclFiltered
			? [this.predicateFactory.create(entity, Acl.Operation.read, undefined, relationContext, isRoot)]
			: []

		const columnLiteral = new Literal(`${wrapIdentifier(path.alias)}.${wrapIdentifier(columnName)}`)
		let orderLiteral: Literal | undefined

		qb = this.whereBuilder.buildAdvanced(
			entity,
			path,
			predicateWhere,
			applyCondition => {
				const condition = SqlConditionBuilder.process(clause => {
					const applied = applyCondition(clause)
					return applied.isEmpty() ? applied.raw('true') : applied
				}).getSql() ?? new Literal('true')
				orderLiteral = CaseStatement.createEmpty().when(condition, columnLiteral).compile()
				return qb
			},
			{ relationPath, evaluatedPredicates },
		)

		if (orderLiteral === undefined) {
			throw new Error('OrderByBuilder: order expression was not built')
		}
		qb = qb.orderBy(orderLiteral, direction)
		if (orderable !== null) {
			orderable = orderable.orderBy(orderLiteral, direction)
		}
		return [qb, orderable]
	}
}
