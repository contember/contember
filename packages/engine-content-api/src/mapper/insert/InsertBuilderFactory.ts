import { PathFactory, WhereBuilder } from '../select'
import { Model } from '@contember/schema'
import { InsertBuilder } from './InsertBuilder'
import { PredicateFactory } from '../../acl'

export class InsertBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public create(entity: Model.Entity): InsertBuilder {
		return new InsertBuilder(this.schema, entity, this.whereBuilder, this.pathFactory, this.predicateFactory)
	}
}
