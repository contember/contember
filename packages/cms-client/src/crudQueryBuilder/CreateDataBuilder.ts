import { Input } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { CreateManyRelationBuilder } from './CreateManyRelationBuilder'
import { CreateOneRelationBuilder } from './CreateOneRelationBuilder'
import { DataBuilder } from './DataBuilder'

export class CreateDataBuilder {
	constructor(public readonly data: Input.CreateDataInput<Literal> = {}) {}

	public set(fieldName: string, value: Input.ColumnValue<Literal>) {
		return new CreateDataBuilder({ ...this.data, [fieldName]: value })
	}

	public many(
		fieldName: string,
		data: DataBuilder.DataLike<Input.CreateManyRelationInput<Literal>, CreateManyRelationBuilder>
	) {
		const resolvedData = DataBuilder.resolveData(data, CreateManyRelationBuilder)
		return resolvedData === undefined
			? this
			: new CreateDataBuilder({
					...this.data,
					[fieldName]: resolvedData
			  })
	}

	public one(
		fieldName: string,
		data: DataBuilder.DataLike<
			Input.CreateOneRelationInput<Literal>,
			CreateOneRelationBuilder,
			CreateOneRelationBuilder<undefined>
		>
	) {
		const resolvedData = DataBuilder.resolveData<
			Input.CreateOneRelationInput<Literal>,
			CreateOneRelationBuilder,
			CreateOneRelationBuilder<undefined>
		>(data, CreateOneRelationBuilder)
		return resolvedData === undefined ? this : new CreateDataBuilder({ ...this.data, [fieldName]: resolvedData })
	}
}
