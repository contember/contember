import { Input } from 'cms-common'
import Literal from '../graphQlBuilder/Literal'
import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import DataBuilder from './DataBuilder'

export default class CreateBuilder {
	constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	data(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData === undefined ? this : new CreateBuilder(this.objectBuilder.argument('data', resolvedData))
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
