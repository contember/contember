import { Input, Model, Value } from '@contember/schema'
import { Client, InsertBuilder as DbInsertBuilder, QueryBuilder, Value as DbValue } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { getColumnName, getColumnType } from '@contember/schema-utils'
import { ColumnValue, ResolvedColumnValue, resolveGenericValue, resolveRowData } from '../ColumnValue'
import { ImplementationException } from '../../exception'
import { AbortInsert } from './Inserter'
import { AfterInsertEvent, BeforeInsertEvent, EventManager } from '../EventManager'
import { Mapper } from '../Mapper'

export interface InsertResult {
	values: ResolvedColumnValue[]
	executed: boolean
	aborted: boolean
	primaryValue: Value.PrimaryValue | null
}

export class InsertBuilder {
	private resolver: (value: Value.PrimaryValue | null) => void = () => {
		throw new ImplementationException('InsertBuilder: Resolver called too soon')
	}
	public readonly insert: Promise<Value.PrimaryValue | null> = new Promise(resolve => (this.resolver = resolve))

	private rowData: ColumnValue<AbortInsert | undefined>[] = []
	private where: Input.OptionalWhere = {}

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
	) {}

	public addFieldValue(fieldName: string, value: Value.GenericValueLike<Value.AtomicValue<AbortInsert | undefined>>) {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		this.rowData.push({ columnName, value: resolveGenericValue(value), columnType, fieldName })
	}

	public addWhere(where: Input.OptionalWhere): void {
		this.where = { and: [where, this.where] }
	}

	public async getResolvedData(): Promise<ResolvedColumnValue<AbortInsert>[]> {
		return resolveRowData(this.rowData)
	}

	public async execute(mapper: Mapper): Promise<InsertResult> {
		try {
			const resolvedData = await this.getResolvedData()
			if (resolvedData.find(it => it.resolvedValue === AbortInsert)) {
				this.resolver(null)
				return { aborted: true, executed: false, primaryValue: null, values: [] }
			}

			const insertData = resolvedData.reduce<QueryBuilder.ColumnExpressionMap>(
				(result, item) => ({ ...result, [item.columnName]: expr => expr.select(['root_', item.columnName]) }),
				{},
			)
			const qb = DbInsertBuilder.create()
				.with('root_', qb => {
					return resolvedData.reduce(
						(qb, value) =>
							qb.select(expr => expr.selectValue(value.resolvedValue as DbValue, value.columnType), value.columnName),
						qb,
					)
				})
				.into(this.entity.tableName)
				.values(insertData)
				.from(qb => {
					qb = qb.from('root_')
					return this.whereBuilder.build(qb, this.entity, this.pathFactory.create([]), this.where)
				})
				.returning(this.entity.primaryColumn)

			const beforeInsertEvent = new BeforeInsertEvent(this.entity, resolvedData as ResolvedColumnValue[])
			await mapper.eventManager.fire(beforeInsertEvent)

			const returning = (await qb.execute(mapper.db)).map(it => it[this.entity.primaryColumn])
			const result = returning.length === 1 ? returning[0] : null

			const afterInsertEvent = new AfterInsertEvent(this.entity, resolvedData as ResolvedColumnValue[], result)
			beforeInsertEvent.afterEvent = afterInsertEvent
			await mapper.eventManager.fire(afterInsertEvent)

			this.resolver(result)
			return { values: resolvedData as ResolvedColumnValue[], executed: true, primaryValue: result, aborted: false }
		} catch (e) {
			this.resolver(null)
			throw e
		}
	}
}
