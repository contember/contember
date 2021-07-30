import type { Input, Value } from '@contember/schema'
import { GraphQlLiteral } from '../graphQlBuilder'
import { isEmptyObject } from '../utils'
import { CrudQueryBuilderError } from './CrudQueryBuilderError'
import type { WriteOperation } from './types'
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

	public set(fieldName: string, value: Input.ColumnValue<GraphQlLiteral>) {
		return new WriteDataBuilder<Op>({ ...this.data, [fieldName]: value })
	}

	public many(fieldName: string, data: WriteManyRelationBuilder.BuilderFactory<Op>): WriteDataBuilder<Op> {
		const resolvedData = WriteManyRelationBuilder.instantiateFromFactory(data).data
		return resolvedData === undefined || resolvedData.length === 0
			? this
			: new WriteDataBuilder<Op>(this.mergeInFreshData(this.data, fieldName, resolvedData))
	}

	public one(fieldName: string, data: WriteOneRelationBuilder.BuilderFactory<Op>): WriteDataBuilder<Op> {
		const resolvedData = WriteOneRelationBuilder.instantiateFromFactory(data).data
		return resolvedData === undefined || isEmptyObject(resolvedData)
			? this
			: new WriteDataBuilder<Op>(this.mergeInFreshData(this.data, fieldName, resolvedData))
	}

	private mergeInFreshData(
		original: WriteDataBuilder.DataFormat[Op['op']],
		fieldName: string,
		fresh: WriteManyRelationBuilder.DataFormat[Op['op']] | WriteOneRelationBuilder.DataFormat[Op['op']],
	): WriteDataBuilder.DataFormat[Op['op']] {
		if (fieldName in original) {
			const existingValue = original[fieldName]
			if (Array.isArray(existingValue)) {
				if (Array.isArray(fresh)) {
					return { ...original, [fieldName]: [...existingValue, ...fresh] }
				}
				throw new CrudQueryBuilderError(`Inconsistent data.`)
			}
			if (Array.isArray(fresh)) {
				throw new CrudQueryBuilderError(`Inconsistent data.`)
			}
			return { ...original, [fieldName]: this.mergeUpdateOne(existingValue, fresh) }
		}
		return { ...original, [fieldName]: fresh }
	}

	private mergeUpdateOne(
		original:
			| Value.FieldValue<GraphQlLiteral>
			| Input.CreateOneRelationInput<GraphQlLiteral>
			| Input.UpdateOneRelationInput<GraphQlLiteral>,
		fresh:
			| Value.FieldValue<GraphQlLiteral>
			| Input.CreateOneRelationInput<GraphQlLiteral>
			| Input.UpdateOneRelationInput<GraphQlLiteral>,
	):
		| Value.FieldValue<GraphQlLiteral>
		| Input.CreateOneRelationInput<GraphQlLiteral>
		| Input.UpdateOneRelationInput<GraphQlLiteral> {
		// TODO This implementation pretty bad but it will have to do for now.
		if (original instanceof GraphQlLiteral) {
			if (fresh instanceof GraphQlLiteral) {
				if (original.value === fresh.value) {
					return original
				}
			}
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}
		if (fresh instanceof GraphQlLiteral) {
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}

		if (Array.isArray(original)) {
			if (Array.isArray(fresh)) {
				return [...original, ...fresh]
			}
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}
		if (Array.isArray(fresh)) {
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}

		if (original === null) {
			if (fresh === null) {
				return original
			}
		}
		if (fresh === null) {
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}

		if (typeof original === 'object') {
			if (typeof fresh === 'object') {
				const composite: any = { ...original }
				for (const field in fresh) {
					const fromFresh = (fresh as any)[field]
					composite[field] = field in composite ? this.mergeUpdateOne(composite[field], fromFresh) : fromFresh
				}
				return composite
			}
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}
		if (typeof fresh === 'object') {
			throw new CrudQueryBuilderError(`Inconsistent data.`)
		}

		if (original === fresh) {
			return original
		}
		throw new CrudQueryBuilderError(`Inconsistent data.`)
	}
}

namespace WriteDataBuilder {
	export interface DataFormat {
		create: Input.CreateDataInput<GraphQlLiteral>
		update: Input.UpdateDataInput<GraphQlLiteral>
	}

	export type DataLike<Op extends WriteOperation.ContentfulOperation> =
		| DataFormat[Op['op']]
		| WriteDataBuilder<Op>
		| ((builder: WriteDataBuilder<Op>) => WriteDataBuilder<Op>)
}

export { WriteDataBuilder }
