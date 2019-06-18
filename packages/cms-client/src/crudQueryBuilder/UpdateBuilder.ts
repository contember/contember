import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { DataBuilder } from './DataBuilder'
import { ReadBuilder } from './ReadBuilder'
import { UpdateMutationArguments, UpdateMutationFields } from './types'
import { UpdateDataBuilder } from './UpdateDataBuilder'
import { ValidationRelationBuilder } from './ValidationRelationBuilder'

class UpdateBuilder<AllowedArgs extends UpdateMutationArguments, AllowedFields extends UpdateMutationFields> {
	protected constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	public static create<AllowedArgs extends UpdateMutationArguments, AllowedFields extends UpdateMutationFields>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): UpdateBuilder.Builder<AllowedArgs, AllowedFields> {
		return new UpdateBuilder<AllowedArgs, AllowedFields>(objectBuilder)
	}

	public static createFromFactory<
		AllowedArgs extends UpdateMutationArguments,
		AllowedFields extends UpdateMutationFields
	>(builder: UpdateBuilder.BuilderFactory<AllowedArgs, AllowedFields>): UpdateBuilder.Builder<never, never> {
		if (typeof builder === 'function') {
			return builder(UpdateBuilder.create())
		}
		return builder
	}

	protected create<AA extends UpdateMutationArguments = AllowedArgs, AF extends UpdateMutationFields = AllowedFields>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): UpdateBuilder.Builder<AA, AF> {
		return UpdateBuilder.create<AA, AF>(objectBuilder)
	}

	public data(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)

		return this.create<Exclude<AllowedArgs, 'data'>>(
			resolvedData === undefined ? this.objectBuilder : this.objectBuilder.argument('data', resolvedData)
		)
	}

	public by(by: Input.UniqueWhere<Literal>) {
		return this.create<Exclude<AllowedArgs, 'by'>>(this.objectBuilder.argument('by', by))
	}

	public ok() {
		return this.create<AllowedArgs, Exclude<AllowedFields, 'ok'>>(this.objectBuilder.field('ok'))
	}

	public validation() {
		return this.create<AllowedArgs, Exclude<AllowedFields, 'validation'>>(
			ValidationRelationBuilder.validationRelation(this.objectBuilder)
		)
	}

	public node(builder: ReadBuilder.BuilderFactory<never>) {
		const readBuilder = ReadBuilder.createFromFactory(builder)
		return this.create<AllowedArgs, Exclude<AllowedFields, 'node'>>(
			this.objectBuilder.object('node', readBuilder.objectBuilder)
		)
	}
}

namespace UpdateBuilder {
	export type Builder<AllowedArgs extends UpdateMutationArguments, AllowedFields extends UpdateMutationFields> = Omit<
		Omit<UpdateBuilder<AllowedArgs, AllowedFields>, Exclude<UpdateMutationArguments, AllowedArgs>>,
		Exclude<UpdateMutationFields, AllowedFields>
	>
	export type BuilderFactory<AllowedArgs extends UpdateMutationArguments, AllowedFields extends UpdateMutationFields> =
		| Builder<never, never>
		| ((builder: Builder<AllowedArgs, AllowedFields>) => Builder<never, never>)
}

export { UpdateBuilder }
