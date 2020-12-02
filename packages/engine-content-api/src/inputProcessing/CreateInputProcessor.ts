import { Input } from '@contember/schema'
import * as Context from './InputContext'

interface CreateInputProcessor<Result = void> {
	column(context: Context.ColumnContext): Promise<Result>

	manyHasManyInverse: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyInverseContext, Result>
	manyHasManyOwner: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyOwnerContext, Result>

	oneHasOneInverse: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneInverseContext, Result>
	oneHasOneOwner: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneOwnerContext, Result>

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Context.OneHasManyContext, Result>
	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Context.ManyHasOneContext, Result>
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
