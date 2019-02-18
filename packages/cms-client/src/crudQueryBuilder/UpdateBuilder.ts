import { Input } from 'cms-common'
import Literal from '../graphQlBuilder/Literal'
import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import DataBuilder from './DataBuilder'
import UpdateDataBuilder from './UpdateDataBuilder'

export default class UpdateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	where(where: Input.UniqueWhere<Literal>) {
		return new UpdateBuilder(this.objectBuilder.argument('by', where))
	}

	data(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)
		return resolvedData === undefined ? this : new UpdateBuilder(this.objectBuilder.argument('data', resolvedData))
	}

	column(name: string) {
		return new UpdateBuilder(this.objectBuilder.field(name))
	}

	relation(name: string, builder: ObjectBuilder | ((builder: ObjectBuilder) => ObjectBuilder)) {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}
		return new UpdateBuilder(this.objectBuilder.object(name, builder))
	}
}
