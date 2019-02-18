import { Input } from 'cms-common'
import Literal from '../graphQlBuilder/Literal'
import DataBuilder from './DataBuilder'
import UpdateManyRelationBuilder from './UpdateManyRelationBuilder'
import UpdateOneRelationBuilder from './UpdateOneRelationBuilder'

export default class UpdateDataBuilder {
	constructor(public readonly data: Input.UpdateDataInput<Literal> = {}) {}

	public set(fieldName: string, value: Input.ColumnValue<Literal>) {
		return new UpdateDataBuilder({ ...this.data, [fieldName]: value })
	}

	public many(
		fieldName: string,
		data: DataBuilder.DataLike<Input.UpdateManyRelationInput<Literal>, UpdateManyRelationBuilder>
	) {
		const resolvedData = DataBuilder.resolveData(data, UpdateManyRelationBuilder)
		return resolvedData === undefined
			? this
			: new UpdateDataBuilder({
					...this.data,
					[fieldName]: resolvedData
			  })
	}

	public one(
		fieldName: string,
		data: DataBuilder.DataLike<
			Input.UpdateOneRelationInput<Literal>,
			UpdateOneRelationBuilder,
			UpdateOneRelationBuilder<undefined>
		>
	) {
		const resolvedData = DataBuilder.resolveData<
			Input.UpdateOneRelationInput<Literal>,
			UpdateOneRelationBuilder,
			UpdateOneRelationBuilder<undefined>
		>(data, UpdateOneRelationBuilder)
		return resolvedData === undefined ? this : new UpdateDataBuilder({ ...this.data, [fieldName]: resolvedData })
	}
}
