import { Input, Model } from '@contember/schema'

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
		connect: (context: Context & { input: Input.UniqueWhere }) => Promise<Result>
		create: (context: Context & { input: Input.CreateDataInput }) => Promise<Result>
		connectOrCreate: (context: Context & { input: Input.ConnectOrCreateInput }) => Promise<Result>
	}

	export interface HasManyRelationProcessor<Context, Result> {
		connect: (context: Context & { input: Input.UniqueWhere } & { index: number; alias?: string }) => Promise<Result>
		create: (context: Context & { input: Input.CreateDataInput } & { index: number; alias?: string }) => Promise<Result>
		connectOrCreate: (context: Context & { input: Input.ConnectOrCreateInput } & { index: number; alias?: string }) => Promise<Result>
	}
}

export { CreateInputProcessor }
