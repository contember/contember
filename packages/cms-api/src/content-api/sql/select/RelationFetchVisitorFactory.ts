import RelationFetchVisitor from './RelationFetchVisitor'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import JunctionFetcher from './JunctionFetcher'
import { Input, Model } from 'cms-common'
import Mapper from '../Mapper'

class RelationFetchVisitorFactory {
	constructor(private readonly schema: Model.Schema, private readonly junctionFetcher: JunctionFetcher) {}

	create(
		mapper: Mapper,
		parentIdsGetter: (fieldName: string) => PromiseLike<Input.PrimaryValue[]>,
		object: ObjectNode<Input.ListQueryInput>,
		dataCallback: RelationFetchVisitor.DataCallback
	): RelationFetchVisitor {
		return new RelationFetchVisitor(
			this.schema,
			this.junctionFetcher,
			mapper,
			mapper.db,
			parentIdsGetter,
			object,
			dataCallback
		)
	}
}

export default RelationFetchVisitorFactory
