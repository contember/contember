import { Input } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { CreateDataBuilder } from './CreateDataBuilder'
import { DataBuilder } from './DataBuilder'
import { UpdateDataBuilder } from './UpdateDataBuilder'

export class UpdateManyRelationBuilder {
	constructor(public readonly data: Input.UpdateManyRelationInput<Literal> = []) {}

	public create(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData === undefined ? this : new UpdateManyRelationBuilder([...this.data, { create: resolvedData }])
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
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)
		return resolvedData === undefined
			? this
			: new UpdateManyRelationBuilder([...this.data, { update: { by: where, data: resolvedData } }])
	}

	public upsert(
		where: Input.UniqueWhere<Literal>,
		update: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>,
		create: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	) {
		const updateInput = DataBuilder.resolveData(update, UpdateDataBuilder)
		const createInput = DataBuilder.resolveData(create, CreateDataBuilder)
		return updateInput === undefined && createInput === undefined
			? this
			: new UpdateManyRelationBuilder([
					...this.data,
					{
						upsert: {
							by: where,
							update: updateInput || {},
							create: createInput || {}
						}
					}
			  ])
	}
}
