import { Input, OmitMethods } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { DataBuilder } from './DataBuilder'
import { ReadBuilder } from './ReadBuilder'
import { SupportedArguments } from './types'
import { UpdateDataBuilder } from './UpdateDataBuilder'

class UpdateBuilder<AllowedArgs extends SupportedArguments> extends ReadBuilder<AllowedArgs> {
	public static create<AllowedArgs extends SupportedArguments = SupportedArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): UpdateBuilder.Builder<AllowedArgs> {
		return new UpdateBuilder<AllowedArgs>(objectBuilder)
	}

	public static createFromFactory<AllowedArgs extends SupportedArguments>(
		builder: UpdateBuilder.BuilderFactory<AllowedArgs>
	): UpdateBuilder.Builder<never> {
		if (typeof builder === 'function') {
			return builder(UpdateBuilder.create())
		}
		return builder
	}

	protected create<AA extends SupportedArguments = SupportedArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): UpdateBuilder.Builder<AA> {
		return UpdateBuilder.create<AA>(objectBuilder)
	}

	public data(data: DataBuilder.DataLike<Input.UpdateDataInput<Literal>, UpdateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, UpdateDataBuilder)

		return this.create<Exclude<AllowedArgs, 'data'>>(
			resolvedData === undefined ? this.objectBuilder : this.objectBuilder.argument('data', resolvedData)
		)
	}
}

namespace UpdateBuilder {
	export type Builder<AllowedArgs extends SupportedArguments> = OmitMethods<
		UpdateBuilder<AllowedArgs>,
		Exclude<SupportedArguments, AllowedArgs>
	>
	export type BuilderFactory<AllowedArgs extends SupportedArguments> =
		| Builder<never>
		| ((builder: Builder<AllowedArgs>) => Builder<never>)
}

export { UpdateBuilder }
