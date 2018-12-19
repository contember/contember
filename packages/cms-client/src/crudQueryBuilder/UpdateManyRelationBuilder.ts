import DataBuilder from './DataBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import UpdateDataBuilder from './UpdateDataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input, isEmptyObject } from 'cms-common'

export default class UpdateManyRelationBuilder {
	constructor(public readonly data: Input.UpdateManyRelationInput<Literal> = []) {}

	public create(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData ? new UpdateManyRelationBuilder([...this.data, { create: resolvedData }]) : this
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return new UpdateManyRelationBuilder([...this.data, { connect: where }])
	}

	public delete(where: Input.UniqueWhere<Literal>) {
		return new UpdateManyRelationBuilder([...this.data, { delete: where }])
	}

	public disconnect(where: Input.UniqueWhere<Literal>) {
		return new UpdateManyRelationBuilder([...this.data, { disconnect: where }])
	}

	public update(
		where: Input.UniqueWhere<Literal>,
		data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>
	) {
		const input = DataBuilder.resolveData(data, UpdateDataBuilder)
		return input ? new UpdateManyRelationBuilder([...this.data, { update: { by: where, data: input } }]) : this
	}

	public upsert(
		where: Input.UniqueWhere<Literal>,
		update: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>,
		create: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	) {
		const updateInput = DataBuilder.resolveData(update, UpdateDataBuilder)
		const createInput = DataBuilder.resolveData(create, CreateDataBuilder)
		return isEmptyObject(updateInput) && isEmptyObject(createInput)
			? this
			: new UpdateManyRelationBuilder([
					...this.data,
					{
						upsert: {
							by: where,
							update: updateInput,
							create: createInput
						}
					}
			  ])
	}
}
