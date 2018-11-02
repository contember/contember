import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class DeleteBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	where(by: Input.UniqueWhere<Literal>) {
		return new DeleteBuilder(this.objectBuilder.argument('by', by))
	}

	column(name: string) {
		return new DeleteBuilder(this.objectBuilder.field(name))
	}

	relation(name: string, builder: ObjectBuilder | ((builder: ObjectBuilder) => ObjectBuilder)) {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}
		return new DeleteBuilder(this.objectBuilder.object(name, builder))
	}
}
