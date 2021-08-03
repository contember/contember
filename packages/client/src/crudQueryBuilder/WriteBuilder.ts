import type { Input } from '@contember/schema'
import { GraphQlLiteral, ObjectBuilder } from '../graphQlBuilder'
import { ErrorsRelationBuilder } from './ErrorsRelationBuilder'
import { ReadBuilder } from './ReadBuilder'
import type { WriteArguments, WriteFields, WriteOperation } from './types'
import { ValidationRelationBuilder } from './ValidationRelationBuilder'
import { WriteDataBuilder } from './WriteDataBuilder'

class WriteBuilder<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation.Operation> {
	protected constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	public static instantiate<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation.Operation>(
		objectBuilder: ObjectBuilder = new ObjectBuilder(),
	): WriteBuilder.Builder<AA, AF, Op> {
		return new WriteBuilder<AA, AF, Op>(objectBuilder)
	}

	public static instantiateFromFactory<
		AA extends WriteArguments,
		AF extends WriteFields,
		Op extends WriteOperation.Operation,
	>(builder: WriteBuilder.BuilderFactory<AA, AF, Op>): WriteBuilder.Builder<never, never, Op> {
		if (typeof builder === 'function') {
			return builder(WriteBuilder.instantiate())
		}
		return builder
	}

	public data<SubOp extends Op & WriteOperation.ContentfulOperation>(data: WriteDataBuilder.DataLike<SubOp>) {
		const resolvedData = WriteDataBuilder.resolveData(data)
		return WriteBuilder.instantiate<Exclude<AA, 'data'>, AF, Op>(
			resolvedData === undefined ? this.objectBuilder : this.objectBuilder.argument('data', resolvedData),
		)
	}

	public by(by: Input.UniqueWhere<GraphQlLiteral>) {
		return WriteBuilder.instantiate<Exclude<AA, 'by'>, AF, Op>(this.objectBuilder.argument('by', by))
	}

	public ok() {
		return WriteBuilder.instantiate<AA, Exclude<AF, 'ok'>, Op>(this.objectBuilder.field('ok'))
	}

	public errorMessage() {
		return WriteBuilder.instantiate<AA, Exclude<AF, 'errorMessage'>, Op>(this.objectBuilder.field('errorMessage'))
	}

	public validation() {
		return WriteBuilder.instantiate<AA, Exclude<AF, 'validation'>, Op>(
			ValidationRelationBuilder.validationRelation(this.objectBuilder),
		)
	}

	public errors() {
		return WriteBuilder.instantiate<AA, Exclude<AF, 'errors'>, Op>(
			ErrorsRelationBuilder.errorsRelation(this.objectBuilder),
		)
	}

	public node(builder: ReadBuilder.BuilderFactory<never>) {
		const readBuilder = ReadBuilder.instantiateFromFactory(builder)
		return WriteBuilder.instantiate<AA, Exclude<AF, 'node'>, Op>(
			this.objectBuilder.object('node', readBuilder.objectBuilder),
		)
	}
}

namespace WriteBuilder {
	export type Builder<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation.Operation> = Omit<
		Omit<WriteBuilder<AA, AF, Op>, Exclude<WriteArguments, AA>>,
		Exclude<WriteFields, AF>
	>

	export type BuilderFactory<AA extends WriteArguments, AF extends WriteFields, Op extends WriteOperation.Operation> =
		| Builder<never, never, Op>
		| ((builder: Builder<AA, AF, Op>) => Builder<never, never, Op>)
}

export { WriteBuilder }
