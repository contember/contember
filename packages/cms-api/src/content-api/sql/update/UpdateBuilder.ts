import { resolveValue } from '../utils'
import { Input, Model } from 'cms-common'
import Client from '../../../core/database/Client'
import { acceptEveryFieldVisitor, getColumnName, getColumnType } from '../../../content-schema/modelUtils'
import QueryBuilder from '../../../core/database/QueryBuilder'
import { Value } from '../../../core/database/types'
import WhereBuilder from '../select/WhereBuilder'
import Path from '../select/Path'

type ColumnValue = {
	value: PromiseLike<Input.ColumnValue<undefined>>
	columnName: string
	columnType: string
}

export default class UpdateBuilder {
	public readonly update: Promise<number | null>
	private firer: () => void = () => {
		throw new Error()
	}

	private rowData: ColumnValue[] = []

	private newWhere: Input.Where = {}
	private oldWhere: Input.Where = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly db: Client,
		private readonly whereBuilder: WhereBuilder,
		private readonly uniqueWhere: Input.Where
	) {
		const blocker: Promise<void> = new Promise(resolver => (this.firer = resolver))
		this.update = this.createUpdatePromise(blocker)
	}

	public async execute(): Promise<number | null> {
		this.firer()
		return this.update
	}

	public addFieldValue(fieldName: string, value: Input.ColumnValueLike<undefined>) {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		this.rowData.push({ columnName, value: resolveValue(value), columnType })
	}

	public addNewWhere(where: Input.Where): void {
		this.newWhere = { and: [where, this.newWhere] }
	}

	public addOldWhere(where: Input.Where): void {
		this.oldWhere = { and: [where, this.oldWhere] }
	}

	private async createUpdatePromise(blocker: PromiseLike<void>) {
		await blocker

		const resolvedValues = await Promise.all(this.rowData.map(it => it.value))
		const resolvedData = this.rowData
			.map((it, index) => ({ ...it, value: resolvedValues[index] }))
			.filter(it => it.value !== undefined)
		if (Object.keys(resolvedData).length === 0) {
			return null
		}

		const qb = this.db
			.updateBuilder()
			.with('newData_', qb => {
				qb = resolvedData.reduce(
					(qb, value) => qb.select(expr => expr.selectValue(value.value as Value, value.columnType), value.columnName),
					qb
				)
				const columns = new Set(resolvedData.map(it => it.columnName))
				const allColumns: string[] = Object.values(
					acceptEveryFieldVisitor(this.schema, this.entity, {
						visitColumn: (entity, column) => column.columnName,
						visitManyHasOne: (entity, relation) => relation.joiningColumn.columnName,
						visitOneHasOneOwner: (entity, relation) => relation.joiningColumn.columnName,
						visitManyHasManyInversed: () => null,
						visitManyHasManyOwner: () => null,
						visitOneHasOneInversed: () => null,
						visitOneHasMany: () => null,
					})
				).filter((it): it is string => it !== null)

				const remainingColumns = allColumns.filter(it => !columns.has(it))
				qb = qb.from(this.entity.tableName, 'root_')

				qb = remainingColumns.reduce((qb, columnName) => qb.select(['root_', columnName]), qb)

				qb = this.whereBuilder.build(qb, this.entity, new Path([]), this.uniqueWhere)

				return qb
			})
			.table(this.entity.tableName)
			.values(
				resolvedData.reduce<QueryBuilder.ColumnExpressionMap>(
					(result: object, item) => ({
						...result,
						[item.columnName]: expr => expr.select(['newData_', item.columnName]),
					}),
					{}
				)
			)
			.from(qb => {
				qb = qb.from('newData_')
				qb = this.whereBuilder.build(qb, this.entity, new Path([], this.entity.tableName), {
					and: [this.uniqueWhere, this.oldWhere],
				})
				qb = this.whereBuilder.build(qb, this.entity, new Path([], 'newData_'), this.newWhere)
				return qb
			})
		return await qb.execute()
	}
}
