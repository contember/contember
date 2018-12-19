import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import UpdateDataBuilder from './UpdateDataBuilder'
import DataBuilder from './DataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input, isEmptyObject } from 'cms-common'

export default class UpdateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	where(where: Input.UniqueWhere<Literal>) {
		return new UpdateBuilder(this.objectBuilder.argument('by', where))
	}

	data(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)
		return isEmptyObject(resolvedData) ? this : new UpdateBuilder(this.objectBuilder.argument('data', resolvedData))
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
