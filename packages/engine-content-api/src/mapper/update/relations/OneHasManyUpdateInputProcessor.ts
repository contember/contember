import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import { MutationAccess } from '../../MutationAccess.js'
import { MutationResultType } from '../../Result.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.OneHasManyContext

export class OneHasManyUpdateInputProcessor implements UpdateInputProcessor.HasManyRelationInputProcessor<Context, SqlUpdateInputProcessorResult> {
	constructor(
		private readonly mapper: MutationAccess,
	) {
	}

	public async connect(
		context: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		const { targetEntity, targetRelation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).update(targetEntity, input, {
				[targetRelation.name]: { connect: new CheckedPrimary(primary) },
			})
		}
	}

	public async create(
		context: Context & { input: MapperInput.CreateDataInput },
	) {
		const { targetEntity, targetRelation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: new CheckedPrimary(primary) },
			})
		}
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		const { targetRelation, targetEntity, input: { connect, create } } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const connectData = {
				[targetRelation.name]: {
					connect: new CheckedPrimary(primary),
				},
			}
			return await this.mapper.through(context).upsert(targetEntity, connect, connectData, {
				...create,
				...connectData,
			})
		}
	}

	public async update(
		context: Context & { input: UpdateInputProcessor.UpdateManyInput },
	) {
		const { entity, targetEntity, targetRelation, input: { data, where } } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: primary } },
				{
					...data,
					// [targetRelation.name]: {connect: thisPrimary}
				},
			)
		}
	}

	public async upsert(
		context: Context & { input: UpdateInputProcessor.UpsertManyInput },
	) {
		const { entity, targetEntity, targetRelation, input: { create, update, where } } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const targetAccess = this.mapper.through(context)
			const result = await targetAccess.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: primary } },
				{
					...update,
					// [targetRelation.name]: {connect: thisPrimary}
				},
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await targetAccess.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: new CheckedPrimary(primary) },
				})
			}
			return result
		}
	}

	public async disconnect(
		context: Context & { input: Input.UniqueWhere },
	) {
		const { entity, targetEntity, targetRelation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).update(
				targetEntity,
				{ ...input, [targetRelation.name]: { [entity.primary]: primary } },
				{ [targetRelation.name]: { disconnect: true } },
			)
		}
	}

	public async delete(
		context: Context & { input: Input.UniqueWhere },
	) {
		const { entity, targetEntity, targetRelation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).delete(targetEntity, {
				...input,
				[targetRelation.name]: { [entity.primary]: primary },
			})
		}
	}
}
