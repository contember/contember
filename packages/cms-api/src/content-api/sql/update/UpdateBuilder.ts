import { resolveValue } from '../utils'
import { promiseAllObject } from '../../../utils/promises'
import { Input } from 'cms-common'
import KnexWrapper from '../../../core/knex/KnexWrapper'

export default class UpdateBuilder {
	public readonly update: Promise<number>
	private firer: (() => void) = () => {
		throw new Error()
	}

	private db: KnexWrapper
	private tableName: string
	private rowData: { [columnName: string]: PromiseLike<Input.ColumnValue<undefined>> } = {}

	private where: { [columnName: string]: PromiseLike<Input.ColumnValue> } = {}

	constructor(
		tableName: string,
		where: { [columnName: string]: Input.ColumnValueLike },
		db: KnexWrapper,
	) {
		this.tableName = tableName
		this.db = db

		for (const columnName in where) {
			this.where[columnName] = resolveValue(where[columnName])
		}

		const blocker: Promise<void> = new Promise(resolver => this.firer = resolver)
		this.update = this.createUpdatePromise(blocker)
	}

	public async execute(): Promise<number> {
		this.firer()
		return this.update
	}

	public addColumnData(columnName: string, value: Input.ColumnValueLike<undefined>) {
		this.rowData[columnName] = resolveValue(value)
	}

	private async createUpdatePromise(blocker: PromiseLike<void>) {
		await blocker
		const qb = this.db.queryBuilder()
		qb.table(this.tableName)

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
