import { Input, Model } from '@contember/schema'
import { CheckedPrimary } from '../mapper/CheckedPrimary'
import { MapperInput } from '../mapper'

interface CreateInputProcessor<Result = void> {
	column(context: Model.ColumnContext & { input: Input.ColumnValue | undefined }): Promise<Result>

	manyHasManyInverse: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyInverseContext, Result>
	manyHasManyOwning: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyOwningContext, Result>

	oneHasOneInverse: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneInverseContext, Result>
	oneHasOneOwning: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneOwningContext, Result>

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Model.OneHasManyContext, Result>
	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Model.ManyHasOneContext, Result>
}

namespace CreateInputProcessor {

	export interface HasOneRelationProcessor<Context, Result> {
		nothing?: (context: Context & { input: undefined }) => Promise<Result>
		connect: (context: Context & { input: Input.UniqueWhere | CheckedPrimary }) => Promise<Result>
		create: (context: Context & { input: MapperInput.CreateDataInput }) => Promise<Result>
		connectOrCreate: (context: Context & { input: MapperInput.ConnectOrCreateInput }) => Promise<Result>
	}

	export interface HasManyRelationProcessor<Context, Result> {
		connect: (context: Context & { input: Input.UniqueWhere | CheckedPrimary } & { index: number; alias?: string }) => Promise<Result>
		create: (context: Context & { input: MapperInput.CreateDataInput } & { index: number; alias?: string }) => Promise<Result>
		connectOrCreate: (context: Context & { input: MapperInput.ConnectOrCreateInput } & { index: number; alias?: string }) => Promise<Result>
	}
}

export { type CreateInputProcessor }
