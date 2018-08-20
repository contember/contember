import { resolveValue } from '../utils'
import { promiseAllObject } from '../../../utils/promises'
import * as Knex from 'knex'
import { Input } from 'cms-common'
import KnexWrapper from '../../../core/knex/KnexWrapper'

export default class InsertBuilder {
	private rowData: { [columnName: string]: PromiseLike<Input.ColumnValue> } = {}

	private tableName: string
	private primaryColumn: string
	private db: KnexWrapper
	private insertPromise: Promise<Input.PrimaryValue>

	constructor(tableName: string, primaryColumn: string, db: KnexWrapper, firer: PromiseLike<void>) {
		this.tableName = tableName
		this.primaryColumn = primaryColumn
		this.db = db
		this.insertPromise = this.createInsertPromise(firer)
	}

	public addColumnData(columnName: string, value: Input.ColumnValueLike) {
		this.rowData[columnName] = resolveValue(value)
	}

	public async insertRow(): Promise<Input.PrimaryValue> {
		return this.insertPromise
	}

	private async createInsertPromise(firer: PromiseLike<void>): Promise<Input.PrimaryValue> {
		await firer
		const qb = this.db.queryBuilder()
		qb.table(this.tableName)
		const rowData = await promiseAllObject(this.rowData)
		const returning = await qb.insert(rowData, this.primaryColumn)

		return returning[0]
	}
}
