import type { Input } from '@contember/schema'
import type { GraphQlLiteral } from '../graphQlBuilder'
import type { WriteOperation, WriteRelationOps } from './types'
import { WriteDataBuilder } from './WriteDataBuilder'

class WriteManyRelationBuilder<
	Op extends WriteOperation.ContentfulOperation,
	Allowed extends WriteRelationOps[Op['op']]
> {
	private constructor(public readonly data: WriteManyRelationBuilder.DataFormat[Op['op']] = []) {}

	public static instantiate<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']]
	>(data: WriteManyRelationBuilder.DataFormat[Op['op']] = []): WriteManyRelationBuilder.Builder<Op, Allowed> {
		return new WriteManyRelationBuilder<Op, Allowed>(data)
	}

	public static instantiateFromFactory<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']]
	>(builder: WriteManyRelationBuilder.BuilderFactory<Op, Allowed>): WriteManyRelationBuilder.Builder<Op, never> {
		if (typeof builder === 'function') {
			return builder(WriteManyRelationBuilder.instantiate())
		}
		if ('data' in builder) {
			return WriteManyRelationBuilder.instantiate(builder.data)
		}
		return WriteManyRelationBuilder.instantiate(builder)
	}

	public create(
		data: WriteDataBuilder.DataLike<WriteOperation.Create>,
		alias?: string,
	): WriteManyRelationBuilder.Builder<Op> {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return (resolvedData === undefined
			? this
			: WriteManyRelationBuilder.instantiate<Op>([
					...this.data,
					this.withAlias({ create: resolvedData }, alias),
			  ] as WriteManyRelationBuilder.DataFormat[WriteOperation.Create['op']])) as WriteManyRelationBuilder.Builder<Op>
	}

	public connect(where: Input.UniqueWhere<GraphQlLiteral>, alias?: string) {
		return WriteManyRelationBuilder.instantiate<Op>([
			...this.data,
			this.withAlias({ connect: where }, alias),
		] as WriteManyRelationBuilder.DataFormat[Op['op']])
	}

	public delete(where: Input.UniqueWhere<GraphQlLiteral>, alias?: string) {
		return WriteManyRelationBuilder.instantiate<WriteOperation.Update>([
			...this.data,
			this.withAlias({ delete: where }, alias),
		])
	}

	public disconnect(where: Input.UniqueWhere<GraphQlLiteral>, alias?: string) {
		return WriteManyRelationBuilder.instantiate<WriteOperation.Update>([
			...this.data,
			this.withAlias({ disconnect: where }, alias),
		])
	}

	public update(
		where: Input.UniqueWhere<GraphQlLiteral>,
		data: WriteDataBuilder.DataLike<WriteOperation.Update>,
		alias?: string,
	): WriteManyRelationBuilder.Builder<WriteOperation.Update> {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return (resolvedData === undefined
			? this
			: WriteManyRelationBuilder.instantiate<WriteOperation.Update>([
					...this.data,
					this.withAlias({ update: { by: where, data: resolvedData } }, alias),
			  ])) as WriteManyRelationBuilder.Builder<WriteOperation.Update>
	}

	public upsert(
		where: Input.UniqueWhere<GraphQlLiteral>,
		update: WriteDataBuilder.DataLike<WriteOperation.Update>,
		create: WriteDataBuilder.DataLike<WriteOperation.Create>,
		alias?: string,
	): WriteManyRelationBuilder.Builder<WriteOperation.Update> {
		const resolvedUpdate = WriteDataBuilder.resolveData(update)
		const resolvedCreate = WriteDataBuilder.resolveData(create)
		return (resolvedUpdate === undefined && resolvedCreate === undefined
			? this
			: WriteManyRelationBuilder.instantiate<WriteOperation.Update>([
					...this.data,
					this.withAlias(
						{
							upsert: {
								by: where,
								update: resolvedUpdate || {},
								create: resolvedCreate || {},
							},
						},
						alias,
					),
			  ])) as WriteManyRelationBuilder.Builder<WriteOperation.Update>
	}

	private withAlias<D extends Input.CreateOneRelationInput<GraphQlLiteral> | Input.UpdateManyRelationInputItem<GraphQlLiteral>>(
		data: D,
		alias?: string,
	): D {
		if (alias !== undefined) {
			data.alias = alias
		}
		return data
	}
}

namespace WriteManyRelationBuilder {
	export interface DataFormat {
		create: Input.CreateManyRelationInput<GraphQlLiteral>
		update: Input.UpdateManyRelationInput<GraphQlLiteral>
	}

	export type Builder<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']]
	> = Omit<
		WriteManyRelationBuilder<Op, Allowed>,
		Exclude<WriteRelationOps[WriteOperation.ContentfulOperation['op']], Allowed>
	>

	export type BuilderFactory<
		Op extends WriteOperation.ContentfulOperation,
		Allowed extends WriteRelationOps[Op['op']] = WriteRelationOps[Op['op']]
	> = DataFormat[Op['op']] | Builder<Op, never> | ((builder: Builder<Op, Allowed>) => Builder<Op, never>)
}

export { WriteManyRelationBuilder }
