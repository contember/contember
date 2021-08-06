import { Input, Model } from '@contember/schema'
import { getColumnName } from '@contember/schema-utils'
import { SelectHydrator, SelectIndexedResultObjects, SelectResultObject } from './select'
import { PathFactory } from './select'
import * as database from '@contember/database'
import { Client, SelectBuilder } from '@contember/database'
import { SelectBuilderFactory } from './select'
import { PredicatesInjector } from '../acl'
import { WhereBuilder } from './select'
import { JunctionTableManager } from './JunctionTableManager'
import { DeletedEntitiesStorage, DeleteExecutor } from './delete'
import { MutationEntryNotFoundError, MutationResultList } from './Result'
import { Updater } from './update'
import { Inserter } from './insert'
import { tryMutation } from './ErrorUtils'
import { OrderByHelper } from './select'
import { ObjectNode, UniqueWhereExpander } from '../inputProcessing'
import { UpdateBuilder } from './update'
import { Mutex } from '../utils'
import { CheckedPrimary } from './CheckedPrimary'
import { ConstraintHelper } from '@contember/database'
import { ImplementationException } from '../exception'

export class Mapper {
	private primaryKeyCache: Record<string, Promise<string> | string> = {}
	public readonly deletedEntities = new DeletedEntitiesStorage()
	public readonly mutex = new Mutex()
	public readonly constraintHelper: ConstraintHelper

	constructor(
		private readonly schema: Model.Schema,
		public readonly db: database.Client,
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
		this.constraintHelper = new ConstraintHelper(db)
	}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = SelectBuilder.create() //
			.from(entity.tableName, 'root_')
			.select(['root_', columnName])
		const expandedWhere = this.uniqueWhereExpander.expand(entity, where)
		const builtQb = this.whereBuilder.build(qb, entity, this.pathFactory.create([]), expandedWhere)
		const result = await builtQb.getResult(this.db)

		return result[0] !== undefined ? result[0][columnName] : undefined
	}

	public async select(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>): Promise<SelectResultObject[]>
	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		indexBy: string,
	): Promise<SelectIndexedResultObjects>
	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		indexBy?: string,
	): Promise<SelectResultObject[] | SelectIndexedResultObjects> {
		const hydrator = new SelectHydrator()
		let qb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
		let indexByAlias: string | null = null
		if (indexBy) {
			const path = this.pathFactory.create([])
			indexByAlias = path.for(indexBy).getAlias()
			qb = qb.select([path.getAlias(), getColumnName(this.schema, entity, indexBy)], indexByAlias)
		}
		const rows = await this.selectRows(hydrator, qb, entity, input)

		return await (indexByAlias !== null ? hydrator.hydrateAll(rows, indexByAlias) : hydrator.hydrateAll(rows))
	}

	public async selectUnique(
		entity: Model.Entity,
		query: ObjectNode<Input.UniqueQueryInput>,
	): Promise<SelectResultObject | null> {
		const uniqueWhere = this.uniqueWhereExpander.expand(entity, query.args.by)
		const where = query.args.filter ? { and: [uniqueWhere, query.args.filter] } : uniqueWhere
		const queryExpanded = query.withArg<Input.ListQueryInput>('filter', where)

		return (await this.select(entity, queryExpanded))[0] || null
	}

	public async selectGrouped(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relation: Model.JoiningColumnRelation & Model.Relation,
	) {
		const hydrator = new SelectHydrator()
		let qb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
		const path = this.pathFactory.create([])
		const groupingKey = '__grouping_key'
		qb = qb.select([path.getAlias(), relation.joiningColumn.columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, input, relation.name)
		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows(
		hydrator: SelectHydrator,
		qb: SelectBuilder<SelectBuilder.Result>,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		groupBy?: string,
	) {
		const inputWithOrder = OrderByHelper.appendDefaultOrderBy(entity, input, [])
		const path = this.pathFactory.create([])
		const augmentedBuilder = qb.from(entity.tableName, path.getAlias()).meta('path', [...input.path, input.alias])

		const selector = this.selectBuilderFactory.create(augmentedBuilder, hydrator)
		const filterWithPredicates = this.predicatesInjector.inject(entity, inputWithOrder.args.filter || {})
		const inputWithPredicates = inputWithOrder.withArg('filter', filterWithPredicates)
		const selectPromise = selector.select(this, entity, inputWithPredicates, path, groupBy)
		const rows = await selector.execute(this.db)
		await selectPromise

		return rows
	}

	public async count(entity: Model.Entity, filter: Input.OptionalWhere) {
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.getAlias())
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
	): Promise<Record<string, number>> {
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.getAlias())
			.select(expr => expr.raw('count(*)'), 'row_count')
			.select([path.getAlias(), relation.joiningColumn.columnName])
			.groupBy([path.getAlias(), relation.joiningColumn.columnName])
		const withPredicates = this.predicatesInjector.inject(entity, filter)
		const qbWithWhere = this.whereBuilder.build(qb, entity, path, withPredicates)
		const rows = await qbWithWhere.getResult(this.db)
		const result = new Map<string, number>()
		for (const row of rows) {
			result.set(String(row[relation.joiningColumn.columnName]), Number(row.row_count))
		}
		return Object.fromEntries(result)
	}

	public async insert(entity: Model.Entity, data: Input.CreateDataInput): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(() =>
			this.inserter.insert(this, entity, data, id => {
				const where = { [entity.primary]: id }
				this.primaryKeyCache[this.hashWhere(entity.name, where)] = id
			}),
		)
	}

	public async update(
		entity: Model.Entity,
		by: Input.UniqueWhere,
		data: Input.UpdateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(async () => {
			const primaryValue = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				return [new MutationEntryNotFoundError([], by)]
			}
			return await this.updater.update(this, entity, primaryValue, data, filter)
		})
	}

	public async updateInternal(
		entity: Model.Entity,
		by: Input.UniqueWhere,
		predicateFields: string[],
		builderCb: (builder: UpdateBuilder) => void,
	): Promise<MutationResultList> {
		return tryMutation(async () => {
			const primaryValue = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				return [new MutationEntryNotFoundError([], by)]
			}
			return await this.updater.updateCb(this, entity, primaryValue, predicateFields, builderCb)
		})
	}

	public async upsert(
		entity: Model.Entity,
		by: Input.UniqueWhere,
		update: Input.UpdateDataInput,
		create: Input.CreateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(async () => {
			const primaryValue = await this.getPrimaryValue(entity, by)
			if (primaryValue === undefined) {
				return await this.inserter.insert(this, entity, create, id => {
					const where = { [entity.primary]: id }
					this.primaryKeyCache[this.hashWhere(entity.name, where)] = id
				})
			}
			return await this.updater.update(this, entity, primaryValue, update, filter)
		})
	}

	public async delete(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		if (entity.view) {
			throw new ImplementationException()
		}
		return tryMutation(() => this.deleteExecutor.execute(this, entity, by, filter))
	}

	public async connectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return await this.junctionTableManager.connectJunction(
			this.db,
			owningEntity,
			relation,
			owningPrimary,
			inversePrimary,
		)
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return await this.junctionTableManager.disconnectJunction(
			this.db,
			owningEntity,
			relation,
			owningPrimary,
			inversePrimary,
		)
	}

	public async getPrimaryValue(
		entity: Model.Entity,
		where: Input.UniqueWhere | CheckedPrimary,
	): Promise<Input.PrimaryValue | undefined> {
		if (where instanceof CheckedPrimary) {
			return where.primaryValue
		}
		const hash = this.hashWhere(entity.name, where)
		if (this.primaryKeyCache[hash]) {
			return this.primaryKeyCache[hash]
		}
		const primaryPromise = this.selectField(entity, where, entity.primary)
		this.primaryKeyCache[hash] = primaryPromise
		const primaryValue = await primaryPromise
		const uniqueFields = Object.keys(where)
		if (primaryValue && (uniqueFields.length !== 1 || uniqueFields[0] !== entity.primary)) {
			this.primaryKeyCache[this.hashWhere(entity.name, { [entity.primary]: primaryValue })] = primaryValue
		}
		return primaryValue
	}

	private hashWhere(entityName: string, where: Input.UniqueWhere): string {
		return JSON.stringify([entityName, where])
	}
}

export type MapperFactory = (db: Client) => Mapper
