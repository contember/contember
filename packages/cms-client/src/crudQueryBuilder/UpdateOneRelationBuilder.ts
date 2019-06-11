import { Input } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { CreateDataBuilder } from './CreateDataBuilder'
import { DataBuilder } from './DataBuilder'
import { UpdateDataBuilder } from './UpdateDataBuilder'

export class UpdateOneRelationBuilder<
	D extends Input.UpdateOneRelationInput<Literal> | undefined = Input.UpdateOneRelationInput<Literal>
> {
	constructor(public readonly data: D = undefined as D) {}

	public create(
		data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	): UpdateOneRelationBuilder<Input.UpdateOneRelationInput<Literal>> | this {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData === undefined ? this : new UpdateOneRelationBuilder({ create: resolvedData })
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return new UpdateOneRelationBuilder({ connect: where })
	}

	public delete() {
		return new UpdateOneRelationBuilder({ delete: true })
	}

	public disconnect() {
		return new UpdateOneRelationBuilder({ disconnect: true })
	}

	public update(
		data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>
	): UpdateOneRelationBuilder<Input.UpdateOneRelationInput<Literal>> | this {
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)
		return resolvedData === undefined ? this : new UpdateOneRelationBuilder({ update: resolvedData })
	}

	public upsert(
		update: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>,
		create: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	) {
		const resolvedUpdate = DataBuilder.resolveData(update, UpdateDataBuilder)
		const resolvedCreate = DataBuilder.resolveData(create, CreateDataBuilder)

		return resolvedUpdate === undefined && resolvedCreate === undefined
			? this
			: new UpdateOneRelationBuilder({
					upsert: {
						update: resolvedUpdate || {},
						create: resolvedCreate || {}
					}
			  })
	}
}
