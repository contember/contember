import { Acl, Input, Model } from 'cms-common'
import { acceptEveryFieldVisitor, getColumnName } from '../../content-schema/modelUtils'
import InsertVisitor from './insert/InsertVisitor'
import UpdateVisitor from './update/UpdateVisitor'
import ObjectNode from '../graphQlResolver/ObjectNode'
import SelectHydrator from './select/SelectHydrator'
import Path from './select/Path'
import QueryBuilder from '../../core/knex/QueryBuilder'
import KnexWrapper from '../../core/knex/KnexWrapper'
import PredicateFactory from '../../acl/PredicateFactory'
import SelectBuilderFactory from './select/SelectBuilderFactory'
import InsertBuilderFactory from './insert/InsertBuilderFactory'
import UpdateBuilderFactory from './update/UpdateBuilderFactory'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import PredicatesInjector from '../../acl/PredicatesInjector'
import WhereBuilder from './select/WhereBuilder'
import JunctionTableManager from './JunctionTableManager'

class Mapper {
	constructor(
		private readonly schema: Model.Schema,
		private readonly db: KnexWrapper,
		private readonly predicateFactory: PredicateFactory,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly junctionTableManager: JunctionTableManager
	) {}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = this.db.queryBuilder()
		const expandedWhere = this.uniqueWhereExpander.expand(entity, where)
		qb.from(entity.tableName, 'root_')
		qb.select(['root_', columnName])
		this.whereBuilder.build(qb, entity, new Path([]), expandedWhere)
		const result = await qb.getResult()

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
		const qb = this.db.queryBuilder()
		let indexByAlias: string | null = null
		if (indexBy) {
			const path = new Path([])
			indexByAlias = path.for(indexBy).getAlias()
			qb.select([path.getAlias(), getColumnName(this.schema, entity, indexBy)], indexByAlias)
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
		const qb = this.db.queryBuilder()
		const path = new Path([])
		const groupingKey = '__grouping_key'
		qb.select([path.getAlias(), relation.joiningColumn.columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, input, relation.name)
		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows(
		hydrator: SelectHydrator,
		qb: QueryBuilder,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		groupBy?: string
	) {
		const path = new Path([])
		qb.from(entity.tableName, path.getAlias())

		const selector = this.selectBuilderFactory.create(qb, hydrator)
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

		await Promise.all(Object.values(promises).filter(it => !!it))

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

		await Promise.all(Object.values(promises).filter(it => !!it))

		const affectedRows = await executeResult

		if (affectedRows !== 1 && affectedRows !== null) {
			throw new Mapper.NoResultError()
		}

		return affectedRows || 0
	}

	public async delete(entity: Model.Entity, where: Input.UniqueWhere): Promise<void> {
		const qb = this.db.queryBuilder()
		qb.from(entity.tableName)
		qb.where(condition =>
			condition.in(entity.primaryColumn, qb => {
				qb.from(entity.tableName, 'root_')
				qb.select(['root_', entity.primaryColumn])
				const uniqueWhere = this.uniqueWhereExpander.expand(entity, where)
				const predicate = this.predicateFactory.create(entity, Acl.Operation.delete)
				this.whereBuilder.build(qb, entity, new Path([]), { and: [uniqueWhere, predicate] })
			})
		)

		const affectedRows = await qb.delete()

		if (affectedRows !== 1) {
			throw new Mapper.NoResultError()
		}
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
