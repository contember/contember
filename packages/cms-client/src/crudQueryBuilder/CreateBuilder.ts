import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import DataBuilder from './DataBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class CreateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	data(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		return new CreateBuilder(this.objectBuilder.argument('data', DataBuilder.resolveData(data, CreateDataBuilder)))
	}

	column(name: string) {
		return new CreateBuilder(this.objectBuilder.field(name))
	}

	relation(name: string, builder: ObjectBuilder | ((builder: ObjectBuilder) => ObjectBuilder)) {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}
		return new CreateBuilder(this.objectBuilder.object(name, builder))
	}
}
