import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import ListQueryBuilder from './ListQueryBuilder'

export default class BoundedGetQueryBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	column(name: string): BoundedGetQueryBuilder {
		return new BoundedGetQueryBuilder(this.objectBuilder.field(name))
	}

	relation(
		name: string,
		builder: ListQueryBuilder | ((builder: ListQueryBuilder) => ListQueryBuilder),
		alias?: string
	): BoundedGetQueryBuilder {
		if (!(builder instanceof ListQueryBuilder)) {
			builder = builder(new ListQueryBuilder())
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, builder.objectBuilder.name(name)] : [name, builder.objectBuilder]

		return new BoundedGetQueryBuilder(this.objectBuilder.object(objectName, objectBuilder))
	}
}
