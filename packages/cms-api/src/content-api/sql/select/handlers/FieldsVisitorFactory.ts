import FieldsVisitor from './FieldsVisitor'
import JunctionFetcher from '../JunctionFetcher'
import { Model } from 'cms-common'
import Mapper from '../../Mapper'
import { Accessor } from '../../../../utils/accessor'
import SelectExecutionHandler from "../SelectExecutionHandler";
import PredicateFactory from "../../../../acl/PredicateFactory";
import WhereBuilder from "../WhereBuilder";

class FieldsVisitorFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly mapperAccessor: Accessor<Mapper>,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
	) {
	}

	create(context: SelectExecutionHandler.Context): FieldsVisitor {
		return new FieldsVisitor(
			this.schema,
			this.junctionFetcher,
			this.predicateFactory,
			this.whereBuilder,
			this.mapperAccessor.get(),
			context
		)
	}
}

export default FieldsVisitorFactory
