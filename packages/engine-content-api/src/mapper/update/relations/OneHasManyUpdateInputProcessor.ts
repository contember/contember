import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper.js'
import { MutationResultType } from '../../Result.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.OneHasManyContext

export class OneHasManyUpdateInputProcessor implements UpdateInputProcessor.HasManyRelationInputProcessor<Context, SqlUpdateInputProcessorResult> {
	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, targetEntity, targetRelation, input }: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.update(targetEntity, input, {
				[targetRelation.name]: { connect: new CheckedPrimary(primary) },
			}, 'nested')
		}
	}

	public async create(
		{ entity, targetEntity, targetRelation, input }: Context & { input: MapperInput.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: new CheckedPrimary(primary) },
			}, 'nested')
		}
	}

	public async connectOrCreate(
		{ entity, targetRelation, targetEntity, input: { connect, create } }: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const connectData = {
				[targetRelation.name]: {
					connect: new CheckedPrimary(primary),
				},
			}
			return await this.mapper.upsert(targetEntity, connect, connectData, {
				...create,
				...connectData,
			}, 'nested')
		}
	}

	public async update(
		{ entity, targetEntity, targetRelation, input: { data, where } }: Context & { input: UpdateInputProcessor.UpdateManyInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: primary } },
				{
					...data,
					// [targetRelation.name]: {connect: thisPrimary}
				},
				'nested',
			)
		}
	}

	public async upsert(
		{ entity, targetEntity, targetRelation, input: { create, update, where } }: Context & { input: UpdateInputProcessor.UpsertManyInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const result = await this.mapper.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: primary } },
				{
					...update,
					// [targetRelation.name]: {connect: thisPrimary}
				},
				'nested',
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await this.mapper.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: new CheckedPrimary(primary) },
				}, 'nested')
			}
			return result
		}
	}

	public async disconnect(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.update(
				targetEntity,
				{ ...input, [targetRelation.name]: { [entity.primary]: primary } },
				{ [targetRelation.name]: { disconnect: true } },
				'nested',
			)
		}
	}

	public async delete(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.delete(targetEntity, {
				...input,
				[targetRelation.name]: { [entity.primary]: primary },
			}, 'nested')
		}
	}
}
