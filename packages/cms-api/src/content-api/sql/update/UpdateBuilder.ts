import { resolveValue } from '../utils'
import { promiseAllObject } from '../../../utils/promises'
import { Input, Model } from 'cms-common'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { getColumnName, getColumnType } from "../../../content-schema/modelUtils";

type ColumnValue = {
	value: PromiseLike<Input.ColumnValue<undefined>>
	columnName: string
	columnType: string
}

export default class UpdateBuilder {
	public readonly update: Promise<number>
	private firer: (() => void) = () => {
		throw new Error()
	}

	private rowData: ColumnValue[] = []

	private where: { [columnName: string]: PromiseLike<Input.ColumnValue> } = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		where: { [columnName: string]: Input.ColumnValueLike },
		private readonly db: KnexWrapper,
	) {
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

	public addFieldValue(fieldName: string, value: Input.ColumnValueLike<undefined>) {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		this.rowData.push({columnName, value: resolveValue(value), columnType})
	}

	private async createUpdatePromise(blocker: PromiseLike<void>) {
		await blocker
		const qb = this.db.queryBuilder()
		qb.table(this.entity.tableName)

		qb.where(await promiseAllObject(this.where))

		const resolvedValues = await Promise.all(this.rowData.map(it => it.value))
		const resolvedData = this.rowData.map((it, index) => ({...it, value: resolvedValues[index]}))
			.filter(it => it.value !== undefined)
			.reduce((result: object, item) => ({...result, [item.columnName]: item.value}), {})

		if (Object.keys(resolvedData).length === 0) {
			return 0
		}
		return await qb.update(resolvedData)
	}
}
