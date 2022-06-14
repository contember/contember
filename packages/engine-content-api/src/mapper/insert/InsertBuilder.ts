import { Acl, Input, Model, Value } from '@contember/schema'
import { Client, InsertBuilder as DbInsertBuilder, QueryBuilder, Value as DbValue } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { getColumnName, getColumnType } from '@contember/schema-utils'
import { ColumnValue, ResolvedColumnValue, resolveGenericValue, resolveRowData } from '../ColumnValue'
import { ImplementationException } from '../../exception'
import { AbortInsert } from './Inserter'
import { PredicateFactory } from '../../acl'

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

	private rowData: Map<string, ColumnValue<AbortInsert | undefined>> = new Map()
	private where: { and: Input.Where[] } = { and: [] }

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public addFieldValue(
		fieldName: string,
		value: Value.GenericValueLike<Value.AtomicValue<AbortInsert | undefined>>,
	): Promise<Value.AtomicValue<AbortInsert | undefined>> {
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		const resolvedValue = resolveGenericValue(value)
		this.rowData.set(columnName, { columnName, value: resolvedValue, columnType, fieldName })
		return resolvedValue
	}

	public addPredicates(fields: string[]): void {
		const where = this.predicateFactory.create(this.entity, Acl.Operation.create, fields)
		this.addWhere(where)
	}

	public addWhere(where: Input.Where): void {
		this.where.and.push(where)
	}

	public async getResolvedData(): Promise<ResolvedColumnValue<AbortInsert>[]> {
		return resolveRowData([...this.rowData.values()])
	}

	public async execute(db: Client): Promise<InsertResult> {
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

			const returning = (await qb.execute(db)).map(it => it[this.entity.primaryColumn])
			const result = returning.length === 1 ? returning[0] : null
			this.resolver(result)
			return { values: resolvedData as ResolvedColumnValue[], executed: true, primaryValue: result, aborted: false }
		} catch (e) {
			this.resolver(null)
			throw e
		}
	}
}
