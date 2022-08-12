import { Input } from '@contember/schema'
import * as Context from './InputContext'
import { ContextWithInput } from './InputContext'

interface CreateInputProcessor<Result = void> {
	column(context: Context.ColumnContext): Promise<Result>

	manyHasManyInverse: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyInverseContext, Result>
	manyHasManyOwning: CreateInputProcessor.HasManyRelationProcessor<Context.ManyHasManyOwningContext, Result>

	oneHasOneInverse: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneInverseContext, Result>
	oneHasOneOwning: CreateInputProcessor.HasOneRelationProcessor<Context.OneHasOneOwningContext, Result>

	oneHasMany: CreateInputProcessor.HasManyRelationProcessor<Context.OneHasManyContext, Result>
	manyHasOne: CreateInputProcessor.HasOneRelationProcessor<Context.ManyHasOneContext, Result>
}

namespace CreateInputProcessor {
	export type ConnectOrCreateInput = {
		connect: Input.UniqueWhere
		create: Input.CreateDataInput
	}

	export interface HasOneRelationProcessor<Context, Result> {
		nothing?: (context: ContextWithInput<Context, undefined>) => Promise<Result>
		connect: (context: ContextWithInput<Context, Input.UniqueWhere>) => Promise<Result>
		create: (context: ContextWithInput<Context, Input.CreateDataInput>) => Promise<Result>
		connectOrCreate: (context: ContextWithInput<Context, ConnectOrCreateInput>) => Promise<Result>
	}

	export interface HasManyRelationProcessor<Context, Result> {
		connect: (context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string }) => Promise<Result>
		create: (context: ContextWithInput<Context, Input.CreateDataInput> & { index: number; alias?: string }) => Promise<Result>
		connectOrCreate: (context: ContextWithInput<Context, ConnectOrCreateInput> & { index: number; alias?: string }) => Promise<Result>
	}
}

export { CreateInputProcessor }
