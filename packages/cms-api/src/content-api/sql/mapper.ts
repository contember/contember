import { Input, Model } from 'cms-common'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import { acceptEveryFieldVisitor, getColumnName, getEntity } from '../../content-schema/modelUtils'
import KnexConnection from '../../core/knex/KnexConnection'
import InsertBuilder from './insert/InsertBuilder'
import InsertVisitor from './insert/InsertVisitor'
import UpdateVisitor from './update/UpdateVisitor'
import UpdateBuilder from './update/UpdateBuilder'
import ObjectNode from '../graphQlResolver/ObjectNode'
import SelectHydrator from './select/SelectHydrator'
import SelectBuilder from './select/SelectBuilder'
import JoinBuilder from './select/JoinBuilder'
import WhereBuilder from './select/WhereBuilder'
import ConditionBuilder from './select/ConditionBuilder'
import Path from './select/Path'
import QueryBuilder from '../../core/knex/QueryBuilder'
import KnexWrapper from '../../core/knex/KnexWrapper'

export default class Mapper {
	private schema: Model.Schema
	private db: KnexWrapper

	constructor(schema: Model.Schema, db: KnexWrapper) {
		this.schema = schema
		this.db = db
	}

	public static run(schema: Model.Schema, db: KnexConnection, cb: (mapper: Mapper) => void) {
		return db.wrapper().transaction(trx => {
			const mapper = new Mapper(schema, trx)
			return cb(mapper)
		})
	}

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
		const rows = await this.selectRows(hydrator, qb, entity, selector => selector.select(entity, input))

		return await (indexByAlias !== null ? hydrator.hydrateAll(rows, indexByAlias) : hydrator.hydrateAll(rows))
	}

	public async selectGrouped(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>, columnName: string) {
		const hydrator = new SelectHydrator()
		const qb = this.db.queryBuilder()
		const path = new Path([])
		const groupingKey = '__grouping_key'
		qb.select([path.getAlias(), columnName], groupingKey)

		const rows = await this.selectRows(hydrator, qb, entity, selector => selector.select(entity, input))
		return await hydrator.hydrateGroups(rows, groupingKey)
	}

	private async selectRows(
		hydrator: SelectHydrator,
		qb: QueryBuilder,
		entity: Model.Entity,
		selectHandler: (selector: SelectBuilder) => Promise<void>
	) {
		let resolver: (() => any) = () => {
			throw new Error()
		}
		const joinBuilder = new JoinBuilder(this.schema)
		const conditionBuilder = new ConditionBuilder()
		const whereBuilder = new WhereBuilder(this.schema, joinBuilder, conditionBuilder)

		const path = new Path([])
		qb.from(entity.tableName, path.getAlias())

		const selector = new SelectBuilder(
			this.schema,
			joinBuilder,
			whereBuilder,
			this,
			qb,
			hydrator,
			new Promise(resolve => (resolver = resolve))
		)
		const selectPromise = selectHandler(selector)
		resolver()
		const rows = await selector.rows
		await selectPromise

		return rows
	}

	public async insert(entity: Model.Entity, data: Input.CreateDataInput): Promise<Input.PrimaryValue> {
		let resolver: (() => any) = () => {
			throw new Error()
		}
		const insertBuilder = new InsertBuilder(
			entity.tableName,
			entity.primaryColumn,
			this.db,
			new Promise(resolve => (resolver = resolve))
		)
		const promises = acceptEveryFieldVisitor(this.schema, entity, new InsertVisitor(this.schema, data, insertBuilder, this))
		resolver()

		const result = await insertBuilder.insertRow()

		await Promise.all(Object.values(promises).filter(it => !!it))

		return result
	}

	public async update(entity: Model.Entity, where: Input.UniqueWhere, data: Input.UpdateDataInput): Promise<number> {
		const primaryValue = await this.getPrimaryValue(entity, where)
		if (primaryValue === undefined) {
			return Promise.resolve(0)
		}
		let resolver: (() => any) = () => {
			throw new Error()
		}
		const updateBuilder = new UpdateBuilder(
			entity.tableName,
			this.getUniqueWhereArgs(entity, where),
			this.db,
			new Promise(resolve => (resolver = resolve))
		)
		const promises = acceptEveryFieldVisitor(
			this.schema,
			entity,
			new UpdateVisitor(primaryValue, data, updateBuilder, this)
		)
		resolver()

		await Promise.all(Object.values(promises).filter(it => !!it))

		return await updateBuilder.updateRow()
	}

	public async delete(entity: Model.Entity, where: Input.UniqueWhere): Promise<number> {
		const qb = this.db.queryBuilder()
		qb.from(entity.tableName)
		qb.where(this.getUniqueWhereArgs(entity, where))
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

		const qb = this.db.queryBuilder()
		qb.table(joiningTable.tableName)
		return await qb.insertIgnore({
			[joiningTable.joiningColumn.columnName]: primaryValue,
			[joiningTable.inverseJoiningColumn.columnName]: inversedPrimaryValue
		})
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere
	) {
		const joiningTable = relation.joiningTable
		const qb = this.db.queryBuilder()
		qb.table(joiningTable.tableName)

		qb.where({
			[joiningTable.joiningColumn.columnName]: await this.getPrimaryValue(owningEntity, ownerUnique),
			[joiningTable.inverseJoiningColumn.columnName]: await this.getPrimaryValue(
				getEntity(this.schema, relation.target),
				inversedUnique
			)
		})
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
}
