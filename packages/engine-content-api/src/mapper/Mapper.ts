import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getColumnName } from '@contember/schema-utils'
import {
	OrderByHelper,
	PathFactory,
	SelectBuilderFactory,
	SelectGroupedObjects,
	SelectHydrator,
	SelectIndexedResultObjects,
	SelectResultObject,
	WhereBuilder,
} from './select/index.js'
import { Client, Connection, ConstraintHelper, DatabaseMetadata, Operator, SelectBuilder } from '@contember/database'
import { PredicatesInjector } from '../acl/index.js'
import { JunctionTableManager } from './JunctionTableManager.js'
import { DeletedEntitiesStorage, DeleteExecutor } from './delete/index.js'
import { MutationEntryNotFoundError, MutationResultList } from './Result.js'
import { UpdateBuilder, Updater } from './update/index.js'
import { InsertBuilder, Inserter } from './insert/index.js'
import { tryMutation } from './ErrorUtils.js'
import { ObjectNode, UniqueWhereExpander } from '../inputProcessing/index.js'
import { Mutex } from '../utils/index.js'
import { CheckedPrimary } from './CheckedPrimary.js'
import { ImplementationException } from '../exception.js'
import { EventManager } from './EventManager.js'
import { MapperInput } from './types.js'

export class Mapper<ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike> {
	private systemVariablesSetupDone: Promise<void> | undefined
	public readonly deletedEntities = new DeletedEntitiesStorage()
	public readonly mutex = new Mutex()
	public readonly constraintHelper: ConstraintHelper

	public readonly eventManager: EventManager

	constructor(
		public readonly db: Client<ConnectionType>,
		public readonly identityId: string,
		public readonly transactionId: string,
		private readonly schema: Model.Schema,
		private readonly schemaDatabaseMetadata: DatabaseMetadata,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly junctionTableManager: JunctionTableManager,
		private readonly deleteExecutor: DeleteExecutor,
		private readonly updater: Updater,
		private readonly inserter: Inserter,
		private readonly pathFactory: PathFactory,
	) {
		this.constraintHelper = new ConstraintHelper(db, this.schemaDatabaseMetadata)
		this.eventManager = new EventManager(this)
	}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere | CheckedPrimary, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = SelectBuilder.create() //
			.from(entity.tableName, 'root_')
			.select(['root_', columnName])
		const expandedWhere = this.uniqueWhereExpander.expand(entity, where)
		const withPredicates = this.predicatesInjector.inject(entity, expandedWhere)
		const builtQb = this.whereBuilder.build(qb, entity, this.pathFactory.create([]), withPredicates)
		const result = await builtQb.getResult(this.db)

		return result[0] !== undefined ? result[0][columnName] : undefined
	}

	public async selectAssoc(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relationPath: Model.AnyRelationContext[],
		indexBy: string,
	): Promise<SelectIndexedResultObjects> {
		const hydrator = new SelectHydrator()
		const path = this.pathFactory.create([])
		const indexByAlias: string = path.for(indexBy).alias
		const qb: SelectBuilder = SelectBuilder.create()
			.select([path.alias, getColumnName(this.schema, entity, indexBy)], indexByAlias)
		const rows = await this.selectRows(hydrator, qb, entity, input, relationPath)
		return await hydrator.hydrateAll(rows, indexByAlias)
	}

	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relationPath: Model.AnyRelationContext[],
	): Promise<SelectResultObject[]> {
		const hydrator = new SelectHydrator()
		const qb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()

		const rows = await this.selectRows(hydrator, qb, entity, input, relationPath)

		return await hydrator.hydrateAll(rows)
	}

	public async selectUnique(
		entity: Model.Entity,
		query: ObjectNode<Input.UniqueQueryInput>,
		relationPath: Model.AnyRelationContext[],
	): Promise<SelectResultObject | null> {
		const uniqueWhere = this.uniqueWhereExpander.expand(entity, query.args.by)
		const where = query.args.filter ? { and: [uniqueWhere, query.args.filter] } : uniqueWhere
		const queryExpanded = query.withArg<Input.ListQueryInput>('filter', where)

		const rows = await this.select(entity, queryExpanded, relationPath)

		return rows[0] ?? null
	}

	public async selectGrouped(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relation: Model.JoiningColumnRelation & Model.AnyRelation,
		relationPath: Model.AnyRelationContext[],
	): Promise<SelectGroupedObjects> {
		const hydrator = new SelectHydrator()
		const path = this.pathFactory.create([])
		const groupingKey = '__grouping_key'
		const qb: SelectBuilder = SelectBuilder.create()
			.select([path.alias, relation.joiningColumn.columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, input, relationPath, relation.name)

		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows(
		hydrator: SelectHydrator,
		qb: SelectBuilder<SelectBuilder.Result>,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relationPath: Model.AnyRelationContext[],
		groupBy?: string,
	) {
		const inputWithOrder = OrderByHelper.appendDefaultOrderBy(entity, input, undefined)
		const path = this.pathFactory.create([])
		const augmentedBuilder = qb.from(entity.tableName, path.alias).meta('path', [...input.path, input.alias])

		const selector = this.selectBuilderFactory.create(augmentedBuilder, hydrator, relationPath)
		const filterWithPredicates = this.predicatesInjector.inject(
			entity,
			inputWithOrder.args.filter || {},
			relationPath[relationPath.length - 1],
			relationPath,
		)
		const inputWithPredicates = inputWithOrder.withArg('filter', filterWithPredicates)
		selector.select(this, entity, inputWithPredicates, path, groupBy)
		return await selector.execute(this.db)
	}

	public async count(entity: Model.Entity, filter: Input.OptionalWhere) {
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.alias)
			.select(expr => expr.raw('count(*)'), 'row_count')
		const withPredicates = this.predicatesInjector.inject(entity, filter)
		const qbWithWhere = this.whereBuilder.build(qb, entity, path, withPredicates)
		const result = await qbWithWhere.getResult(this.db)
		return result[0].row_count
	}

	public async countGrouped(
		entity: Model.Entity,
		filter: Input.OptionalWhere,
		relation: Model.JoiningColumnRelation & Model.Relation,
		relationPath: Model.AnyRelationContext[],
	): Promise<Record<string, number>> {
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.alias)
			.select(expr => expr.raw('count(*)'), 'row_count')
			.select([path.alias, relation.joiningColumn.columnName])
			.groupBy([path.alias, relation.joiningColumn.columnName])
		const withPredicates = this.predicatesInjector.inject(entity, filter, relationPath[relationPath.length - 1], relationPath)
		const qbWithWhere = this.whereBuilder.build(qb, entity, path, withPredicates, { relationPath })
		const rows = await qbWithWhere.getResult(this.db)
		const result = new Map<string, number>()
		for (const row of rows) {
			result.set(String(row[relation.joiningColumn.columnName]), Number(row.row_count))
		}
		return Object.fromEntries(result)
	}

	public async insert(
		entity: Model.Entity,
		data: MapperInput.CreateDataInput,
		builderCb: (builder: InsertBuilder) => void = () => {},
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		await this.setupSystemVariables()
		return tryMutation(this.schema, this.schemaDatabaseMetadata, () => this.insertInternal(entity, data, builderCb))
	}

	public async update(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		data: MapperInput.UpdateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		await this.setupSystemVariables()
		return tryMutation(this.schema, this.schemaDatabaseMetadata, async () => {
			const [primaryValue, err] = await this.getPrimaryValue(entity, by)
			if (err) return [err]

			return await this.updater.update(this, entity, primaryValue, data, filter)
		})
	}

	public async updateInternal(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		builderCb: (builder: UpdateBuilder) => void,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		await this.setupSystemVariables()
		return tryMutation(this.schema, this.schemaDatabaseMetadata, async () => {
			const [primaryValue, err] = await this.getPrimaryValue(entity, by)
			if (err) return [err]

			return await this.updater.updateCb(this, entity, primaryValue, builderCb)
		})
	}
	public async upsert(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		update: MapperInput.UpdateDataInput,
		create: MapperInput.CreateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		await this.setupSystemVariables()
		return tryMutation(this.schema, this.schemaDatabaseMetadata, async () => {
			const [primaryValue] = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				return await this.insertInternal(entity, create)
			}
			return await this.updater.update(this, entity, primaryValue, update, filter)
		})
	}

	private insertInternal(entity: Model.Entity, data: MapperInput.CreateDataInput, builderCb: (builder: InsertBuilder) => void = () => {}) {
		return this.inserter.insert(this, entity, data, id => {
		}, builderCb)
	}

	public async delete(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		await this.setupSystemVariables()
		return tryMutation(this.schema, this.schemaDatabaseMetadata, () => {
			return this.deleteExecutor.execute(this, entity, by, filter)
		})
	}

	public async connectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		await this.setupSystemVariables()
		const err = () => {
			throw new ImplementationException()
		}
		return await acceptFieldVisitor(this.schema, entity, relation, {
			visitManyHasManyOwning: ({ entity, relation }) => {
				return this.junctionTableManager.connectJunction(this, entity, relation, thisPrimary, otherPrimary)
			},
			visitManyHasManyInverse: ({ targetEntity, targetRelation }) => {
				return this.junctionTableManager.connectJunction(this, targetEntity, targetRelation, otherPrimary, thisPrimary)
			},
			visitColumn: err,
			visitOneHasMany: err,
			visitOneHasOneInverse: err,
			visitOneHasOneOwning: err,
			visitManyHasOne: err,
		})
	}

	public async disconnectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		await this.setupSystemVariables()
		const err = () => {
			throw new ImplementationException()
		}
		return await acceptFieldVisitor(this.schema, entity, relation, {
			visitManyHasManyOwning: ({ entity, relation }) => {
				return this.junctionTableManager.disconnectJunction(this, entity, relation, thisPrimary, otherPrimary)
			},
			visitManyHasManyInverse: ({ targetEntity, targetRelation }) => {
				return this.junctionTableManager.disconnectJunction(this, targetEntity, targetRelation, otherPrimary, thisPrimary)
			},
			visitColumn: err,
			visitOneHasMany: err,
			visitOneHasOneInverse: err,
			visitOneHasOneOwning: err,
			visitManyHasOne: err,
		})
	}

	/**
	 * Fetches the primary values of entities currently in a has-many relation of the given owner.
	 * Used by the declarative `set` operation to compute orphans. Respects ACL read predicates on the target entity.
	 */
	public async fetchHasManyPrimaries(
		context: Model.OneHasManyContext | Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext,
		ownerPrimary: Input.PrimaryValue,
	): Promise<Input.PrimaryValue[]> {
		if (context.type === 'oneHasMany') {
			const { targetEntity, targetRelation } = context
			const where: Input.OptionalWhere = {
				[targetRelation.name]: { [context.entity.primary]: { eq: ownerPrimary } },
			}
			const withPredicates = this.predicatesInjector.inject(targetEntity, where)
			const path = this.pathFactory.create([])
			const qb = SelectBuilder.create()
				.from(targetEntity.tableName, path.alias)
				.select([path.alias, targetEntity.primaryColumn], 'primary_')
			const built = this.whereBuilder.build(qb, targetEntity, path, withPredicates)
			const rows = await built.getResult(this.db)
			return rows.map(it => it.primary_ as Input.PrimaryValue)
		}

		// many-has-many: read from the junction table via the owning side
		const owningContext = context.type === 'manyHasManyOwning'
			? { entity: context.entity, relation: context.relation, ownerIsJoining: true }
			: { entity: context.targetEntity, relation: context.targetRelation, ownerIsJoining: false }
		const targetEntity = context.targetEntity
		const joiningTable = owningContext.relation.joiningTable
		const ownerColumn = owningContext.ownerIsJoining ? joiningTable.joiningColumn.columnName : joiningTable.inverseJoiningColumn.columnName
		const targetColumn = owningContext.ownerIsJoining ? joiningTable.inverseJoiningColumn.columnName : joiningTable.joiningColumn.columnName

		// Apply the target entity's ACL read predicate so that members the current role cannot read
		// are excluded from the orphan computation (left untouched), matching the oneHasMany behavior.
		// `inject` returns an empty where when there is no read predicate, in which case the junction
		// is read directly with no join, preserving the permissive/no-ACL query unchanged.
		const readPredicate = this.predicatesInjector.inject(targetEntity, {})
		const hasReadPredicate = Object.keys(readPredicate).length > 0

		let qb = SelectBuilder.create()
			.from(joiningTable.tableName, 'junction_')
			.select(['junction_', targetColumn], 'primary_')
			.where(cond => cond.compare(['junction_', ownerColumn], Operator.eq, ownerPrimary))

		if (hasReadPredicate) {
			const path = this.pathFactory.create([])
			qb = qb.join(
				targetEntity.tableName,
				path.alias,
				clause => clause.compareColumns(['junction_', targetColumn], Operator.eq, [path.alias, targetEntity.primaryColumn]),
			)
			qb = this.whereBuilder.build(qb, targetEntity, path, readPredicate)
		}

		const rows = await qb.getResult(this.db)
		return rows.map(it => it.primary_ as Input.PrimaryValue)
	}

	public async getPrimaryValue(
		entity: Model.Entity,
		where: Input.UniqueWhere | CheckedPrimary,
	): Promise<[Input.PrimaryValue, undefined] | [undefined, MutationEntryNotFoundError]> {
		if (where instanceof CheckedPrimary) {
			return [where.primaryValue, undefined]
		}
		const result = await this.selectField(entity, where, entity.primary)
		return result ? [result, undefined] : [undefined, new MutationEntryNotFoundError([], where)]
	}

	private async setupSystemVariables() {
		this.systemVariablesSetupDone ??= (async () => {
			await this.db.query('SELECT set_config(?, ?, false)', ['tenant.identity_id', this.identityId]) // todo rename to system.identity_id
			await this.db.query('SELECT set_config(?, ?, false)', ['system.transaction_id', this.transactionId])
		})()
		await this.systemVariablesSetupDone
	}
}
