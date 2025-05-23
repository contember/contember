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
} from './select'
import { Client, Connection, ConstraintHelper, DatabaseMetadata, SelectBuilder } from '@contember/database'
import { PredicatesInjector } from '../acl'
import { JunctionTableManager } from './JunctionTableManager'
import { DeletedEntitiesStorage, DeleteExecutor } from './delete'
import { MutationEntryNotFoundError, MutationResultList } from './Result'
import { UpdateBuilder, Updater } from './update'
import { InsertBuilder, Inserter } from './insert'
import { tryMutation } from './ErrorUtils'
import { ObjectNode, UniqueWhereExpander } from '../inputProcessing'
import { Mutex } from '../utils'
import { CheckedPrimary } from './CheckedPrimary'
import { ImplementationException } from '../exception'
import { EventManager } from './EventManager'
import { MapperInput } from './types'

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

	public async select(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>, relationPath: Model.AnyRelationContext[]): Promise<SelectResultObject[]> {
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
		const filterWithPredicates = this.predicatesInjector.inject(entity, inputWithOrder.args.filter || {}, relationPath[relationPath.length - 1])
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
		const withPredicates = this.predicatesInjector.inject(entity, filter, relationPath[relationPath.length - 1])
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
		return tryMutation(this.schema, this.schemaDatabaseMetadata, () =>
			this.insertInternal(entity, data, builderCb),
		)
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
