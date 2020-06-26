import { tuple } from '../../utils'
import { Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, getColumnType } from '@contember/schema-utils'
import { Client, Operator, QueryBuilder, UpdateBuilder as DbUpdateBuilder, Value as DbValue } from '@contember/database'
import WhereBuilder from '../select/WhereBuilder'
import Path from '../select/Path'
import { ColumnValue, ResolvedColumnValue, resolveGenericValue, resolveRowData } from '../ColumnValue'

export interface UpdateResult {
	values: ResolvedColumnValue[]
	executed: boolean
	affectedRows: number | null
}

export default class UpdateBuilder {
	private resolver: (value: number | null) => void = () => {
		throw new Error('UpdateBuilder: Resolver called too soon')
	}
	public readonly update: Promise<number | null> = new Promise(resolve => (this.resolver = resolve))

	private rowData: ColumnValue[] = []

	private newWhere: Input.Where = {}
	private oldWhere: Input.Where = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly uniqueWhere: Input.Where,
	) {}

	public async addFieldValue(
		fieldName: string,
		value: Value.GenericValueLike<Value.AtomicValue | undefined>,
	): Promise<Value.AtomicValue | undefined> {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		const resolvedValue = resolveGenericValue(value)
		this.rowData.push({ columnName, value: resolvedValue, columnType, fieldName })
		return resolvedValue
	}

	public addNewWhere(where: Input.Where): void {
		this.newWhere = { and: [where, this.newWhere] }
	}

	public addOldWhere(where: Input.Where): void {
		this.oldWhere = { and: [where, this.oldWhere] }
	}

	public async execute(db: Client): Promise<UpdateResult> {
		try {
			const resolvedData = await resolveRowData(this.rowData)
			if (Object.keys(resolvedData).length === 0) {
				this.resolver(null)
				return { values: [], affectedRows: null, executed: false }
			}

			const qb = DbUpdateBuilder.create()
				.with('newData_', qb => {
					qb = resolvedData.reduce(
						(qb, value) =>
							qb.select(expr => expr.selectValue(value.resolvedValue as DbValue, value.columnType), value.columnName),
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
			const result = await qb.execute(db)
			this.resolver(result)
			return { values: resolvedData, affectedRows: result, executed: true }
		} catch (e) {
			this.resolver(null)
			throw e
		}
	}
}
