import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor, isColumn } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory.js'
import { AclScope } from './AclScope.js'

/**
 * Internal where key carrying the row-level read predicate of a relation target. The injector attaches it
 * to every user-authored relation hop; the WhereBuilder compiles it into the hop's table source (a guarded
 * join / subquery), so an unreadable related row null-extends exactly like an absent one under any boolean
 * shape. `$` cannot appear in a GraphQL name, so the key can never arrive from user input.
 */
export const READ_GUARD_KEY = '$readGuard'

/**
 * Internal where key on a relation hop carrying the read predicate of the relation FIELD when it is stricter than
 * the source row's (a cell-level relation). It is a where over the SOURCE entity. The WhereBuilder makes the hop
 * read empty where the predicate does not hold, so a masked relation behaves exactly like an empty one.
 */
export const FIELD_GUARD_KEY = '$fieldGuard'

/**
 * Internal where key carrying, for each cell-level column of a where level, its condition (`where`, a single-field
 * where) together with the column's read predicate (`guard`). The WhereBuilder compiles each so that a masked cell
 * behaves exactly like a NULL value: the condition holds on a masked cell iff it holds on NULL. The cells sit next
 * to the other keys of the level, so the level keeps the shape the user wrote.
 */
export const MASKED_CELL_KEY = '$maskedCell'

export const isWhere = (value: Input.OptionalWhere[string]): value is Input.OptionalWhere =>
	value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)

export type MaskedCell = { guard: Input.OptionalWhere; where: Input.OptionalWhere }

export const parseMaskedCells = (value: Input.OptionalWhere[string]): MaskedCell[] => {
	if (!Array.isArray(value)) {
		throw new Error(`${MASKED_CELL_KEY} expects a list of masked cells`)
	}
	return value.map(cell => {
		if (!isWhere(cell) || !isWhere(cell.guard) || !isWhere(cell.where)) {
			throw new Error(`${MASKED_CELL_KEY} expects a guard and a where`)
		}
		return { guard: cell.guard, where: cell.where }
	})
}

/** Separates the field guard of a relation hop; undefined when the relation field is not cell-level. */
export const splitFieldGuard = (where: Input.OptionalWhere): { fieldGuard: Input.OptionalWhere | undefined; where: Input.OptionalWhere } => {
	const { [FIELD_GUARD_KEY]: fieldGuard, ...rest } = where
	return { fieldGuard: isWhere(fieldGuard) ? fieldGuard : undefined, where: rest }
}

export type HopGuards = { guard: Input.OptionalWhere; fieldGuard: Input.OptionalWhere; where: Input.OptionalWhere }

/** Separates the hop's read guards from the user-authored remainder; a guard is empty when absent. */
export const splitReadGuard = (where: Input.OptionalWhere): HopGuards => {
	const { [READ_GUARD_KEY]: guard, [FIELD_GUARD_KEY]: fieldGuard, ...rest } = where
	return { guard: isWhere(guard) ? guard : {}, fieldGuard: isWhere(fieldGuard) ? fieldGuard : {}, where: rest }
}

export class PredicatesInjector {
	/**
	 * Back-reference simplification is only sound for to-one back-hops. A to-one round-trip
	 * re-reaches the exact ancestor row (already verified readable), so its predicate can be dropped.
	 * A to-many back-hop reaches the ancestor's SIBLINGS, which are NOT guaranteed readable — dropping
	 * their row predicate would leak a value/presence oracle over unreadable rows. Fail-closed: only the
	 * types listed here simplify; anything else keeps the full predicate.
	 */
	private static readonly toOneBackReferenceTypes = new Set<Model.AnyRelationContext['type']>([
		'manyHasOne',
		'oneHasOneOwning',
		'oneHasOneInverse',
	])

	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	/**
	 * The entry entity resolves against the root grants only when it is the query root; anything reached over
	 * a relation - including a relation fetch that passes only its `relationContext` - picks up `through` grants.
	 */
	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		ancestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const scope: AclScope = !relationContext && (!ancestorPath || ancestorPath.length === 0) ? 'root' : 'nested'
		const restrictedWhere = this.injectToWhere(where, entity, true, relationContext, ancestorPath ?? [], scope)
		return this.createWhere(entity, restrictedWhere, relationContext, scope)
	}

	/**
	 * Row-level read predicate guarding a relation hop's target (the nested scope, since the target
	 * is reached through a relation). Empty when the target is freely readable, or when the hop is a to-one
	 * back-reference to an ancestor row that is already verified readable. Shared by the filter injection
	 * and the order-by join so both guard the same hop identically (they share the join alias).
	 */
	public createReadGuard(relationContext: Model.AnyRelationContext, ancestorPath: readonly Model.AnyRelationContext[]): Input.OptionalWhere {
		if (this.canSimplifyBackReference(ancestorPath, relationContext)) {
			return {}
		}
		return this.predicateFactory.create(relationContext.targetEntity, Acl.Operation.read, 'nested', undefined, relationContext)
	}

	/**
	 * A hop is a back-reference when it is the inverse of the hop that reached its source entity. Only the
	 * immediate parent counts: an earlier ancestor of the same entity is generally a different row.
	 */
	private canSimplifyBackReference(
		ancestorPath: readonly Model.AnyRelationContext[],
		relationContext: Model.AnyRelationContext,
	): boolean {
		const parent = ancestorPath[ancestorPath.length - 1]
		const isBackReference = parent !== undefined
			&& parent.targetRelation?.name === relationContext.relation.name
			&& parent.targetEntity.name === relationContext.entity.name
		return isBackReference && PredicatesInjector.toOneBackReferenceTypes.has(relationContext.type)
	}

	/**
	 * ANDs the row-level read predicate of the injection root onto `where` — the only place the row predicate
	 * lands in the WHERE; relation targets carry theirs in `READ_GUARD_KEY` instead.
	 */
	private createWhere(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationContext: Model.AnyRelationContext | undefined,
		scope: AclScope,
	): Input.OptionalWhere {
		const predicatesWhere = this.predicateFactory.create(entity, Acl.Operation.read, scope, undefined, relationContext)

		const and = [where, predicatesWhere].filter(it => Object.keys(it).length > 0)
		if (and.length === 0) {
			return {}
		}
		if (and.length === 1) {
			return and[0]
		}
		return { and: and }
	}

	private injectToWhere(
		where: Input.OptionalWhere,
		entity: Model.Entity,
		isRoot: boolean,
		relationContext: Model.AnyRelationContext | undefined,
		ancestorPath: readonly Model.AnyRelationContext[],
		scope: AclScope,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, ancestorPath, scope)
			)
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, ancestorPath, scope)
			)
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, isRoot, relationContext, ancestorPath, scope)
		}

		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))

		if (fields.length === 0) {
			return resultWhere
		}
		// Only cell-level fields (a read predicate stricter than the row-level one) need a guard of their own; the
		// row-level predicate is enforced once — in the WHERE of the injection root, or in the guarded source of a
		// relation hop. An empty column condition reads nothing, so a guard there would only filter by readability;
		// an empty relation condition can still test presence (`EXISTS`), so a relation keeps its guard.
		const isCellLevel = (field: string) => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, field, scope)
		const fieldGuard = (field: string) => this.predicateFactory.create(entity, Acl.Operation.read, scope, [field], relationContext)
		for (let field of fields) {
			resultWhere[field] = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => where[field],
				visitRelation: context => {
					const relationWhere = where[field] as Input.OptionalWhere | null
					if (relationWhere === null) {
						return null
					}
					const nestedAncestorPath: Model.AnyRelationContext[] = [...ancestorPath, context]
					const nestedWhere = this.injectToWhere(relationWhere, context.targetEntity, false, context, nestedAncestorPath, 'nested')
					const guard = this.createReadGuard(context, ancestorPath)
					return {
						...nestedWhere,
						...(Object.keys(guard).length > 0 ? { [READ_GUARD_KEY]: guard } : {}),
						...(isCellLevel(field) ? { [FIELD_GUARD_KEY]: fieldGuard(field) } : {}),
					}
				},
			})
		}
		const maskedColumns = fields.filter(it => isColumn(entity.fields[it]) && !this.isEmptyCondition(where[it]) && isCellLevel(it))
		if (maskedColumns.length === 0) {
			return resultWhere
		}
		resultWhere[MASKED_CELL_KEY] = maskedColumns.map(field => ({ guard: fieldGuard(field), where: { [field]: resultWhere[field] } }))
		for (const field of maskedColumns) {
			delete resultWhere[field]
		}
		return resultWhere
	}

	private isEmptyCondition(value: Input.OptionalWhere[string]): boolean {
		return isWhere(value) && Object.keys(value).length === 0
	}
}
