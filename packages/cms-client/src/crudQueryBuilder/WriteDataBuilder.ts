import { Input } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { WriteOperation, WriteRelationOps } from './types'
import { WriteManyRelationBuilder } from './WriteManyRelationBuilder'
import { WriteOneRelationBuilder } from './WriteOneRelationBuilder'

class WriteDataBuilder<Op extends WriteOperation> {
	public constructor(public readonly data: WriteDataBuilder.DataFormat[Op]) {}

	public set(fieldName: string, value: Input.ColumnValue<Literal>) {
		return new WriteDataBuilder<Op>({ ...this.data, [fieldName]: value })
	}

	public many(fieldName: string, data: WriteManyRelationBuilder.BuilderFactory<Op>): WriteDataBuilder<Op> {
		const resolvedData = WriteManyRelationBuilder.instantiateFromFactory(data).data
		return resolvedData === undefined
			? this
			: new WriteDataBuilder<Op>({
					...this.data,
					[fieldName]: resolvedData
			  })
	}

	public one(fieldName: string, data: WriteOneRelationBuilder.BuilderFactory<Op>): WriteDataBuilder<Op> {
		const resolvedData = WriteOneRelationBuilder.instantiateFromFactory(data).data
		return new WriteDataBuilder<Op>({ ...this.data, [fieldName]: resolvedData })
	}
}

namespace WriteDataBuilder {
	export interface DataFormat {
		create: Input.CreateDataInput<Literal>
		update: Input.UpdateDataInput<Literal>
	}
}

export { WriteDataBuilder }
