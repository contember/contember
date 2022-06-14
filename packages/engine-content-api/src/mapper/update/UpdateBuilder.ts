import { tuple } from '../../utils'
import { Acl, Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, getColumnType } from '@contember/schema-utils'
import { Client, Operator, QueryBuilder, UpdateBuilder as DbUpdateBuilder, Value as DbValue } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { ColumnValue, ResolvedColumnValue, resolveGenericValue, resolveRowData } from '../ColumnValue'
import { AbortUpdate } from './Updater'
import { PredicateFactory } from '../../acl'

export interface UpdateResult {
	values: ResolvedColumnValue[]
	executed: boolean
	aborted: boolean
	affectedRows: number | null
}

export class UpdateBuilder {
	private resolver: (value: number | null) => void = () => {
		throw new Error('UpdateBuilder: Resolver called too soon')
	}
	public readonly update: Promise<number | null> = new Promise(resolve => (this.resolver = resolve))

	private rowData: Map<string, ColumnValue<AbortUpdate>> = new Map()

	private newWhere: { and: Input.OptionalWhere[] } = { and: [] }
	private oldWhere: { and: Input.OptionalWhere[] } = { and: [] }

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly uniqueWhere: Input.Where,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public addFieldValue(
		fieldName: string,
		value: Value.GenericValueLike<Value.AtomicValue<AbortUpdate | undefined>>,
	): Promise<Value.AtomicValue<AbortUpdate | undefined>> {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		const resolvedValue = resolveGenericValue(value)
		this.rowData.set(columnName, { columnName, value: resolvedValue, columnType, fieldName })
		return resolvedValue
	}

	public addNewWhere(where: Input.OptionalWhere): void {
		this.newWhere.and.push(where)
	}

	public addOldWhere(where: Input.OptionalWhere): void {
		this.oldWhere.and.push(where)
	}

	public addPredicates(fields: string[]): void {
		const predicate = this.predicateFactory.create(this.entity, Acl.Operation.update, fields)
		this.addNewWhere(predicate)
		this.addOldWhere(predicate)
	}

	public async execute(db: Client): Promise<UpdateResult> {
		try {
			const resolvedData = await resolveRowData<AbortUpdate>([...this.rowData.values()])
			if (Object.keys(resolvedData).length === 0) {
				this.resolver(null)
				return { values: [], affectedRows: null, executed: false, aborted: false }
			}
			if (resolvedData.find(it => it.resolvedValue === AbortUpdate)) {
				this.resolver(null)
				return { values: [], affectedRows: null, executed: false, aborted: true }
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
							visitOneHasOneOwning: (entity, relation) => relation.joiningColumn.columnName,
							visitManyHasManyInverse: () => null,
							visitManyHasManyOwning: () => null,
							visitOneHasOneInverse: () => null,
							visitOneHasMany: () => null,
						}),
					).filter((it): it is string => it !== null)

					const remainingColumns = allColumns.filter(it => !columns.has(it))
					qb = qb.from(this.entity.tableName, 'root_')

					qb = remainingColumns.reduce((qb, columnName) => qb.select(['root_', columnName]), qb)

					qb = this.whereBuilder.build(qb, this.entity, this.pathFactory.create([]), {
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
					qb = this.whereBuilder.build(qb, this.entity, this.pathFactory.create([], 'newData_'), this.newWhere)
					return qb
				})

			const result = await qb.execute(db)
			this.resolver(result)
			return { values: resolvedData as ResolvedColumnValue[], affectedRows: result, executed: true, aborted: false }
		} catch (e) {
			this.resolver(null)
			throw e
		}
	}
}
