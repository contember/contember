import JoinBuilder from './JoinBuilder'
import WhereBuilder from './WhereBuilder'
import { Model } from 'cms-common'
import SelectBuilder from './SelectBuilder'
import SelectHydrator from './SelectHydrator'
import QueryBuilder from '../../../core/knex/QueryBuilder'
import PredicateFactory from '../../../acl/PredicateFactory'
import OrderByBuilder from './OrderByBuilder'
import RelationFetchVisitorFactory from './RelationFetchVisitorFactory'

export default class SelectBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly whereBuilder: WhereBuilder,
		private readonly orderByBuilder: OrderByBuilder,
		private readonly predicateFactory: PredicateFactory,
		private readonly relationFetchVisitorFactory: RelationFetchVisitorFactory
	) {}

	create(qb: QueryBuilder, hydrator: SelectHydrator): SelectBuilder {
		return new SelectBuilder(
			this.schema,
			this.joinBuilder,
			this.whereBuilder,
			this.orderByBuilder,
			this.predicateFactory,
			qb,
			hydrator,
			this.relationFetchVisitorFactory
		)
	}
}
