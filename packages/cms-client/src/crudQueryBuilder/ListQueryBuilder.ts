import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { UnboundedGetQueryBuilder } from './UnboundedGetQueryBuilder'

export class ListQueryBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	filter(where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>>) {
		return new ListQueryBuilder(this.objectBuilder.argument('filter', where))
	}

	column(name: string) {
		return new ListQueryBuilder(this.objectBuilder.field(name))
	}

	inlineFragment(
		typeName: string,
		builder: UnboundedGetQueryBuilder | ((builder: UnboundedGetQueryBuilder) => UnboundedGetQueryBuilder)
	) {
		if (!(builder instanceof UnboundedGetQueryBuilder)) {
			builder = builder(new UnboundedGetQueryBuilder())
		}
		return new ListQueryBuilder(this.objectBuilder.fragment(typeName, builder.objectBuilder))
	}

	relation(
		name: string,
		builder: UnboundedGetQueryBuilder | ((builder: UnboundedGetQueryBuilder) => UnboundedGetQueryBuilder),
		alias?: string
	) {
		if (!(builder instanceof UnboundedGetQueryBuilder)) {
			builder = builder(new UnboundedGetQueryBuilder())
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, builder.objectBuilder.name(name)] : [name, builder.objectBuilder]

		return new ListQueryBuilder(this.objectBuilder.object(objectName, objectBuilder))
	}
}
