import { PathFactory, WhereBuilder } from '../select/index.js'
import { Input, Model } from '@contember/schema'
import { UpdateBuilder } from './UpdateBuilder.js'
import { PredicateFactory } from '../../acl/index.js'
import { MutationAccess } from '../MutationAccess.js'

export class UpdateBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public create(entity: Model.Entity, primary: Input.PrimaryValue, access: MutationAccess): UpdateBuilder {
		return new UpdateBuilder(
			this.schema,
			entity,
			this.whereBuilder,
			primary,
			this.pathFactory,
			this.predicateFactory,
			access,
		)
	}
}
