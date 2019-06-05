import { Input } from 'cms-common'
import * as Context from './InputContext'

interface UpdateInputProcessor<Result = void> {
	column(context: Context.ColumnContext): Promise<Result>

	manyHasManyInversed: UpdateInputProcessor.HasManyRelationInputProcessor<Context.ManyHasManyInversedContext, Result>

	manyHasManyOwner: UpdateInputProcessor.HasManyRelationInputProcessor<Context.ManyHasManyOwnerContext, Result>

	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Context.ManyHasOneContext, Result>

	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Context.OneHasManyContext, Result>

	oneHasOneInversed: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneInversedContext, Result>

	oneHasOneOwner: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneOwnerContext, Result>
}

namespace UpdateInputProcessor {
	export type ContextWithInput<Context, Input> = Context & { input: Input }
	export type UpsertInput = { update: Input.UpdateDataInput; create: Input.CreateDataInput }
	export type UpdateManyInput = { where: Input.UniqueWhere; data: Input.UpdateDataInput }
	export type UpsertManyInput = {
		where: Input.UniqueWhere
		update: Input.UpdateDataInput
		create: Input.CreateDataInput
	}

	export interface HasOneRelationInputProcessor<Context, Result> {
		connect(context: ContextWithInput<Context, Input.UniqueWhere>): Promise<Result>

		create(context: ContextWithInput<Context, Input.CreateDataInput>): Promise<Result>

		update(context: ContextWithInput<Context, Input.UpdateDataInput>): Promise<Result>

		upsert(context: ContextWithInput<Context, UpsertInput>): Promise<Result>

		disconnect(context: ContextWithInput<Context, undefined>): Promise<Result>

		delete(context: ContextWithInput<Context, undefined>): Promise<Result>
	}

	export interface HasManyRelationInputProcessor<Context, Result> {
		connect(context: ContextWithInput<Context, Input.UniqueWhere>): Promise<Result>

		create(context: ContextWithInput<Context, Input.CreateDataInput>): Promise<Result>

		update(context: ContextWithInput<Context, UpdateManyInput>): Promise<Result>

		upsert(context: ContextWithInput<Context, UpsertManyInput>): Promise<Result>

		disconnect(context: ContextWithInput<Context, Input.UniqueWhere>): Promise<Result>

		delete(context: ContextWithInput<Context, Input.UniqueWhere>): Promise<Result>
	}
}

export default UpdateInputProcessor
