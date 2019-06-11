import { DataBuilder } from './DataBuilder'
import { CreateDataBuilder } from './CreateDataBuilder'
import { Literal } from '../graphQlBuilder'

import { Input } from 'cms-common'

export class CreateOneRelationBuilder<
	D extends Input.CreateOneRelationInput<Literal> | undefined = Input.CreateOneRelationInput<Literal>
> {
	constructor(public readonly data: D = undefined as D) {}

	public create(
		data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	): CreateOneRelationBuilder<D> | CreateOneRelationBuilder<{ create: Input.CreateDataInput<Literal> }> {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData === undefined ? this : new CreateOneRelationBuilder({ create: resolvedData })
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return new CreateOneRelationBuilder({ connect: where })
	}
}
