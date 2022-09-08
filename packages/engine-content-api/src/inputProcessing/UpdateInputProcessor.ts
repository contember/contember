import { Input, Model } from '@contember/schema'

interface UpdateInputProcessor<Result = void> {
	column(context: UpdateInputProcessor.ContextWithInput<Model.ColumnContext, Input.ColumnValue | undefined>): Promise<Result>

	manyHasManyInverse: UpdateInputProcessor.HasManyRelationInputProcessor<Model.ManyHasManyInverseContext, Result>

	manyHasManyOwning: UpdateInputProcessor.HasManyRelationInputProcessor<Model.ManyHasManyOwningContext, Result>

	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Model.ManyHasOneContext, Result>

	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Model.OneHasManyContext, Result>

	oneHasOneInverse: UpdateInputProcessor.HasOneRelationInputProcessor<Model.OneHasOneInverseContext, Result>

	oneHasOneOwning: UpdateInputProcessor.HasOneRelationInputProcessor<Model.OneHasOneOwningContext, Result>
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
		connect(context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string }): Promise<Result>

		create(
			context: ContextWithInput<Context, Input.CreateDataInput> & { index: number; alias?: string },
		): Promise<Result>

		update(context: ContextWithInput<Context, UpdateManyInput> & { index: number; alias?: string }): Promise<Result>

		upsert(context: ContextWithInput<Context, UpsertManyInput> & { index: number; alias?: string }): Promise<Result>

		disconnect(
			context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string },
		): Promise<Result>

		delete(context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string }): Promise<Result>
	}
}

export { UpdateInputProcessor }
