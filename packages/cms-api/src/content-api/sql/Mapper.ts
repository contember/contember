import { Acl, Input, Model } from 'cms-common'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import { acceptEveryFieldVisitor, getColumnName, getEntity, getTargetEntity } from '../../content-schema/modelUtils'
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
import InsertBuilder from '../../core/knex/InsertBuilder'

export default class Mapper {
	constructor(
		private readonly schema: Model.Schema,
		private readonly db: KnexWrapper,
		private readonly predicateFactory: PredicateFactory,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder
	) {}

	public async selectField(entity: Model.Entity, where: Input.UniqueWhere, fieldName: string) {
		const columnName = getColumnName(this.schema, entity, fieldName)

		const qb = this.db.queryBuilder()
		qb.from(entity.tableName)
		qb.select(columnName)
		qb.where(this.getUniqueWhereArgs(entity, where))
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

	public async selectGrouped(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>, columnName: string) {
		const hydrator = new SelectHydrator()
		const qb = this.db.queryBuilder()
		const path = new Path([])
		const groupingKey = '__grouping_key'
		qb.select([path.getAlias(), columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, input)
		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows(
		hydrator: SelectHydrator,
		qb: QueryBuilder,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>
	) {
		const path = new Path([])
		qb.from(entity.tableName, path.getAlias())

		const selector = this.selectBuilderFactory.create(this, qb, hydrator)
		const selectPromise = selector.select(entity, this.predicatesInjector.inject(entity, input))
		const rows = await selector.execute()
		await selectPromise

		return rows
	}

	public async insert(entity: Model.Entity, data: Input.CreateDataInput): Promise<Input.PrimaryValue> {
		const where = this.predicateFactory.create(entity, Acl.Operation.create, Object.keys(data))
		const insertBuilder = this.insertBuilderFactory.create(entity, this.db)
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

		this.checkUniqueWhere(entity, where)

		const uniqueWhere = this.uniqueWhereExpander.expand(entity, where)
		const updateBuilder = this.updateBuilderFactory.create(entity, this.db, uniqueWhere)

		const predicateWhere = this.predicateFactory.create(entity, Acl.Operation.update, Object.keys(data))
		updateBuilder.addOldWhere(predicateWhere)
		updateBuilder.addNewWhere(predicateWhere)

		const updateVisitor = new UpdateVisitor(primaryValue, data, updateBuilder, this)
		const promises = acceptEveryFieldVisitor(this.schema, entity, updateVisitor)
		const executeResult = updateBuilder.execute()

		await Promise.all(Object.values(promises).filter(it => !!it))

		return await executeResult
	}

	public async delete(entity: Model.Entity, where: Input.UniqueWhere): Promise<number> {
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

		return await qb.delete()
	}

	public async connectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere
	) {
		const joiningTable = relation.joiningTable
		const primaryValue = await this.getPrimaryValue(owningEntity, ownerUnique)
		const inversedPrimaryValue = await this.getPrimaryValue(getEntity(this.schema, relation.target), inversedUnique)
		const owningPredicate = this.predicateFactory.create(owningEntity, Acl.Operation.update, [relation.name])
		let inversePredicate: Input.Where = {}
		let inversedEntity: Model.Entity | null = null
		if (relation.inversedBy) {
			inversedEntity = getTargetEntity(this.schema, owningEntity, relation.name)
			if (!inversedEntity) {
				throw new Error()
			}
			inversePredicate = this.predicateFactory.create(inversedEntity, Acl.Operation.update, [relation.inversedBy])
		}

		const qb = this.db
			.insertBuilder()
			.into(joiningTable.tableName)
			.values({
				[joiningTable.joiningColumn.columnName]: expr => expr.selectValue(primaryValue),
				[joiningTable.inverseJoiningColumn.columnName]: expr => expr.selectValue(inversedPrimaryValue)
			})
			.from(qb => {
				qb.from(qb.raw('(values (null))'), 't')

				if (Object.keys(owningPredicate).length > 0) {
					const owningPath = new Path([], 'owning')
					qb.join(owningEntity.tableName, 'owning', condition =>
						condition.compare(['owning', owningEntity.primaryColumn], '=', primaryValue)
					)
					this.whereBuilder.build(qb, owningEntity, owningPath, owningPredicate)
				}
				if (inversedEntity && Object.keys(inversePredicate).length > 0) {
					const inversedEntityConst = inversedEntity
					const inversedPath = new Path([], 'inversed')
					qb.join(inversedEntity.tableName, 'inversed', condition =>
						condition.compare(['inversed', inversedEntityConst.primaryColumn], '=', inversedPrimaryValue)
					)
					this.whereBuilder.build(qb, inversedEntity, inversedPath, inversePredicate)
				}
			})
			.onConflict(InsertBuilder.ConflictAction.doNothing)

		return await qb.execute()
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere
	) {
		const joiningTable = relation.joiningTable
		const owningPredicate = this.predicateFactory.create(owningEntity, Acl.Operation.update, [relation.name])
		const targetEntity = getEntity(this.schema, relation.target)
		if (!targetEntity) {
			throw new Error()
		}
		let inversePredicate: Input.Where = {}
		if (relation.inversedBy) {
			inversePredicate = this.predicateFactory.create(targetEntity, Acl.Operation.update, [relation.inversedBy])
		}

		const qb = this.db.queryBuilder()
		qb.table(joiningTable.tableName)
		qb.where(cond =>
			cond.in(joiningTable.joiningColumn.columnName, qb => {
				qb.select(['root_', owningEntity.primaryColumn])
				qb.from(owningEntity.tableName, 'root_')
				this.whereBuilder.build(qb, owningEntity, new Path([]), {
					and: [this.uniqueWhereExpander.expand(owningEntity, ownerUnique), owningPredicate]
				})
			})
		)
		qb.where(cond =>
			cond.in(joiningTable.inverseJoiningColumn.columnName, qb => {
				qb.from(targetEntity.tableName, 'root_')
				qb.select(['root_', targetEntity.primaryColumn])

				this.whereBuilder.build(qb, targetEntity, new Path([]), {
					and: [this.uniqueWhereExpander.expand(targetEntity, inversedUnique), inversePredicate]
				})
			})
		)

		return await qb.delete()
	}

	public async fetchJunction(
		relation: Model.ManyHasManyOwnerRelation,
		values: Input.PrimaryValue[],
		column: Model.JoiningColumn
	): Promise<object[]> {
		const joiningTable = relation.joiningTable

		const whereColumn = column.columnName
		const qb = this.db.queryBuilder()
		qb.from(joiningTable.tableName)
		qb.select(joiningTable.inverseJoiningColumn.columnName)
		qb.select(joiningTable.joiningColumn.columnName)
		qb.where(clause => clause.in([joiningTable.tableName, whereColumn], values))

		return await qb.getResult()
	}

	public async getPrimaryValue(entity: Model.Entity, where: Input.UniqueWhere) {
		if (where[entity.primary] !== undefined) {
			return where[entity.primary]
		}

		const whereArgs = this.getUniqueWhereArgs(entity, where)
		const qb = this.db.queryBuilder()
		qb.from(entity.tableName)
		qb.select(entity.primaryColumn)
		qb.where(whereArgs)

		const result = await qb.getResult()

		return result[0] !== undefined ? result[0][entity.primaryColumn] : undefined
	}

	private getUniqueWhereArgs(
		entity: Model.Entity,
		where: Input.UniqueWhere
	): { [columnName: string]: string | number } {
		if (!isUniqueWhere(entity, where)) {
			throw new Error('Unique where is not unique')
		}
		const whereArgs: { [columnName: string]: string | number } = {}
		for (const field in where) {
			whereArgs[getColumnName(this.schema, entity, field)] = where[field]
		}

		return whereArgs
	}

	private checkUniqueWhere(entity: Model.Entity, where: Input.UniqueWhere): void {
		if (!isUniqueWhere(entity, where)) {
			throw new Error('Unique where is not unique')
		}
	}
}
