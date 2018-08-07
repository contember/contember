import DataBuilder from './DataBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class CreateOneRelationBuilder<
	D extends Input.CreateOneRelationInput<Literal> | undefined = Input.CreateOneRelationInput<Literal>
> {
	constructor(public readonly data: D = undefined as D) {}

	public create(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		return new CreateOneRelationBuilder({ create: DataBuilder.resolveData(data, CreateDataBuilder) })
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return new CreateOneRelationBuilder({ connect: where })
	}
}
