import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { CreateDataBuilder } from './CreateDataBuilder'
import { DataBuilder } from './DataBuilder'
import { UnboundedGetQueryBuilder } from './UnboundedGetQueryBuilder'

export class CreateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	data(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData === undefined ? this : new CreateBuilder(this.objectBuilder.argument('data', resolvedData))
	}

	column(name: string) {
		return new CreateBuilder(this.objectBuilder.field(name))
	}

	inlineFragment(typeName: string, builder: ObjectBuilder | ((builder: ObjectBuilder) => ObjectBuilder)) {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}
		return new CreateBuilder(this.objectBuilder.fragment(typeName, builder))
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

		return new CreateBuilder(this.objectBuilder.object(objectName, objectBuilder))
	}
}
