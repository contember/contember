import RelationFetchVisitor from './RelationFetchVisitor'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import JunctionFetcher from './JunctionFetcher'
import { Input, Model } from 'cms-common'
import Mapper from '../Mapper'
import { Accessor } from '../../../utils/accessor'

class RelationFetchVisitorFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly junctionFetcher: JunctionFetcher,
		private readonly mapperAccessor: Accessor<Mapper>
	) {}

	create(
		parentIdsGetter: (fieldName: string) => PromiseLike<Input.PrimaryValue[]>,
		object: ObjectNode<Input.ListQueryInput>,
		dataCallback: RelationFetchVisitor.DataCallback
	): RelationFetchVisitor {
		return new RelationFetchVisitor(
			this.schema,
			this.junctionFetcher,
			this.mapperAccessor.get(),
			parentIdsGetter,
			object,
			dataCallback
		)
	}
}

export default RelationFetchVisitorFactory
