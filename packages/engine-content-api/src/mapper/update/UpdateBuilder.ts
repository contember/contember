import { tuple } from '../../utils/index.js'
import { Acl, Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, getColumnName, getColumnType, StatePredicate } from '@contember/schema-utils'
import {
	Literal,
	Operator,
	QueryBuilder,
	SelectBuilder,
	UpdateBuilder as DbUpdateBuilder,
	Value as DbValue,
	wrapIdentifier,
} from '@contember/database'
import { Path, PathFactory, WhereBuilder } from '../select/index.js'
import { ColumnValue, normalizeDbValue } from '../ColumnValue.js'
import { AclScope, PredicateFactory } from '../../acl/index.js'
import { AfterUpdateEvent, BeforeUpdateEvent } from '../EventManager.js'
import { Mapper } from '../Mapper.js'

export interface UpdateResult {
	values: ColumnValue[]
	executed: boolean
	affectedRows: number | null
}

type UpdateStatePredicate = StatePredicate<Input.OptionalWhere>
type StatePredicateLeaf = Extract<UpdateStatePredicate, { readonly predicate: Input.OptionalWhere }>

const joinConditions = (operator: 'and' | 'or', conditions: Literal[]): Literal => new Literal('').appendAll(conditions, ` ${operator} `, ['(', ')'])

export class UpdateBuilder {
	private rowData: Map<string, ColumnValue> = new Map()

	private newWhere: { and: Input.OptionalWhere[] } = { and: [] }
	private oldWhere: { and: Input.OptionalWhere[] } = { and: [] }
	/** Predicates that relate the stored and the proposed row, e.g. `or` of several `_old`/`_new` transitions. */
	private statePredicates: UpdateStatePredicate[] = []
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
		const predicate = this.predicateFactory.createUpdateStatePredicate(this.entity, this.scope, fields)
		this.predicateFields.push(...fields)
		this.addStatePredicate(predicate)
	}

	/** Conjuncts that constrain one row go to that row's where; the rest is evaluated over both rows in {@link execute}. */
	private addStatePredicate(predicate: UpdateStatePredicate): void {
		switch (predicate.type) {
			case 'both':
				this.addNewWhere(predicate.predicate)
				this.addOldWhere(predicate.predicate)
				return
			case 'old':
				this.addOldWhere(predicate.predicate)
				return
			case 'new':
				this.addNewWhere(predicate.predicate)
				return
			case 'and':
				predicate.operands.forEach(it => this.addStatePredicate(it))
				return
			case 'or':
			case 'not':
				this.statePredicates.push(predicate)
		}
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
		const rootPath = this.pathFactory.create([])
		const newDataPath = this.pathFactory.create([], 'newData_')
		const oldStateColumns = this.collectOldStateColumns()

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

				qb = this.whereBuilder.build(qb, this.entity, rootPath, {
					and: [{
						[this.entity.primary]: { eq: this.primary },
					}, this.oldWhere],
				})

				for (const [node, column] of oldStateColumns) {
					const { qb: conditionQb, condition } = this.whereBuilder.buildConditionLiteral(qb, this.entity, rootPath, node.predicate)
					qb = conditionQb.select(condition, column)
				}

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
				qb = this.whereBuilder.build(qb, this.entity, newDataPath, this.newWhere)
				for (const predicate of this.statePredicates) {
					const { qb: conditionQb, condition } = this.buildStateCondition(qb, predicate, oldStateColumns, newDataPath)
					qb = conditionQb.where(clause => clause.with(condition))
				}
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

	/** Every old-state operand of {@link statePredicates} becomes a boolean column of `newData_`, evaluated against the stored row. */
	private collectOldStateColumns(): Map<StatePredicateLeaf, string> {
		const columns = new Map<StatePredicateLeaf, string>()
		const visit = (node: UpdateStatePredicate): void => {
			switch (node.type) {
				case 'both':
				case 'old':
					// a shared (cached) leaf keeps its first column
					if (!columns.has(node)) {
						columns.set(node, `old_predicate_${columns.size}__`)
					}
					return
				case 'new':
					return
				case 'and':
				case 'or':
					node.operands.forEach(visit)
					return
				case 'not':
					visit(node.operand)
			}
		}
		this.statePredicates.forEach(visit)
		return columns
	}

	private buildStateCondition<R extends SelectBuilder.Result>(
		qb: SelectBuilder<R>,
		node: UpdateStatePredicate,
		oldStateColumns: Map<StatePredicateLeaf, string>,
		newDataPath: Path,
	): { qb: SelectBuilder<R>; condition: Literal } {
		const oldState = (leaf: StatePredicateLeaf): Literal => {
			const column = oldStateColumns.get(leaf)
			if (column === undefined) {
				throw new Error('UpdateBuilder: missing old-state column')
			}
			return new Literal(`${wrapIdentifier('newData_')}.${wrapIdentifier(column)}`)
		}
		const newState = (where: Input.OptionalWhere) => {
			const result = this.whereBuilder.buildConditionLiteral(qb, this.entity, newDataPath, where)
			return { qb: result.qb, condition: joinConditions('and', [result.condition]) }
		}
		switch (node.type) {
			case 'old':
				return { qb, condition: oldState(node) }
			case 'new':
				return newState(node.predicate)
			case 'both': {
				const result = newState(node.predicate)
				return { qb: result.qb, condition: joinConditions('and', [oldState(node), result.condition]) }
			}
			case 'and':
			case 'or': {
				const conditions: Literal[] = []
				for (const operand of node.operands) {
					const result = this.buildStateCondition(qb, operand, oldStateColumns, newDataPath)
					qb = result.qb
					conditions.push(result.condition)
				}
				return { qb, condition: joinConditions(node.type, conditions) }
			}
			case 'not': {
				const result = this.buildStateCondition(qb, node.operand, oldStateColumns, newDataPath)
				return { qb: result.qb, condition: new Literal('not ').appendAll([result.condition], '') }
			}
		}
	}
}
