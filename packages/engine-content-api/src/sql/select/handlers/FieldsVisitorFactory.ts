import FieldsVisitor from './FieldsVisitor'
import JunctionFetcher from '../JunctionFetcher'
import { Model } from '@contember/schema'
import Mapper from '../../Mapper'
import SelectExecutionHandler from '../SelectExecutionHandler'
import PredicateFactory from '../../../acl/PredicateFactory'
import WhereBuilder from '../WhereBuilder'

class FieldsVisitorFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
	) {}

	create(mapper: Mapper, context: SelectExecutionHandler.Context): FieldsVisitor {
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

export default FieldsVisitorFactory
