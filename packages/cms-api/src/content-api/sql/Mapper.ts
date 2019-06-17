import { Acl, Input, Model } from 'cms-common'
import { acceptEveryFieldVisitor, getColumnName } from '../../content-schema/modelUtils'
import InsertVisitor from './insert/InsertVisitor'
import UpdateVisitor from './update/UpdateVisitor'
import ObjectNode from '../graphQlResolver/ObjectNode'
import SelectHydrator from './select/SelectHydrator'
import Path from './select/Path'
import Client from '../../core/database/Client'
import PredicateFactory from '../../acl/PredicateFactory'
import SelectBuilderFactory from './select/SelectBuilderFactory'
import InsertBuilderFactory from './insert/InsertBuilderFactory'
import UpdateBuilderFactory from './update/UpdateBuilderFactory'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import PredicatesInjector from '../../acl/PredicatesInjector'
import WhereBuilder from './select/WhereBuilder'
import JunctionTableManager from './JunctionTableManager'
import DeleteExecutor from './delete/DeleteExecutor'
import SelectBuilder from '../../core/database/SelectBuilder'

class Mapper {
	constructor(
		private readonly schema: Model.Schema,
		private readonly db: Client,
		private readonly predicateFactory: PredicateFactory,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly junctionTableManager: JunctionTableManager,
		private readonly deleteExecutor: DeleteExecutor
	) {}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = this.db
			.selectBuilder()
			.from(entity.tableName, 'root_')
			.select(['root_', columnName])
		const expandedWhere = this.uniqueWhereExpander.expand(entity, where)
		const builtQb = this.whereBuilder.build(qb, entity, new Path([]), expandedWhere)
		const result = await builtQb.getResult()

		return result[0] !== undefined ? result[0][columnName] : undefined
	}

	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>
	): Promise<SelectHydrator.ResultObjects>
	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		indexBy: string
	): Promise<SelectHydrator.IndexedResultObjects>
	public async select(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		indexBy?: string
	): Promise<SelectHydrator.ResultObjects | SelectHydrator.IndexedResultObjects> {
		const hydrator = new SelectHydrator()
		let qb: SelectBuilder<SelectBuilder.Result, 'select'> = this.db.selectBuilder()
		let indexByAlias: string | null = null
		if (indexBy) {
			const path = new Path([])
			indexByAlias = path.for(indexBy).getAlias()
			qb = qb.select([path.getAlias(), getColumnName(this.schema, entity, indexBy)], indexByAlias)
		}
		const rows = await this.selectRows(hydrator, qb, entity, input)

		return await (indexByAlias !== null ? hydrator.hydrateAll(rows, indexByAlias) : hydrator.hydrateAll(rows))
	}

	public async selectGrouped(
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		relation: Model.JoiningColumnRelation & Model.Relation
	) {
		const hydrator = new SelectHydrator()
		let qb: SelectBuilder<SelectBuilder.Result, 'select'> = this.db.selectBuilder()
		const path = new Path([])
		const groupingKey = '__grouping_key'
		qb = qb.select([path.getAlias(), relation.joiningColumn.columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, input, relation.name)
		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows<Filled extends keyof SelectBuilder.Options>(
		hydrator: SelectHydrator,
		qb: SelectBuilder<SelectBuilder.Result, Filled>,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		groupBy?: string
	) {
		const path = new Path([])
		const augmentedBuilder = qb.from(entity.tableName, path.getAlias()).meta('path', [...input.path, input.alias])

		const selector = this.selectBuilderFactory.create(augmentedBuilder, hydrator)
		const selectPromise = selector.select(entity, this.predicatesInjector.inject(entity, input), path, groupBy)
		const rows = await selector.execute()
		await selectPromise

		return rows
	}

	public async insert(entity: Model.Entity, data: Input.CreateDataInput): Promise<Input.PrimaryValue> {
		const where = this.predicateFactory.create(entity, Acl.Operation.create, Object.keys(data))
		const insertBuilder = this.insertBuilderFactory.create(entity)
		insertBuilder.addWhere(where)
		const promises = acceptEveryFieldVisitor(
			this.schema,
			entity,
			new InsertVisitor(this.schema, data, insertBuilder, this)
		)

		const result = await insertBuilder.execute()

		await Promise.all(Object.values(promises).filter((it: any) => !!it))

		return result
	}

	public async update(entity: Model.Entity, where: Input.UniqueWhere, data: Input.UpdateDataInput): Promise<number> {
		const primaryValue = await this.getPrimaryValue(entity, where)
		if (primaryValue === undefined) {
			return Promise.resolve(0)
		}

		const uniqueWhere = this.uniqueWhereExpander.expand(entity, where)
		const updateBuilder = this.updateBuilderFactory.create(entity, uniqueWhere)

		const predicateWhere = this.predicateFactory.create(entity, Acl.Operation.update, Object.keys(data))
		updateBuilder.addOldWhere(predicateWhere)
		updateBuilder.addNewWhere(predicateWhere)

		const updateVisitor = new UpdateVisitor(primaryValue, data, updateBuilder, this)
		const promises = acceptEveryFieldVisitor(this.schema, entity, updateVisitor)
		const executeResult = updateBuilder.execute()

		await Promise.all(Object.values(promises).filter((it: any) => !!it))

		const affectedRows = await executeResult

		if (affectedRows !== 1 && affectedRows !== null) {
			throw new Mapper.NoResultError()
		}

		return affectedRows || 0
	}

	public async delete(entity: Model.Entity, where: Input.UniqueWhere): Promise<void> {
		await this.deleteExecutor.execute(entity, where)
	}

	public async connectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere
	): Promise<void> {
		await this.junctionTableManager.connectJunction(owningEntity, relation, ownerUnique, inversedUnique)
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere
	): Promise<void> {
		await this.junctionTableManager.disconnectJunction(owningEntity, relation, ownerUnique, inversedUnique)
	}

	public async getPrimaryValue(
		entity: Model.Entity,
		where: Input.UniqueWhere
	): Promise<Input.PrimaryValue | undefined> {
		if (where[entity.primary] !== undefined) {
			return where[entity.primary] as Input.PrimaryValue
		}

		return this.selectField(entity, where, entity.primary)
	}
}

namespace Mapper {
	export class NoResultError extends Error {}

	export type JoiningColumns = { sourceColumn: Model.JoiningColumn; targetColumn: Model.JoiningColumn }
}

export default Mapper
