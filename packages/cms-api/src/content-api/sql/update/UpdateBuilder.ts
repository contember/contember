import { resolveValue } from '../utils'
import { promiseAllObject } from '../../../utils/promises'
import * as Knex from 'knex'
import { Input } from 'cms-common'

export default class UpdateBuilder {
	private rowData: { [columnName: string]: PromiseLike<Input.ColumnValue<undefined>> } = {}

	private tableName: string
	private db: Knex
	private where: { [columnName: string]: PromiseLike<Input.ColumnValue> } = {}

	private updatePromise: Promise<number>

	constructor(
		tableName: string,
		where: { [columnName: string]: Input.ColumnValueLike },
		db: Knex,
		firer: PromiseLike<void>
	) {
		this.tableName = tableName
		this.db = db
		for (const columnName in where) {
			this.where[columnName] = resolveValue(where[columnName])
		}
		this.updatePromise = this.createUpdatePromise(firer)
	}

	public addColumnData(columnName: string, value: Input.ColumnValueLike<undefined>) {
		this.rowData[columnName] = resolveValue(value)
	}

	public async updateRow() {
		return this.updatePromise
	}

	private async createUpdatePromise(firer: PromiseLike<void>) {
		await firer
		const qb = this.db(this.tableName)

		qb.where(await promiseAllObject(this.where))

		let affectedRows = 0

		const rowData = await promiseAllObject(this.rowData)
		const rowDataFiltered = Object.keys(rowData)
			.filter(key => rowData[key] !== undefined)
			.reduce((result: object, key: string) => ({ ...result, [key]: rowData[key] }), {})

		if (Object.keys(rowDataFiltered).length > 0) {
			affectedRows = await qb.update(rowDataFiltered)
		}

		return affectedRows
	}
}
