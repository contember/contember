import { Input, Model } from '@contember/schema'

interface CreateInputProcessor<Result = void> {
	column(context: CreateInputProcessor.ContextWithInput<Model.ColumnContext, Input.ColumnValue | undefined>): Promise<Result>

	manyHasManyInverse: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyInverseContext, Result>
	manyHasManyOwning: CreateInputProcessor.HasManyRelationProcessor<Model.ManyHasManyOwningContext, Result>

	oneHasOneInverse: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneInverseContext, Result>
	oneHasOneOwning: CreateInputProcessor.HasOneRelationProcessor<Model.OneHasOneOwningContext, Result>

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Model.OneHasManyContext, Result>
	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Model.ManyHasOneContext, Result>
}

namespace CreateInputProcessor {
	export type ContextWithInput<Context, Input> = Context & { input: Input }

	export interface HasOneRelationProcessor<Context, Result> {
		nothing?: (context: ContextWithInput<Context, undefined>) => Promise<Result>
		connect: (context: ContextWithInput<Context, Input.UniqueWhere>) => Promise<Result>
		create: (context: ContextWithInput<Context, Input.CreateDataInput>) => Promise<Result>
	}

	export interface HasManyRelationProcessor<Context, Result> {
		connect: (
			context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string },
		) => Promise<Result>
		create: (
			context: ContextWithInput<Context, Input.CreateDataInput> & { index: number; alias?: string },
		) => Promise<Result>
	}
}

export { CreateInputProcessor }
