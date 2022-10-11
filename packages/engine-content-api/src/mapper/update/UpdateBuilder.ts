import { tuple } from '../../utils'
import { Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, getColumnType } from '@contember/schema-utils'
import { Client, Operator, QueryBuilder, UpdateBuilder as DbUpdateBuilder, Value as DbValue } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { ColumnValue, ResolvedColumnValue, resolveGenericValue, resolveRowData } from '../ColumnValue'
import { AbortUpdate } from './Updater'
import { AfterUpdateEvent, BeforeUpdateEvent, EventManager } from '../EventManager'
import { Mapper } from '../Mapper'

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

	private rowData: ColumnValue<AbortUpdate>[] = []

	private newWhere: Input.OptionalWhere = {}
	private oldWhere: Input.OptionalWhere = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly primary: Input.PrimaryValue,
		private readonly pathFactory: PathFactory,
	) {}

	public async addFieldValue(
		fieldName: string,
		value: Value.GenericValueLike<Value.AtomicValue<AbortUpdate | undefined>>,
	): Promise<Value.AtomicValue<AbortUpdate | undefined>> {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		const resolvedValue = resolveGenericValue(value)
		this.rowData.push({ columnName, value: resolvedValue, columnType, fieldName })
		return resolvedValue
	}

	public addNewWhere(where: Input.OptionalWhere): void {
		this.newWhere = { and: [where, this.newWhere] }
	}

	public addOldWhere(where: Input.OptionalWhere): void {
		this.oldWhere = { and: [where, this.oldWhere] }
	}

	public async execute(mapper: Mapper): Promise<UpdateResult> {
		try {
			const resolvedData = await resolveRowData<AbortUpdate>(this.rowData)
			if (Object.keys(resolvedData).length === 0) {
				this.resolver(null)
				return { values: [], affectedRows: null, executed: false, aborted: false }
			}
			if (resolvedData.find(it => it.resolvedValue === AbortUpdate)) {
				this.resolver(null)
				return { values: [], affectedRows: null, executed: false, aborted: true }
			}
			const oldColSuffix = '_old__'

			const qb = DbUpdateBuilder.create()
				.with('newData_', qb => {
					qb = resolvedData.reduce(
						(qb, value) =>
							qb
								.select(expr => expr.selectValue(value.resolvedValue as DbValue, value.columnType), value.columnName)
								.select(['root_', value.columnName], value.columnName + oldColSuffix),
						qb,
					)
					const columns = new Set(resolvedData.map(it => it.columnName))
					const allColumns: string[] = Object.values(
						acceptEveryFieldVisitor(this.schema, this.entity, {
							visitColumn: ({ column }) => column.columnName,
							visitManyHasOne: ({ relation }) => relation.joiningColumn.columnName,
							visitOneHasOneOwning: ({ relation }) => relation.joiningColumn.columnName,
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
						and: [{
							[this.entity.primary]: { eq: this.primary },
						}, this.oldWhere],
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
				.returning(...resolvedData.map(it => it.columnName + oldColSuffix))
				.from(qb => {
					qb = qb.from('newData_')
					const col1 = tuple(this.entity.tableName, this.entity.primaryColumn)
					const col2 = tuple('newData_', this.entity.primaryColumn)
					qb = qb.where(expr => expr.compareColumns(col1, Operator.eq, col2))
					qb = this.whereBuilder.build(qb, this.entity, this.pathFactory.create([], 'newData_'), this.newWhere)
					return qb
				})


			const beforeEvent = new BeforeUpdateEvent(this.entity, resolvedData as ResolvedColumnValue[], this.primary)
			await mapper.eventManager.fire(beforeEvent)

			const result = await qb.execute(mapper.db)
			this.resolver(result.length)

			if (result.length === 1) {
				const eventData = (resolvedData as ResolvedColumnValue[]).map(it => ({
					...it,
					old: result[0][it.columnName + oldColSuffix],
				}))
				const afterUpdateEvent = new AfterUpdateEvent(this.entity, eventData, this.primary)
				beforeEvent.afterEvent = afterUpdateEvent
				await mapper.eventManager.fire(afterUpdateEvent)
			}

			return { values: resolvedData as ResolvedColumnValue[], affectedRows: result.length, executed: true, aborted: false }
		} catch (e) {
			this.resolver(null)
			throw e
		}
	}
}
