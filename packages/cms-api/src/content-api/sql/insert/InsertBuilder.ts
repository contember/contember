import { resolveValue } from '../utils'
import { Input, Model } from 'cms-common'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { Value } from '../../../core/knex/types'
import WhereBuilder from '../select/WhereBuilder'
import Path from '../select/Path'
import { getColumnName, getColumnType } from '../../../content-schema/modelUtils'
import Mapper from '../Mapper'
import SelectBuilder from '../../../core/knex/SelectBuilder'
import QueryBuilder from '../../../core/knex/QueryBuilder'

type ColumnValue<E = never> = {
	value: PromiseLike<Input.ColumnValue<E>>
	columnName: string
	columnType: string
}

export default class InsertBuilder {
	public readonly insert: Promise<Input.PrimaryValue>
	private firer: (() => void) = () => {
		throw new Error()
	}

	private rowData: ColumnValue<undefined>[] = []
	private where: Input.Where = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly db: KnexWrapper,
		private readonly whereBuilder: WhereBuilder
	) {
		const blocker: Promise<void> = new Promise(resolver => (this.firer = resolver))
		this.insert = this.createInsertPromise(blocker)
	}

	public addFieldValue(fieldName: string, value: Input.ColumnValueLike<undefined>) {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		this.rowData.push({ columnName, value: resolveValue(value), columnType })
	}

	public addWhere(where: Input.Where): void {
		this.where = { and: [where, this.where] }
	}

	public async execute(): Promise<Input.PrimaryValue> {
		this.firer()
		return this.insert
	}

	private async createInsertPromise(blocker: PromiseLike<void>): Promise<Input.PrimaryValue> {
		await blocker

		const resolvedValues = await Promise.all(this.rowData.map(it => it.value))
		const resolvedData = this.rowData.map((it, index) => ({ ...it, value: resolvedValues[index] }))
		const insertData = resolvedData.reduce<QueryBuilder.ColumnExpressionMap>(
			(result, item) => ({ ...result, [item.columnName]: expr => expr.select(['root_', item.columnName]) }),
			{}
		)
		const qb = this.db
			.insertBuilder()
			.with('root_', qb => {
				return resolvedData.reduce(
					(qb, value) => qb.select(expr => expr.selectValue(value.value as Value, value.columnType), value.columnName),
					qb
				)
			})
			.into(this.entity.tableName)
			.values(insertData)
			.from(qb => {
				qb = qb.from('root_')
				return this.whereBuilder.build(qb, this.entity, new Path([]), this.where)
			})
			.returning(this.entity.primaryColumn)

		const returning = await qb.execute()
		if (returning === null) {
			throw new Mapper.NoResultError()
		}

		return returning[0]
	}
}
