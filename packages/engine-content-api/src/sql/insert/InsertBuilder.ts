import { Input, Model, Value } from '@contember/schema'
import { Client, InsertBuilder as DbInsertBuilder, QueryBuilder, Value as DbValue } from '@contember/database'
import WhereBuilder from '../select/WhereBuilder'
import Path, { PathFactory } from '../select/Path'
import { getColumnName, getColumnType } from '@contember/schema-utils'
import { ColumnValue, ResolvedColumnValue, resolveGenericValue, resolveRowData } from '../ColumnValue'
import { ImplementationException } from '../../exception'
import { AbortInsert } from './Inserter'
import { EnrichedError } from '../ErrorUtils'

export interface InsertResult {
	values: ResolvedColumnValue[]
	executed: boolean
	aborted: boolean
	primaryValue: Value.PrimaryValue | null
}

export default class InsertBuilder {
	private resolver: (value: Value.PrimaryValue | null) => void = () => {
		throw new ImplementationException('InsertBuilder: Resolver called too soon')
	}
	public readonly insert: Promise<Value.PrimaryValue | null> = new Promise(resolve => (this.resolver = resolve))

	private rowData: ColumnValue<AbortInsert | undefined>[] = []
	private where: Input.Where = {}

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

	public addWhere(where: Input.Where): void {
		this.where = { and: [where, this.where] }
	}

	public async getResolvedData(): Promise<ResolvedColumnValue<AbortInsert>[]> {
		return resolveRowData(this.rowData)
	}

	public async execute(db: Client): Promise<InsertResult> {
		let resolvedDataFinal: ResolvedColumnValue[] | null = null
		try {
			const resolvedData = await this.getResolvedData()
			if (resolvedData.find(it => it.resolvedValue === AbortInsert)) {
				return { aborted: true, executed: false, primaryValue: null, values: [] }
			}
			resolvedDataFinal = resolvedData as ResolvedColumnValue[]
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
			throw new EnrichedError(this.entity, resolvedDataFinal, e)
		}
	}
}
