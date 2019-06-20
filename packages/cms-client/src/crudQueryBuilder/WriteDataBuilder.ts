import { Input, isEmptyObject } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { WriteOperation } from './types'
import { WriteManyRelationBuilder } from './WriteManyRelationBuilder'
import { WriteOneRelationBuilder } from './WriteOneRelationBuilder'

class WriteDataBuilder<Op extends WriteOperation> {
	public readonly data: WriteDataBuilder.DataFormat[Op]

	public constructor(data?: WriteDataBuilder.DataFormat[Op]) {
		this.data = data || {}
	}

	public static resolveData<Op extends WriteOperation>(
		dataLike: WriteDataBuilder.DataLike<Op>
	): WriteDataBuilder.DataFormat[Op] | undefined {
		let resolvedData: WriteDataBuilder.DataFormat[Op]

		if (dataLike instanceof WriteDataBuilder) {
			resolvedData = dataLike.data
		} else if (typeof dataLike === 'function') {
			resolvedData = dataLike(new WriteDataBuilder()).data
		} else {
			resolvedData = dataLike
		}

		if (isEmptyObject(resolvedData)) {
			return undefined
		}
		return resolvedData
	}

	public set(fieldName: string, value: Input.ColumnValue<Literal>) {
		return new WriteDataBuilder<Op>({ ...this.data, [fieldName]: value })
	}

	public many(fieldName: string, data: WriteManyRelationBuilder.BuilderFactory<Op>): WriteDataBuilder<Op> {
		const resolvedData = WriteManyRelationBuilder.instantiateFromFactory(data).data
		return resolvedData === undefined || resolvedData.length === 0
			? this
			: new WriteDataBuilder<Op>({
					...this.data,
					[fieldName]: resolvedData
			  })
	}

	public one(fieldName: string, data: WriteOneRelationBuilder.BuilderFactory<Op>): WriteDataBuilder<Op> {
		const resolvedData = WriteOneRelationBuilder.instantiateFromFactory(data).data
		return resolvedData === undefined || isEmptyObject(resolvedData)
			? this
			: new WriteDataBuilder<Op>({ ...this.data, [fieldName]: resolvedData })
	}
}

namespace WriteDataBuilder {
	export interface DataFormat {
		create: Input.CreateDataInput<Literal>
		update: Input.UpdateDataInput<Literal>
	}

	export type DataLike<Op extends WriteOperation> =
		| DataFormat[Op]
		| WriteDataBuilder<Op>
		| ((builder: WriteDataBuilder<Op>) => WriteDataBuilder<Op>)
}

export { WriteDataBuilder }
