import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import UpdateDataBuilder from './UpdateDataBuilder'
import DataBuilder from './DataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class UpdateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	where(where: Input.UniqueWhere<Literal>) {
		return new UpdateBuilder(this.objectBuilder.argument('where', where))
	}

	data(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		return new UpdateBuilder(this.objectBuilder.argument('data', DataBuilder.resolveData(data, UpdateDataBuilder)))
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
