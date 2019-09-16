import { tuple } from '../../utils'
import { Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, getColumnType } from '@contember/schema-utils'
import { resolveValue } from '../utils'
import { Client, Operator, QueryBuilder, UpdateBuilder as DbUpdateBuilder, Value as DbValue } from '@contember/database'
import WhereBuilder from '../select/WhereBuilder'
import Path from '../select/Path'

type ColumnValue = {
	value: PromiseLike<Value.AtomicValue | undefined>
	columnName: string
	columnType: string
}

export default class UpdateBuilder {
	public readonly update: Promise<number | null>
	private firer: (db: Client) => void = () => {
		throw new Error()
	}

	private rowData: ColumnValue[] = []

	private newWhere: Input.Where = {}
	private oldWhere: Input.Where = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly uniqueWhere: Input.Where,
	) {
		const blocker: Promise<Client> = new Promise(resolver => (this.firer = resolver))
		this.update = this.createUpdatePromise(blocker)
	}

	public async execute(db: Client): Promise<number | null> {
		this.firer(db)
		return this.update
	}

	public addFieldValue(fieldName: string, value: Value.GenericValueLike<Value.AtomicValue | undefined>) {
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

	private async createUpdatePromise(blocker: PromiseLike<Client>) {
		const db = await blocker

		const resolvedValues = await Promise.all(this.rowData.map(it => it.value))
		const resolvedData = this.rowData
			.map((it, index) => ({ ...it, value: resolvedValues[index] }))
			.filter(it => it.value !== undefined)
		if (Object.keys(resolvedData).length === 0) {
			return null
		}

		const qb = DbUpdateBuilder.create()
			.with('newData_', qb => {
				qb = resolvedData.reduce(
					(qb, value) =>
						qb.select(expr => expr.selectValue(value.value as DbValue, value.columnType), value.columnName),
					qb,
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
					}),
				).filter((it): it is string => it !== null)

				const remainingColumns = allColumns.filter(it => !columns.has(it))
				qb = qb.from(this.entity.tableName, 'root_')

				qb = remainingColumns.reduce((qb, columnName) => qb.select(['root_', columnName]), qb)

				qb = this.whereBuilder.build(qb, this.entity, new Path([]), {
					and: [this.uniqueWhere, this.oldWhere],
				})

				return qb
			})
			.table(this.entity.tableName)
			.values(
				resolvedData.reduce<QueryBuilder.ColumnExpressionMap>(
					(result: object, item) => ({
						...result,
						[item.columnName]: expr => expr.select(['newData_', item.columnName]),
					}),
					{},
				),
			)
			.from(qb => {
				qb = qb.from('newData_')
				const col1 = tuple(this.entity.tableName, this.entity.primaryColumn)
				const col2 = tuple('newData_', this.entity.primaryColumn)
				qb = qb.where(expr => expr.compareColumns(col1, Operator.eq, col2))
				qb = this.whereBuilder.build(qb, this.entity, new Path([], 'newData_'), this.newWhere)
				return qb
			})
		return await qb.execute(db)
	}
}
