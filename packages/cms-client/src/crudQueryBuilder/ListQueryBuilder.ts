import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class ListQueryBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	where(where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>>) {
		return new ListQueryBuilder(this.objectBuilder.argument('where', where))
	}

	by(where: Input.UniqueWhere<Literal>) {
		return new ListQueryBuilder(this.objectBuilder.argument('by', where))
	}

	column(name: string) {
		return new ListQueryBuilder(this.objectBuilder.field(name))
	}

	relation(
		name: string,
		builder: ListQueryBuilder | ((builder: ListQueryBuilder) => ListQueryBuilder),
		alias?: string
	) {
		if (!(builder instanceof ListQueryBuilder)) {
			builder = builder(new ListQueryBuilder())
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, builder.objectBuilder.name(name)] : [name, builder.objectBuilder]

		return new ListQueryBuilder(this.objectBuilder.object(objectName, objectBuilder))
	}
}
