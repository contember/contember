import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { CreateDataBuilder } from './CreateDataBuilder'
import { DataBuilder } from './DataBuilder'
import { ReadBuilder } from './ReadBuilder'
import { SupportedArguments } from './types'

class CreateBuilder<AllowedArgs extends SupportedArguments> extends ReadBuilder<AllowedArgs> {
	public static create<AllowedArgs extends SupportedArguments = SupportedArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): CreateBuilder.Builder<AllowedArgs> {
		return new CreateBuilder<AllowedArgs>(objectBuilder)
	}

	public static createFromFactory<AllowedArgs extends SupportedArguments>(
		builder: CreateBuilder.BuilderFactory<AllowedArgs>
	): CreateBuilder.Builder<never> {
		if (typeof builder === 'function') {
			return builder(CreateBuilder.create())
		}
		return builder
	}

	protected create<AA extends SupportedArguments = SupportedArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): CreateBuilder.Builder<AA> {
		return CreateBuilder.create<AA>(objectBuilder)
	}

	public data(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
		const resolvedData = DataBuilder.resolveData(data, CreateDataBuilder)

		return this.create<Exclude<AllowedArgs, 'data'>>(
			resolvedData === undefined ? this.objectBuilder : this.objectBuilder.argument('data', resolvedData)
		)
	}
}

namespace CreateBuilder {
	export type Builder<AllowedArgs extends SupportedArguments> = Omit<
		CreateBuilder<AllowedArgs>,
		Exclude<SupportedArguments, AllowedArgs>
	>
	export type BuilderFactory<AllowedArgs extends SupportedArguments> =
		| Builder<never>
		| ((builder: Builder<AllowedArgs>) => Builder<never>)
}

export { CreateBuilder }
