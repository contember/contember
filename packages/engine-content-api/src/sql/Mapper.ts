import { Acl, Input, Model } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, Providers } from '@contember/schema-utils'
import SqlCreateInputProcessor from './insert/SqlCreateInputProcessor'
import ObjectNode from '../graphQlResolver/ObjectNode'
import SelectHydrator from './select/SelectHydrator'
import Path from './select/Path'
import * as database from '@contember/database'
import PredicateFactory from '../acl/PredicateFactory'
import SelectBuilderFactory from './select/SelectBuilderFactory'
import InsertBuilderFactory from './insert/InsertBuilderFactory'
import UpdateBuilderFactory from './update/UpdateBuilderFactory'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import PredicatesInjector from '../acl/PredicatesInjector'
import WhereBuilder from './select/WhereBuilder'
import JunctionTableManager from './JunctionTableManager'
import DeleteExecutor from './delete/DeleteExecutor'
import { Client, SelectBuilder } from '@contember/database'
import CreateInputVisitor from '../inputProcessing/CreateInputVisitor'
import SqlUpdateInputProcessor from './update/SqlUpdateInputProcessor'
import UpdateInputVisitor from '../inputProcessing/UpdateInputVisitor'
import { ForeignKeyViolation, NotNullConstraintViolation, UniqueKeyViolation } from './Constraints'
import { NoResultError } from './NoResultError'
import { OrderByHelper } from './select/OrderByHelper'

class Mapper {
	constructor(
		private readonly schema: Model.Schema,
		public readonly db: database.Client,
		private readonly predicateFactory: PredicateFactory,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly selectBuilderFactory: SelectBuilderFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly junctionTableManager: JunctionTableManager,
		private readonly deleteExecutor: DeleteExecutor,
		private readonly providers: Providers,
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
		let qb: SelectBuilder<SelectBuilder.Result, 'select'> = SelectBuilder.create()
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
		let qb: SelectBuilder<SelectBuilder.Result, 'select'> = SelectBuilder.create()
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
		groupBy?: string,
	) {
		const inputWithOrder = OrderByHelper.appendDefaultOrderBy(entity, input, [])
		const path = new Path([])
		const augmentedBuilder = qb.from(entity.tableName, path.getAlias()).meta('path', [...input.path, input.alias])

		const selector = this.selectBuilderFactory.create(augmentedBuilder, hydrator)
		const selectPromise = selector.select(this, entity, this.predicatesInjector.inject(entity, inputWithOrder), path, groupBy)
		const rows = await selector.execute(this.db)
		await selectPromise

		return rows
	}

	public async insert(entity: Model.Entity, data: Input.CreateDataInput): Promise<Input.PrimaryValue> {
		const where = this.predicateFactory.create(entity, Acl.Operation.create, Object.keys(data))
		const insertBuilder = this.insertBuilderFactory.create(entity)
		insertBuilder.addWhere(where)

		const visitor = new CreateInputVisitor(
			new SqlCreateInputProcessor(insertBuilder, this, this.providers),
			this.schema,
			data,
		)
		const promises = acceptEveryFieldVisitor<any>(this.schema, entity, visitor)

		const promise = Promise.all(Object.values(promises).filter((it: any) => !!it))

		try {
			const result = await insertBuilder.execute(this.db)
			await promise

			return result
		} catch (e) {
			return this.handleError(e)
		}
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

		const updateVisitor = new SqlUpdateInputProcessor(primaryValue, data, updateBuilder, this)
		const visitor = new UpdateInputVisitor(updateVisitor, this.schema, data)
		const promises = acceptEveryFieldVisitor<any>(this.schema, entity, visitor)
		const executeResult = updateBuilder.execute(this.db)

		await Promise.all(Object.values(promises).filter((it: any) => !!it))

		try {
			const affectedRows = await executeResult
			if (affectedRows !== 1 && affectedRows !== null) {
				throw new NoResultError()
			}

			return affectedRows || 0
		} catch (e) {
			return this.handleError(e)
		}
	}

	public async delete(entity: Model.Entity, where: Input.UniqueWhere): Promise<void> {
		try {
			await this.deleteExecutor.execute(this.db, entity, where)
		} catch (e) {
			return this.handleError(e)
		}
	}

	public async connectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere,
	): Promise<void> {
		await this.junctionTableManager.connectJunction(this.db, owningEntity, relation, ownerUnique, inversedUnique)
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere,
	): Promise<void> {
		await this.junctionTableManager.disconnectJunction(this.db, owningEntity, relation, ownerUnique, inversedUnique)
	}

	public async getPrimaryValue(
		entity: Model.Entity,
		where: Input.UniqueWhere,
	): Promise<Input.PrimaryValue | undefined> {
		if (where[entity.primary] !== undefined) {
			return where[entity.primary] as Input.PrimaryValue
		}

		return this.selectField(entity, where, entity.primary)
	}

	private handleError(error: Error): never {
		if (error instanceof database.NotNullViolationError) {
			throw new NotNullConstraintViolation()
		}
		if (error instanceof database.ForeignKeyViolationError) {
			throw new ForeignKeyViolation()
		}
		if (error instanceof database.UniqueViolationError) {
			throw new UniqueKeyViolation()
		}
		throw error
	}
}

namespace Mapper {
	export type JoiningColumns = { sourceColumn: Model.JoiningColumn; targetColumn: Model.JoiningColumn }

	export type Factory = (db: Client) => Mapper
}

export default Mapper
