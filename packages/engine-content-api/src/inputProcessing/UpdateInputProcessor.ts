import { Input } from '@contember/schema'
import * as Context from './InputContext'
import { ContextWithInput } from './InputContext'

interface UpdateInputProcessor<Result = void> {
	column(context: Context.ColumnContext): Promise<Result>

	manyHasManyInverse: UpdateInputProcessor.HasManyRelationInputProcessor<Context.ManyHasManyInverseContext, Result>

	manyHasManyOwning: UpdateInputProcessor.HasManyRelationInputProcessor<Context.ManyHasManyOwningContext, Result>

	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Context.ManyHasOneContext, Result>

	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Context.OneHasManyContext, Result>

	oneHasOneInverse: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneInverseContext, Result>

	oneHasOneOwning: UpdateInputProcessor.HasOneRelationInputProcessor<Context.OneHasOneOwningContext, Result>
}

namespace UpdateInputProcessor {
	export type UpsertInput = { update: Input.UpdateDataInput; create: Input.CreateDataInput }
	export type UpdateManyInput = { where: Input.UniqueWhere; data: Input.UpdateDataInput }
	export type UpsertManyInput = {
		where: Input.UniqueWhere
		update: Input.UpdateDataInput
		create: Input.CreateDataInput
	}
	export type ConnectOrCreateInput = {
		connect: Input.UniqueWhere
		create: Input.CreateDataInput
	}

	export interface HasOneRelationInputProcessor<Context, Result> {
		connect(context: ContextWithInput<Context, Input.UniqueWhere>): Promise<Result>

		create(context: ContextWithInput<Context, Input.CreateDataInput>): Promise<Result>

		connectOrCreate(context: ContextWithInput<Context, ConnectOrCreateInput>): Promise<Result>

		update(context: ContextWithInput<Context, Input.UpdateDataInput>): Promise<Result>

		upsert(context: ContextWithInput<Context, UpsertInput>): Promise<Result>

		disconnect(context: ContextWithInput<Context, undefined>): Promise<Result>

		delete(context: ContextWithInput<Context, undefined>): Promise<Result>
	}

	export interface HasManyRelationInputProcessor<Context, Result> {
		connect(context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string }): Promise<Result>

		create(context: ContextWithInput<Context, Input.CreateDataInput> & { index: number; alias?: string }): Promise<Result>

		connectOrCreate(context: ContextWithInput<Context, ConnectOrCreateInput> & { index: number; alias?: string }): Promise<Result>

		update(context: ContextWithInput<Context, UpdateManyInput> & { index: number; alias?: string }): Promise<Result>

		upsert(context: ContextWithInput<Context, UpsertManyInput> & { index: number; alias?: string }): Promise<Result>

		disconnect(context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string }): Promise<Result>

		delete(context: ContextWithInput<Context, Input.UniqueWhere> & { index: number; alias?: string }): Promise<Result>
	}
}

export { UpdateInputProcessor }
