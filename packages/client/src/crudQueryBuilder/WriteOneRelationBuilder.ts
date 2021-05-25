import type { Input } from '@contember/schema'
import type { Literal } from '../graphQlBuilder'
import type { WriteOperation, WriteRelationOps } from './types'
import { WriteDataBuilder } from './WriteDataBuilder'

class WriteOneRelationBuilder<
	Op extends WriteOperation.ContentfulOperation,
	Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']],
	D extends WriteOneRelationBuilder.DataFormat[Op['op']] | undefined = WriteOneRelationBuilder.DataFormat[Op['op']]
> {
	protected constructor(public readonly data: D = undefined as D) {}

	public static instantiate<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']],
		D extends WriteOneRelationBuilder.DataFormat[Op['op']] | undefined = WriteOneRelationBuilder.DataFormat[Op['op']]
	>(data: D = undefined as D): WriteOneRelationBuilder.Builder<Op, Allowed, D> {
		return new WriteOneRelationBuilder<Op, Allowed, D>(data)
	}

	public static instantiateFromFactory<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']],
		D extends WriteOneRelationBuilder.DataFormat[Op['op']] | undefined = WriteOneRelationBuilder.DataFormat[Op['op']]
	>(builder: WriteOneRelationBuilder.BuilderFactory<Op, Allowed, D>): WriteOneRelationBuilder.Builder<Op, never, D> {
		if (typeof builder === 'function') {
			return builder(WriteOneRelationBuilder.instantiate())
		}
		if (builder && 'data' in builder!) {
			return WriteOneRelationBuilder.instantiate(builder.data)
		}
		return WriteOneRelationBuilder.instantiate(builder)
	}

	public create(data: WriteDataBuilder.DataLike<WriteOperation.Create>) {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return resolvedData === undefined
			? this
			: WriteOneRelationBuilder.instantiate<Op, never>({
					create: resolvedData,
			  })
	}

	public connect(where: Input.UniqueWhere<Literal>) {
		return WriteOneRelationBuilder.instantiate<Op, never>({ connect: where })
	}

	public delete() {
		return WriteOneRelationBuilder.instantiate<WriteOperation.Update, never>({ delete: true })
	}

	public disconnect() {
		return WriteOneRelationBuilder.instantiate<WriteOperation.Update, never>({ disconnect: true })
	}

	public update(data: WriteDataBuilder.DataLike<WriteOperation.Update>) {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return resolvedData === undefined ? this : new WriteOneRelationBuilder({ update: resolvedData })
	}

	public upsert(
		update: WriteDataBuilder.DataLike<WriteOperation.Update>,
		create: WriteDataBuilder.DataLike<WriteOperation.Create>,
	) {
		const resolvedCreate = WriteDataBuilder.resolveData(create)
		const resolvedUpdate = WriteDataBuilder.resolveData(update)

		return resolvedUpdate === undefined && resolvedCreate === undefined
			? this
			: WriteOneRelationBuilder.instantiate<WriteOperation.Update, never>({
					upsert: {
						update: resolvedUpdate || {},
						create: resolvedCreate || {},
					},
			  })
	}
}

namespace WriteOneRelationBuilder {
	export interface DataFormat {
		create: Input.CreateOneRelationInput<Literal>
		update: Input.UpdateOneRelationInput<Literal>
	}

	export type Builder<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']],
		D extends WriteOneRelationBuilder.DataFormat[Op['op']] | undefined = WriteOneRelationBuilder.DataFormat[Op['op']]
	> = Omit<
		WriteOneRelationBuilder<Op, Allowed, D>,
		Exclude<WriteRelationOps[WriteOperation.ContentfulOperation['op']], Allowed>
	>

	export type BuilderFactory<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']],
		D extends WriteOneRelationBuilder.DataFormat[Op['op']] | undefined = WriteOneRelationBuilder.DataFormat[Op['op']]
	> = D | Builder<Op, never, D> | ((builder: Builder<Op, Allowed, D>) => Builder<Op, never, D>)
}

export { WriteOneRelationBuilder }
