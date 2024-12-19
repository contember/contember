import { Input, Model } from '@contember/schema'
import { CheckedPrimary } from '../mapper/CheckedPrimary'
import { MapperInput } from '../mapper'


interface UpdateInputProcessor<Result = void> {
	column(context: Model.ColumnContext & { input: Input.ColumnValue | undefined }): Promise<Result>

	manyHasManyInverse: UpdateInputProcessor.HasManyRelationInputProcessor<Model.ManyHasManyInverseContext, Result>

	manyHasManyOwning: UpdateInputProcessor.HasManyRelationInputProcessor<Model.ManyHasManyOwningContext, Result>

	manyHasOne: UpdateInputProcessor.HasOneRelationInputProcessor<Model.ManyHasOneContext, Result>

	oneHasMany: UpdateInputProcessor.HasManyRelationInputProcessor<Model.OneHasManyContext, Result>

	oneHasOneInverse: UpdateInputProcessor.HasOneRelationInputProcessor<Model.OneHasOneInverseContext, Result>

	oneHasOneOwning: UpdateInputProcessor.HasOneRelationInputProcessor<Model.OneHasOneOwningContext, Result>
}

namespace UpdateInputProcessor {
	export type UpsertInput = { update: MapperInput.UpdateDataInput; create: MapperInput.CreateDataInput }
	export type UpdateManyInput = { where: Input.UniqueWhere; data: MapperInput.UpdateDataInput }
	export type UpsertManyInput = {
		where: Input.UniqueWhere
		update: MapperInput.UpdateDataInput
		create: MapperInput.CreateDataInput
	}

	export interface HasOneRelationInputProcessor<Context, Result> {
		connect(context: Context & { input: Input.UniqueWhere | CheckedPrimary }): Promise<Result>

		create(context: Context & { input: MapperInput.CreateDataInput }): Promise<Result>

		connectOrCreate(context: Context & { input: MapperInput.ConnectOrCreateInput }): Promise<Result>

		update(context: Context & { input: MapperInput.UpdateDataInput }): Promise<Result>

		upsert(context: Context & { input: UpdateInputProcessor.UpsertInput }): Promise<Result>

		disconnect(context: Context & { input: undefined }): Promise<Result>

		delete(context: Context & { input: undefined }): Promise<Result>
	}

	export interface HasManyRelationInputProcessor<Context, Result> {
		connect(context: Context & { input: Input.UniqueWhere | CheckedPrimary; index: number; alias?: string }): Promise<Result>

		create(context: Context & { input: MapperInput.CreateDataInput; index: number; alias?: string }): Promise<Result>

		connectOrCreate(context: Context & { input: MapperInput.ConnectOrCreateInput; index: number; alias?: string }): Promise<Result>

		update(context: Context & { input: UpdateInputProcessor.UpdateManyInput; index: number; alias?: string }): Promise<Result>

		upsert(context: Context & { input: UpdateInputProcessor.UpsertManyInput; index: number; alias?: string }): Promise<Result>

		disconnect(context: Context & { input: Input.UniqueWhere; index: number; alias?: string }): Promise<Result>

		delete(context: Context & { input: Input.UniqueWhere; index: number; alias?: string }): Promise<Result>
	}
}

export { type UpdateInputProcessor }
