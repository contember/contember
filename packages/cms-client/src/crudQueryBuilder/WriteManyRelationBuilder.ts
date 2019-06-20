import { Input } from 'cms-common'
import { Literal } from '../graphQlBuilder'
import { WriteOperation, WriteRelationOps } from './types'
import { WriteDataBuilder } from './WriteDataBuilder'

class WriteManyRelationBuilder<Op extends WriteOperation, Allowed extends WriteRelationOps[Op]> {
	private constructor(public readonly data: WriteManyRelationBuilder.DataFormat[Op] = []) {}

	public static instantiate<Op extends WriteOperation, Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op]>(
		data: WriteManyRelationBuilder.DataFormat[Op] = []
	): WriteManyRelationBuilder.Builder<Op, Allowed> {
		return new WriteManyRelationBuilder<Op, Allowed>(data)
	}

	public static instantiateFromFactory<Op extends WriteOperation, Allowed extends WriteRelationOps[Op]>(
		builder: WriteManyRelationBuilder.BuilderFactory<Op, Allowed>
	): WriteManyRelationBuilder.Builder<Op, never> {
		if (typeof builder === 'function') {
			return builder(WriteManyRelationBuilder.instantiate())
		}
		if ('data' in builder) {
			return WriteManyRelationBuilder.instantiate(builder.data)
		}
		return WriteManyRelationBuilder.instantiate(builder)
	}

	public create(data: WriteDataBuilder.DataLike<WriteOperation.Create>): WriteManyRelationBuilder.Builder<Op> {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return (resolvedData === undefined
			? this
			: WriteManyRelationBuilder.instantiate<Op>([
					...this.data,
					{ create: resolvedData }
			  ] as WriteManyRelationBuilder.DataFormat[WriteOperation.Create])) as WriteManyRelationBuilder.Builder<Op>
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return WriteManyRelationBuilder.instantiate<Op>([
			...this.data,
			{ connect: where }
		] as WriteManyRelationBuilder.DataFormat[Op])
	}

	public delete(where: Input.UniqueWhere<Literal>) {
		return WriteManyRelationBuilder.instantiate<WriteOperation.Update>([...this.data, { delete: where }])
	}

	public disconnect(where: Input.UniqueWhere<Literal>) {
		return WriteManyRelationBuilder.instantiate<WriteOperation.Update>([...this.data, { disconnect: where }])
	}

	public update(
		where: Input.UniqueWhere<Literal>,
		data: WriteDataBuilder.DataLike<WriteOperation.Update>
	): WriteManyRelationBuilder.Builder<WriteOperation.Update> {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return (resolvedData === undefined
			? this
			: WriteManyRelationBuilder.instantiate<WriteOperation.Update>([
					...this.data,
					{ update: { by: where, data: resolvedData } }
			  ])) as WriteManyRelationBuilder.Builder<WriteOperation.Update>
	}

	public upsert(
		where: Input.UniqueWhere<Literal>,
		update: WriteDataBuilder.DataLike<WriteOperation.Update>,
		create: WriteDataBuilder.DataLike<WriteOperation.Create>
	): WriteManyRelationBuilder.Builder<WriteOperation.Update> {
		const resolvedUpdate = WriteDataBuilder.resolveData(update)
		const resolvedCreate = WriteDataBuilder.resolveData(create)
		return (resolvedUpdate === undefined && resolvedCreate === undefined
			? this
			: WriteManyRelationBuilder.instantiate<WriteOperation.Update>([
					...this.data,
					{
						upsert: {
							by: where,
							update: resolvedUpdate || {},
							create: resolvedCreate || {}
						}
					}
			  ])) as WriteManyRelationBuilder.Builder<WriteOperation.Update>
	}
}

namespace WriteManyRelationBuilder {
	export interface DataFormat {
		create: Input.CreateManyRelationInput<Literal>
		update: Input.UpdateManyRelationInput<Literal>
	}

	export type Builder<Op extends WriteOperation, Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op]> = Omit<
		WriteManyRelationBuilder<Op, Allowed>,
		Exclude<WriteRelationOps[WriteOperation], Allowed>
	>

	export type BuilderFactory<Op extends WriteOperation, Allowed extends WriteRelationOps[Op] = WriteRelationOps[Op]> =
		| DataFormat[Op]
		| Builder<Op, never>
		| ((builder: Builder<Op, Allowed>) => Builder<Op, never>)
}

export { WriteManyRelationBuilder }
