import DataBuilder from './DataBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import UpdateDataBuilder from './UpdateDataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input, isEmptyObject } from 'cms-common'

export default class UpdateOneRelationBuilder<
	D extends Input.UpdateOneRelationInput<Literal> | undefined = Input.UpdateOneRelationInput<Literal>
> {
	constructor(public readonly data: D = undefined as D) {}

	public create(
		data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	): UpdateOneRelationBuilder<Input.UpdateOneRelationInput<Literal>> | this {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)
		return resolvedData ? new UpdateOneRelationBuilder({ create: resolvedData }) : this
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
		return resolvedData ? new UpdateOneRelationBuilder({ update: resolvedData }) : this
	}

	public upsert(
		update: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>,
		create: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	) {
		const resolvedUpdate = DataBuilder.resolveData(update, UpdateDataBuilder)
		const resolvedCreate = DataBuilder.resolveData(create, CreateDataBuilder)

		return isEmptyObject(resolvedUpdate) && isEmptyObject(resolvedCreate)
			? this
			: new UpdateOneRelationBuilder({
					upsert: {
						update: resolvedUpdate,
						create: resolvedCreate
					}
			  })
	}
}
