import { UpdateInputProcessor } from '../../../inputProcessing'
import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { MutationResultType } from '../../Result'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor'

type Context = Model.OneHasManyContext

export class OneHasManyUpdateInputProcessor implements UpdateInputProcessor.HasManyRelationInputProcessor<Context, SqlUpdateInputProcessorResult>{
	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, targetEntity, targetRelation, input }: Context & { input: Input.UniqueWhere },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.update(targetEntity, input, {
				[targetRelation.name]: { connect: { [entity.primary]: primary } },
			})
		}
	}

	public async create(
		{ entity, targetEntity, targetRelation, input }: Context & { input: Input.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: { [entity.primary]: primary } },
			})
		}
	}

	public async connectOrCreate(
		{ entity, targetRelation, targetEntity, input: { connect, create } }: Context & { input: Input.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const connectData = {
				[targetRelation.name]: {
					connect: { [entity.primary]: primary },
				},
			}
			return await this.mapper.upsert(targetEntity, connect, connectData, {
				...create,
				...connectData,
			})
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
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await this.mapper.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: { [entity.primary]: primary } },
				})
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
			})
		}
	}
}
