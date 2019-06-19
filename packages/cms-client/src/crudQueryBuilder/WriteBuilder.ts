import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { DataBuilder } from './DataBuilder'
import { ReadBuilder } from './ReadBuilder'
import { WriteArguments, WriteFields, WriteOperation } from './types'
import { ValidationRelationBuilder } from './ValidationRelationBuilder'
import { WriteDataBuilder } from './WriteDataBuilder'

class WriteBuilder<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation> {
	protected constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	public static create<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): WriteBuilder.Builder<AA, AF, Op> {
		return new WriteBuilder<AA, AF, Op>(objectBuilder)
	}

	public static createFromFactory<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation>(
		builder: WriteBuilder.BuilderFactory<AA, AF, Op>
	): WriteBuilder.Builder<never, never, Op> {
		if (typeof builder === 'function') {
			return builder(WriteBuilder.create())
		}
		return builder
	}

	public data(data: DataBuilder.DataLike<WriteDataBuilder.DataFormat[Op], WriteDataBuilder<Op>>) {
		const resolvedData = DataBuilder.resolveData(data, WriteDataBuilder as { new (): WriteDataBuilder<Op> })
		return WriteBuilder.create<Exclude<AA, 'data'>, AF, Op>(
			resolvedData === undefined ? this.objectBuilder : this.objectBuilder.argument('data', resolvedData)
		)
	}

	public by(by: Input.UniqueWhere<Literal>) {
		return WriteBuilder.create<Exclude<AA, 'by'>, AF, Op>(this.objectBuilder.argument('by', by))
	}

	public ok() {
		return WriteBuilder.create<AA, Exclude<AF, 'ok'>, Op>(this.objectBuilder.field('ok'))
	}

	public validation() {
		return WriteBuilder.create<AA, Exclude<AF, 'validation'>, Op>(
			ValidationRelationBuilder.validationRelation(this.objectBuilder)
		)
	}

	public node(builder: ReadBuilder.BuilderFactory<never>) {
		const readBuilder = ReadBuilder.createFromFactory(builder)
		return WriteBuilder.create<AA, Exclude<AF, 'node'>, Op>(
			this.objectBuilder.object('node', readBuilder.objectBuilder)
		)
	}
}

namespace WriteBuilder {
	export type Builder<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation> = Omit<
		Omit<WriteBuilder<AA, AF, Op>, Exclude<WriteArguments, AA>>,
		Exclude<WriteFields, AF>
	>

	export type BuilderFactory<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation> =
		| Builder<never, never, Op>
		| ((builder: Builder<AA, AF, Op>) => Builder<never, never, Op>)
}

export { WriteBuilder }
