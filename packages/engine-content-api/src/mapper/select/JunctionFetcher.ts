import { PathFactory } from './Path'
import { WhereBuilder } from './WhereBuilder'
import { Client, LimitByGroupWrapper, Operator, SelectBuilder } from '@contember/database'
import { Input, Model, Value } from '@contember/schema'
import { OrderByBuilder } from './OrderByBuilder'
import { PredicatesInjector } from '../../acl'
import { ObjectNode } from '../../inputProcessing'
import { JoiningColumns } from '../types'

export class JunctionFetcher {
	constructor(
		private readonly whereBuilder: WhereBuilder,
		private readonly orderBuilder: OrderByBuilder,
		private readonly predicateInjector: PredicatesInjector,
		private readonly pathFactory: PathFactory,
	) {}

	public async fetchJunction(
		db: Client,
		relation: Model.ManyHasManyOwningRelation,
		values: Input.PrimaryValue[],
		column: JoiningColumns,
		targetEntity: Model.Entity,
		object: ObjectNode<Input.ListQueryInput>,
	): Promise<Record<string, Value.AtomicValue>[]> {
		const joiningTable = relation.joiningTable

		const whereColumn = column.sourceColumn.columnName
		let qb = SelectBuilder.create()
			.from(joiningTable.tableName, 'junction_')
			.select(['junction_', joiningTable.inverseJoiningColumn.columnName])
			.select(['junction_', joiningTable.joiningColumn.columnName])
			.where(clause => clause.in(['junction_', whereColumn], values))

		const queryWithPredicates = object.withArg(
			'filter',
			this.predicateInjector.inject(targetEntity, object.args.filter || {}),
		)
		const where = queryWithPredicates.args.filter
		const hasWhere = where && Object.keys(where).length > 0
		const hasFieldOrderBy =
			object.args.orderBy &&
			object.args.orderBy.length > 0 &&
			!object.args.orderBy[0]._random &&
			object.args.orderBy[0]._randomSeeded === undefined

		if (hasWhere || hasFieldOrderBy) {
			const path = this.pathFactory.create([])
			qb = qb.join(targetEntity.tableName, path.getAlias(), condition =>
				condition.compareColumns(['junction_', column.targetColumn.columnName], Operator.eq, [
					path.getAlias(),
					targetEntity.primaryColumn,
				]),
			)
		}

		if (where && hasWhere) {
			qb = this.whereBuilder.build(qb, targetEntity, this.pathFactory.create([]), where)
		}

		const wrapper = new LimitByGroupWrapper(
			['junction_', column.sourceColumn.columnName],
			(orderable, qb) => {
				if (object.args.orderBy) {
					;[qb, orderable] = this.orderBuilder.build(
						qb,
						orderable,
						targetEntity,
						this.pathFactory.create([]),
						object.args.orderBy,
					)
				}
				return [orderable, qb]
			},
			object.args.offset,
			object.args.limit,
		)

		return await wrapper.getResult(qb, db)
	}
}