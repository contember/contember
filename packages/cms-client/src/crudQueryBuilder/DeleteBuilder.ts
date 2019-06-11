import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'

export class DeleteBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	by(by: Input.UniqueWhere<Literal>) {
		return new DeleteBuilder(this.objectBuilder.argument('by', by))
	}

	column(name: string) {
		return new DeleteBuilder(this.objectBuilder.field(name))
	}

	inlineFragment(
		typeName: string,
		builder: UnboundedGetQueryBuilder | ((builder: UnboundedGetQueryBuilder) => UnboundedGetQueryBuilder)
	) {
		if (!(builder instanceof UnboundedGetQueryBuilder)) {
			builder = builder(new UnboundedGetQueryBuilder())
		}
		return new DeleteBuilder(this.objectBuilder.fragment(typeName, builder.objectBuilder))
	}

	relation(
		name: string,
		builder: UnboundedGetQueryBuilder | ((builder: UnboundedGetQueryBuilder) => UnboundedGetQueryBuilder)
	) {
		if (!(builder instanceof UnboundedGetQueryBuilder)) {
			builder = builder(new UnboundedGetQueryBuilder())
		}
		return new DeleteBuilder(this.objectBuilder.object(name, builder.objectBuilder))
	}
}
