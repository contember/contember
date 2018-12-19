import DataBuilder from './DataBuilder'
import UpdateManyRelationBuilder from './UpdateManyRelationBuilder'
import UpdateOneRelationBuilder from './UpdateOneRelationBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input, isEmptyObject } from 'cms-common'

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
		return resolvedData
			? new UpdateDataBuilder({
					...this.data,
					[fieldName]: resolvedData
			  })
			: this
	}

	public one(
		fieldName: string,
		data: DataBuilder.DataLike<
			Input.UpdateOneRelationInput<Literal>,
			UpdateOneRelationBuilder,
			UpdateOneRelationBuilder<undefined>
		>
	) {
		const input = DataBuilder.resolveData<
			Input.UpdateOneRelationInput<Literal>,
			UpdateOneRelationBuilder,
			UpdateOneRelationBuilder<undefined>
		>(data, UpdateOneRelationBuilder)
		return isEmptyObject(input) ? this : new UpdateDataBuilder({ ...this.data, [fieldName]: input })
	}
}
