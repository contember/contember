import DataBuilder from './DataBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import UpdateDataBuilder from './UpdateDataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class UpdateOneRelationBuilder<
	D extends Input.UpdateOneRelationInput<Literal> | undefined = Input.UpdateOneRelationInput<Literal>
> {
	constructor(public readonly data: D = undefined as D) {}

	public create(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		return new UpdateOneRelationBuilder({ create: DataBuilder.resolveData(data, CreateDataBuilder) })
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

	public update(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		return new UpdateOneRelationBuilder({ update: DataBuilder.resolveData(data, UpdateDataBuilder) })
	}

	public upsert(
		update: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>,
		create: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>
	) {
		return new UpdateOneRelationBuilder({
			upsert: {
				update: DataBuilder.resolveData(update, UpdateDataBuilder),
				create: DataBuilder.resolveData(create, CreateDataBuilder)
			}
		})
	}
}
