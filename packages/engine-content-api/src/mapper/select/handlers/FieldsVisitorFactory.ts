import { FieldsVisitor } from './FieldsVisitor'
import { JunctionFetcher } from '../JunctionFetcher'
import { Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { SelectExecutionHandlerContext } from '../SelectExecutionHandler'
import { PredicateFactory } from '../../../acl'
import { WhereBuilder } from '../WhereBuilder'

export class FieldsVisitorFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
	) {}

	create(mapper: Mapper, context: SelectExecutionHandlerContext): FieldsVisitor {
		return new FieldsVisitor(
			this.schema,
			this.junctionFetcher,
			this.predicateFactory,
			this.whereBuilder,
			mapper,
			context,
		)
	}
}
