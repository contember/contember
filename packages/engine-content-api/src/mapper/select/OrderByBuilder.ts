import { Acl, Input, Model } from '@contember/schema'
import { Path } from './Path.js'
import { JoinBuilder } from './JoinBuilder.js'
import { CaseStatement, Literal, QueryBuilder, SelectBuilder, wrapIdentifier } from '@contember/database'
import { acceptFieldVisitor, getColumnName, getTargetEntity } from '@contember/schema-utils'
import { UserError } from '../../exception.js'
import { PredicateFactory, PredicatesInjector } from '../../acl/index.js'
import { WhereBuilder } from './WhereBuilder.js'

const orderByMapping = {
	asc: 'asc',
	desc: 'desc',
	ascNullsFirst: 'asc nulls first',
	descNullsLast: 'desc nulls last',
} as const

// A read predicate collected while traversing an order-by relation hop (e.g. `Post.author` in
// `orderBy: {author: {name: asc}}`), to be ANDed into the order-key guard. `false` = never readable.
interface OrderByHopGuard {
	entity: Model.Entity
	path: Path
	predicate: Acl.PredicateReference | false
	relationPath: Model.AnyRelationContext[]
	isAclFiltered: boolean
}

export class OrderByBuilder {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly predicateFactory: PredicateFactory,
		private readonly predicatesInjector: PredicatesInjector,
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
			([qb, orderable], fieldOrderBy) => this.buildOne(qb, orderable, entity, path, fieldOrderBy, relationPath, true, []),
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
		hopGuards: OrderByHopGuard[],
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
			return this.buildColumnOrder(qb, orderable, entity, path, fieldName, columnName, orderByMapping[value], relationPath, isAclFiltered, hopGuards)
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

			// The relation field itself has a read predicate: a row where the relation is cell-masked must not
			// order by the hidden target's value (projection masks the nested object via the same predicate).
			const hopPredicate = this.predicateFactory.getFieldReadPredicate(entity, fieldName, relationPath)
			const hopGuard = isAclFiltered && hopPredicate.isSameAsPrimary ? true : hopPredicate.predicate
			const nextHopGuards = hopGuard === true
				? hopGuards
				: [...hopGuards, { entity, path, predicate: hopGuard, relationPath, isAclFiltered }]

			return this.buildOne(joined, orderable, targetEntity, newPath, value, [...relationPath, relationContext], false, nextHopGuards)
		}
	}

	/**
	 * Orders by a column, guarding the order key with the field's read predicate — ANDed with the read
	 * predicates of every relation hop traversed to reach it — so that ordering can never leak a value the
	 * role cannot read. A row failing any of the predicates sorts as NULL (`CASE WHEN <predicates> THEN
	 * <column> END`), mirroring how projection masks the same value / relation to NULL.
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
		hopGuards: OrderByHopGuard[],
	): [SelectBuilder<SelectBuilder.Result>, Orderable] {
		const orderColumn: QueryBuilder.ColumnIdentifier = [path.alias, columnName]
		const applyPlain = <O extends QueryBuilder.Orderable<any>>(o: O) => o.orderBy(orderColumn, direction)

		const fieldPredicate = this.predicateFactory.getFieldReadPredicate(entity, fieldName, relationPath)

		// On the ACL-filtered entity a field whose read predicate equals the row-level predicate is readable
		// for every returned row, so no guard is needed. Through a relation we always guard.
		const guardPredicate = isAclFiltered && fieldPredicate.isSameAsPrimary ? true : fieldPredicate.predicate

		const allGuards: OrderByHopGuard[] = guardPredicate === true
			? hopGuards
			: [...hopGuards, { entity, path, predicate: guardPredicate, relationPath, isAclFiltered }]

		let neverReadable = false
		const guards: (OrderByHopGuard & { predicate: Acl.PredicateReference })[] = []
		for (const guard of allGuards) {
			if (guard.predicate === false) {
				neverReadable = true
			} else {
				guards.push({ ...guard, predicate: guard.predicate })
			}
		}

		if (neverReadable) {
			// The field, or a relation on the path to it, is never readable: the order key is unconditionally NULL.
			const nullLiteral = new Literal('null')
			qb = qb.orderBy(nullLiteral, direction)
			if (orderable !== null) {
				orderable = orderable.orderBy(nullLiteral, direction)
			}
			return [qb, orderable]
		}
		if (guards.length === 0) {
			qb = applyPlain(qb)
			if (orderable !== null) {
				orderable = applyPlain(orderable as QueryBuilder.Orderable<any>)
			}
			return [qb, orderable]
		}

		const columnLiteral = new Literal(`${wrapIdentifier(path.alias)}.${wrapIdentifier(columnName)}`)
		const conditions: Literal[] = []
		for (const guard of guards) {
			// Close the order-key guard the same way projection closes the cell mask: a guard traversing a
			// relation gets the traversed target's `read` injected, so ordering can never leak an unreadable
			// traversed row's value. No-op for guards without relation hops.
			const predicateWhere = this.predicatesInjector.closeReadPredicate(
				guard.entity,
				this.predicateFactory.buildReadPredicates(guard.entity, [guard.predicate], guard.relationPath),
				guard.relationPath,
			)
			// The row-level predicate is already guaranteed in the WHERE of the ACL-filtered entity, so let the
			// optimizer simplify it out of the cell-level predicate (mirrors SelectBuilder's predicate column).
			const evaluatedPredicates = guard.isAclFiltered
				? [this.predicateFactory.createReadPredicate(guard.entity, undefined, guard.relationPath)]
				: []
			const { qb: guardedQb, condition } = this.whereBuilder.buildConditionLiteral(
				qb,
				guard.entity,
				guard.path,
				predicateWhere,
				{ relationPath: guard.relationPath, evaluatedPredicates },
			)
			qb = guardedQb
			conditions.push(condition)
		}
		const condition = conditions.length === 1
			? conditions[0]
			: new Literal(conditions.map(it => `(${it.sql})`).join(' and '), conditions.flatMap(it => it.parameters))
		const orderLiteral = CaseStatement.createEmpty().when(condition, columnLiteral).compile()
		qb = qb.orderBy(orderLiteral, direction)
		if (orderable !== null) {
			orderable = orderable.orderBy(orderLiteral, direction)
		}
		return [qb, orderable]
	}
}
