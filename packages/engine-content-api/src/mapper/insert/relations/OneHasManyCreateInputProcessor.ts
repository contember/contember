import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'

type Context = Model.OneHasManyContext

export class OneHasManyCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {

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
}
