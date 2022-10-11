import { PathFactory, WhereBuilder } from '../select'
import { Input, Model } from '@contember/schema'
import { UpdateBuilder } from './UpdateBuilder'
import { PredicateFactory } from '../../acl'

export class UpdateBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public create(entity: Model.Entity, primary: Input.PrimaryValue): UpdateBuilder {
		return new UpdateBuilder(
			this.schema,
			entity,
			this.whereBuilder,
			primary,
			this.pathFactory,
			this.predicateFactory,
		)
	}
}
