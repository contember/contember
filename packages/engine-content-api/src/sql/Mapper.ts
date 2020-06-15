import { Input, Model } from '@contember/schema'
import { getColumnName } from '@contember/schema-utils'
import SelectHydrator from './select/SelectHydrator'
import Path from './select/Path'
import * as database from '@contember/database'
import { Client, SelectBuilder } from '@contember/database'
import SelectBuilderFactory from './select/SelectBuilderFactory'
import PredicatesInjector from '../acl/PredicatesInjector'
import WhereBuilder from './select/WhereBuilder'
import JunctionTableManager from './JunctionTableManager'
import DeleteExecutor from './delete/DeleteExecutor'
import { MutationResultList } from './Result'
import { Updater } from './update/Updater'
import { Inserter } from './insert/Inserter'
import { tryMutation } from './ErrorUtils'
import { OrderByHelper } from './select/OrderByHelper'
import { ObjectNode, UniqueWhereExpander } from '../inputProcessing'

class Mapper {
	private primaryKeyCache: Record<string, Promise<string> | string> = {}

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
	) {}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = SelectBuilder.create()
			.from(entity.tableName, 'root_')
			.select(['root_', columnName])
		const expandedWhere = this.uniqueWhereExpander.expand(entity, where)
		const builtQb = this.whereBuilder.build(qb, entity, new Path([]), expandedWhere)
		const result = await builtQb.getResult(this.db)

		return result[0] !== undefined ? result[0][columnName] : undefined
	}

	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
	): Promise<SelectHydrator.ResultObjects>
	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		indexBy: string,
	): Promise<SelectHydrator.IndexedResultObjects>
	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		indexBy?: string,
	): Promise<SelectHydrator.ResultObjects | SelectHydrator.IndexedResultObjects> {
		const hydrator = new SelectHydrator()
		let qb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
		let indexByAlias: string | null = null
		if (indexBy) {
			const path = new Path([])
			indexByAlias = path.for(indexBy).getAlias()
			qb = qb.select([path.getAlias(), getColumnName(this.schema, entity, indexBy)], indexByAlias)
		}
		const rows = await this.selectRows(hydrator, qb, entity, input)

		return await (indexByAlias !== null ? hydrator.hydrateAll(rows, indexByAlias) : hydrator.hydrateAll(rows))
	}

	public async selectUnique(
		entity: Model.Entity,
		query: ObjectNode<Input.UniqueQueryInput>,
	): Promise<SelectHydrator.ResultObject | null> {
		const where = this.uniqueWhereExpander.expand(entity, query.args.by)
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
		const path = new Path([])
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
		const path = new Path([])
		const augmentedBuilder = qb.from(entity.tableName, path.getAlias()).meta('path', [...input.path, input.alias])

		const selector = this.selectBuilderFactory.create(augmentedBuilder, hydrator)
		const filterWithPredicates = this.predicatesInjector.inject(entity, inputWithOrder.args.filter || {})
		const inputWithPredicates = inputWithOrder.withArg('filter', filterWithPredicates)
		const selectPromise = selector.select(this, entity, inputWithPredicates, path, groupBy)
		const rows = await selector.execute(this.db)
		await selectPromise

		return rows
	}

	public async count(entity: Model.Entity, filter: Input.Where) {
		const path = new Path([])
		const qb = SelectBuilder.create()
			.from(entity.tableName, path.getAlias())
			.select(expr => expr.raw('count(*)'), 'row_count')
		const withPredicates = this.predicatesInjector.inject(entity, filter)
		const qbWithWhere = this.whereBuilder.build(qb, entity, path, withPredicates)
		const result = await qbWithWhere.getResult(this.db)
		return result[0].row_count
	}

	public async insert(entity: Model.Entity, data: Input.CreateDataInput): Promise<MutationResultList> {
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
		filter?: Input.Where,
	): Promise<MutationResultList> {
		return tryMutation(() => this.updater.update(this, entity, by, data, filter))
	}

	public async delete(entity: Model.Entity, by: Input.UniqueWhere, filter?: Input.Where): Promise<MutationResultList> {
		return tryMutation(() => this.deleteExecutor.execute(this, entity, by, filter))
	}

	public async connectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return await this.junctionTableManager.connectJunction(
			this.db,
			owningEntity,
			relation,
			ownerPrimary,
			inversePrimary,
		)
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return await this.junctionTableManager.disconnectJunction(
			this.db,
			owningEntity,
			relation,
			ownerPrimary,
			inversePrimary,
		)
	}

	public async getPrimaryValue(
		entity: Model.Entity,
		where: Input.UniqueWhere,
	): Promise<Input.PrimaryValue | undefined> {
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

namespace Mapper {
	export type JoiningColumns = { sourceColumn: Model.JoiningColumn; targetColumn: Model.JoiningColumn }

	export type Factory = (db: Client) => Mapper
}

export default Mapper
