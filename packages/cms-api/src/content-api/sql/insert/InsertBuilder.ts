import { resolveValue } from '../utils'
import { Input, Model } from 'cms-common'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { Value } from '../../../core/knex/types'
import WhereBuilder from '../select/WhereBuilder'
import Path from '../select/Path'
import { getColumnName, getColumnType } from '../../../content-schema/modelUtils'
import QueryBuilder from '../../../core/knex/QueryBuilder'

type ColumnValue = {
	value: PromiseLike<Input.ColumnValue>
	columnName: string
	columnType: string
}

export default class InsertBuilder {
	public readonly insert: Promise<Input.PrimaryValue>
	private firer: (() => void) = () => {
		throw new Error()
	}

	private rowData: ColumnValue[] = []
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

	public addFieldValue(fieldName: string, value: Input.ColumnValueLike) {
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
		const qb = this.db.queryBuilder()
		const resolvedValues = await Promise.all(this.rowData.map(it => it.value))
		const resolvedData = this.rowData.map((it, index) => ({ ...it, value: resolvedValues[index] }))
		qb.with('root_', qb => {
			resolvedData.forEach(value => qb.selectValue(value.value as Value, value.columnType, value.columnName))
		})

		const insertData = resolvedData.reduce<QueryBuilder.ColumnExpressionMap>(
			(result, item) => ({ ...result, [item.columnName]: expr => expr.select(['root_', item.columnName]) }),
			{}
		)
		const returning = await qb.insertFrom(
			this.entity.tableName,
			insertData,
			qb => {
				qb.from('root_')
				this.whereBuilder.build(qb, this.entity, new Path([]), this.where)
			},
			this.entity.primaryColumn
		)

		return returning[0]
	}
}
