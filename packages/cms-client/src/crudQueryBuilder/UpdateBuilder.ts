import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { DataBuilder } from './DataBuilder'
import { UnboundedGetQueryBuilder } from './UnboundedGetQueryBuilder'
import { UpdateDataBuilder } from './UpdateDataBuilder'

export class UpdateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	by(by: Input.UniqueWhere<Literal>) {
		return new UpdateBuilder(this.objectBuilder.argument('by', by))
	}

	data(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)
		return resolvedData === undefined ? this : new UpdateBuilder(this.objectBuilder.argument('data', resolvedData))
	}

	column(name: string) {
		return new UpdateBuilder(this.objectBuilder.field(name))
	}

	inlineFragment(
		typeName: string,
		builder: UnboundedGetQueryBuilder | ((builder: UnboundedGetQueryBuilder) => UnboundedGetQueryBuilder)
	) {
		if (!(builder instanceof UnboundedGetQueryBuilder)) {
			builder = builder(new UnboundedGetQueryBuilder())
		}
		return new UpdateBuilder(this.objectBuilder.fragment(typeName, builder.objectBuilder))
	}

	relation(
		name: string,
		builder: UnboundedGetQueryBuilder | ((builder: UnboundedGetQueryBuilder) => UnboundedGetQueryBuilder)
	) {
		if (!(builder instanceof UnboundedGetQueryBuilder)) {
			builder = builder(new UnboundedGetQueryBuilder())
		}
		return new UpdateBuilder(this.objectBuilder.object(name, builder.objectBuilder))
	}
}
