import Path from '../select/Path'
import Mapper from '../Mapper'
import WhereBuilder from '../select/WhereBuilder'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { Input, Model } from 'cms-common'
import ConditionBuilder from '../../../core/knex/ConditionBuilder'
import OrderByBuilder from './OrderByBuilder'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import PredicatesInjector from '../../../acl/PredicatesInjector'
import WindowFunction from '../../../core/knex/WindowFunction'
import LimitByGroupWrapper from '../../../core/knex/LimitByGroupWrapper'

class JunctionFetcher {
	constructor(
		private readonly whereBuilder: WhereBuilder,
		private readonly orderBuilder: OrderByBuilder,
		private readonly predicateInjector: PredicatesInjector
	) {}

	public async fetchJunction(
		db: KnexWrapper,
		relation: Model.ManyHasManyOwnerRelation,
		values: Input.PrimaryValue[],
		column: Mapper.JoiningColumns,
		targetEntity: Model.Entity,
		object: ObjectNode<Input.ListQueryInput>
	): Promise<object[]> {
		const joiningTable = relation.joiningTable

		const whereColumn = column.sourceColumn.columnName
		const qb = db.queryBuilder()
		qb.from(joiningTable.tableName, 'junction_')
		qb.select(['junction_', joiningTable.inverseJoiningColumn.columnName])
		qb.select(['junction_', joiningTable.joiningColumn.columnName])
		qb.where(clause => clause.in(['junction_', whereColumn], values))

		const queryWithPredicates = this.predicateInjector.inject(targetEntity, object)
		const where = queryWithPredicates.args.where
		if (where && Object.keys(where).length > 0) {
			const path = new Path([])
			qb.join(targetEntity.tableName, path.getAlias(), condition =>
				condition.compareColumns(['junction_', column.targetColumn.columnName], ConditionBuilder.Operator.eq, [
					path.getAlias(),
					targetEntity.primaryColumn,
				])
			)
			this.whereBuilder.build(qb, targetEntity, path, where)
		}

		const wrapper = new LimitByGroupWrapper(
			['junction_', column.sourceColumn.columnName],
			(orderable, qb) => {
				if (object.args.orderBy) {
					this.orderBuilder.build(qb, orderable, targetEntity, new Path([]), object.args.orderBy)
				}
			},
			object.args.offset,
			object.args.limit
		)

		return await wrapper.getResult(qb)
	}
}

export default JunctionFetcher
