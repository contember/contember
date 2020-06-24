import Path from '../select/Path'
import Mapper from '../Mapper'
import WhereBuilder from '../select/WhereBuilder'
import { Client, LimitByGroupWrapper, Operator, SelectBuilder } from '@contember/database'
import { Input, Model, Value } from '@contember/schema'
import OrderByBuilder from './OrderByBuilder'
import PredicatesInjector from '../../acl/PredicatesInjector'
import { ObjectNode } from '../../inputProcessing'

class JunctionFetcher {
	constructor(
		private readonly whereBuilder: WhereBuilder,
		private readonly orderBuilder: OrderByBuilder,
		private readonly predicateInjector: PredicatesInjector,
	) {}

	public async fetchJunction(
		db: Client,
		relation: Model.ManyHasManyOwnerRelation,
		values: Input.PrimaryValue[],
		column: Mapper.JoiningColumns,
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
			object.args.orderBy && object.args.orderBy.length > 0 && object.args.orderBy[0]._random === undefined

		if (hasWhere || hasFieldOrderBy) {
			const path = new Path([])
			qb = qb.join(targetEntity.tableName, path.getAlias(), condition =>
				condition.compareColumns(['junction_', column.targetColumn.columnName], Operator.eq, [
					path.getAlias(),
					targetEntity.primaryColumn,
				]),
			)
		}

		if (where && hasWhere) {
			qb = this.whereBuilder.build(qb, targetEntity, new Path([]), where)
		}

		const wrapper = new LimitByGroupWrapper(
			['junction_', column.sourceColumn.columnName],
			(orderable, qb) => {
				if (object.args.orderBy) {
					;[qb, orderable] = this.orderBuilder.build(qb, orderable, targetEntity, new Path([]), object.args.orderBy)
				}
				return [orderable, qb]
			},
			object.args.offset,
			object.args.limit,
		)

		return await wrapper.getResult(qb, db)
	}
}

export default JunctionFetcher
