import { Input } from 'cms-common'
import * as Context from './InputContext'

interface CreateInputProcessor<Result = void> {
	column(context: Context.ColumnContext): Promise<Result>

	manyHasManyInversed: CreateInputProcessor.RelationProcessor<Result, Context.ManyHasManyInversedContext>
	manyHasManyOwner: CreateInputProcessor.RelationProcessor<Result, Context.ManyHasManyOwnerContext>

	oneHasOneInversed: CreateInputProcessor.RelationProcessor<Result, Context.OneHasOneInversedContext>
	oneHasOneOwner: CreateInputProcessor.RelationProcessor<Result, Context.OneHasOneOwnerContext>

	oneHasMany: CreateInputProcessor.RelationProcessor<Result, Context.OneHasManyContext>
	manyHasOne: CreateInputProcessor.RelationProcessor<Result, Context.ManyHasOneContext>
}

namespace CreateInputProcessor {
	export type ContextWithInput<Context, Input> = Context & { input: Input }

	export interface RelationProcessor<Result, Context> {
		connect: (context: ContextWithInput<Context, Input.UniqueWhere>) => Promise<Result>
		create: (context: ContextWithInput<Context, Input.CreateDataInput>) => Promise<Result>
	}
}

export default CreateInputProcessor
