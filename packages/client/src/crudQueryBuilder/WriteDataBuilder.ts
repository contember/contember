import { Input } from '@contember/schema'
import { isEmptyObject } from '../utils'
import { Literal } from '../graphQlBuilder'
import { WriteOperation } from './types'
import { WriteManyRelationBuilder } from './WriteManyRelationBuilder'
import { WriteOneRelationBuilder } from './WriteOneRelationBuilder'

class WriteDataBuilder<Op extends WriteOperation.ContentfulOperation> {
	public readonly data: WriteDataBuilder.DataFormat[Op['op']]

	public constructor(data?: WriteDataBuilder.DataFormat[Op['op']]) {
		this.data = data || {}
	}

	public static resolveData<Op extends WriteOperation.ContentfulOperation>(
		dataLike: WriteDataBuilder.DataLike<Op>,
	): WriteDataBuilder.DataFormat[Op['op']] | undefined {
		let resolvedData: WriteDataBuilder.DataFormat[Op['op']]

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
					[fieldName]: resolvedData,
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

	export type DataLike<Op extends WriteOperation.ContentfulOperation> =
		| DataFormat[Op['op']]
		| WriteDataBuilder<Op>
		| ((builder: WriteDataBuilder<Op>) => WriteDataBuilder<Op>)
}

export { WriteDataBuilder }
