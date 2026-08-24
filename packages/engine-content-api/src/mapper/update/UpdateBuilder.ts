import { tuple } from '../../utils/index.js'
import { Acl, Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, getColumnType } from '@contember/schema-utils'
import { Operator, QueryBuilder, SelectBuilder, UpdateBuilder as DbUpdateBuilder, Value as DbValue } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select/index.js'
import { ColumnValue, normalizeDbValue } from '../ColumnValue.js'
import { AclScope, PredicateFactory } from '../../acl/index.js'
import { AfterUpdateEvent, BeforeUpdateEvent } from '../EventManager.js'
import { Mapper } from '../Mapper.js'

export interface UpdateResult {
	values: ColumnValue[]
	executed: boolean
	affectedRows: number | null
}

export class UpdateBuilder {
	private rowData: Map<string, ColumnValue> = new Map()

	private newWhere: { and: Input.OptionalWhere[] } = { and: [] }
	private oldWhere: { and: Input.OptionalWhere[] } = { and: [] }
	private predicateFields: string[] = []
	private fieldsCheckedElsewhere = new Set<string>()

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly primary: Input.PrimaryValue,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
		private readonly scope: AclScope,
	) {}

	public addFieldValue(
		fieldName: string,
		value: Value.FieldValue | undefined,
	): void {
		if (value === undefined) {
			return
		}
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)

		this.rowData.set(columnName, { columnName, value, columnType, fieldName })
	}

	public addNewWhere(where: Input.OptionalWhere): void {
		this.newWhere.and.push(where)
	}

	public addOldWhere(where: Input.OptionalWhere): void {
		this.oldWhere.and.push(where)
	}

	public addPredicates(fields: string[]): void {
		const predicate = this.predicateFactory.create(this.entity, Acl.Operation.update, this.scope, fields)
		this.predicateFields.push(...fields)
		this.addNewWhere(predicate)
		this.addOldWhere(predicate)
	}

	/**
	 * Declares that another statement of this mutation resolves this field's update predicate. A m:n
	 * write does exactly that: `JunctionTableManager` builds the same predicate for the side it was
	 * called about, so re-checking it here would only cost a query.
	 */
	public markPredicateCheckedElsewhere(field: string): void {
		this.fieldsCheckedElsewhere.add(field)
	}

	/**
	 * Checks the row against the predicates of the fields nothing else covers. {@link execute} skips
	 * the statement when there is no column to set, so with relation-only data the predicates never
	 * reach the database on their own - which used to let a mutation write through a relation the
	 * role may not update at this scope.
	 */
	public async verifyPredicates(mapper: Mapper): Promise<boolean> {
		const fields = this.predicateFields.filter(it => !this.fieldsCheckedElsewhere.has(it))
		if (fields.length === 0) {
			return true
		}
		const predicate = this.predicateFactory.create(this.entity, Acl.Operation.update, this.scope, fields)
		if (Object.keys(predicate).length === 0) {
			return true
		}
		const path = this.pathFactory.create([])
		const qb = SelectBuilder.create()
			.from(this.entity.tableName, path.alias)
			.select([path.alias, this.entity.primaryColumn])
		const where: Input.OptionalWhere = { and: [predicate, { [this.entity.primary]: { eq: this.primary } }] }
		const result = await this.whereBuilder.build(qb, this.entity, path, where).getResult(mapper.db)

		return result.length > 0
	}

	public async execute(mapper: Mapper): Promise<UpdateResult> {
		const resolvedData = [...this.rowData.values()]
		if (Object.keys(resolvedData).length === 0) {
			return { values: [], affectedRows: null, executed: false }
		}
		const oldColSuffix = '_old__'

		const qb = DbUpdateBuilder.create()
			.with('newData_', qb => {
				qb = resolvedData.reduce(
					(qb, value) =>
						qb
							.select(
								expr =>
									expr.selectValue(
										normalizeDbValue(value.value, value.columnType),
										value.columnType,
									),
								value.columnName,
							)
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

		const beforeEvent = new BeforeUpdateEvent(this.entity, resolvedData, this.primary)
		await mapper.eventManager.fire(beforeEvent)

		const result = await qb.execute(mapper.db)

		if (result.length === 1) {
			const eventData = resolvedData.map(it => ({
				...it,
				old: result[0][it.columnName + oldColSuffix],
			}))
			const afterUpdateEvent = new AfterUpdateEvent(this.entity, eventData, this.primary)
			beforeEvent.afterEvent = afterUpdateEvent
			await mapper.eventManager.fire(afterUpdateEvent)
		}

		return { values: resolvedData, affectedRows: result.length, executed: true }
	}
}
