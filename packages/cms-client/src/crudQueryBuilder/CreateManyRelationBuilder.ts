import { DataBuilder } from './DataBuilder'
import { CreateDataBuilder } from './CreateDataBuilder'
import { Literal } from '../graphQlBuilder'

import { Input } from 'cms-common'

export class CreateManyRelationBuilder {
	constructor(public readonly data: Input.CreateManyRelationInput<Literal> = []) {}

	public create(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData === undefined ? this : new CreateManyRelationBuilder([...this.data, { create: resolvedData }])
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return new CreateManyRelationBuilder([...this.data, { connect: where }])
	}
}
