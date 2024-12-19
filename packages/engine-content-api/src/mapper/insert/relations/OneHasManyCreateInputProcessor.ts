import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'
import { CheckedPrimary } from '../../CheckedPrimary'
import { MapperInput } from '../../types'

type Context = Model.OneHasManyContext

export class OneHasManyCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {

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
			})
		}
	}

	public async create(
		{ entity, targetEntity, targetRelation, input }: Context & { input: MapperInput.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: new CheckedPrimary(primary) },
			})
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
			})
		}
	}
}
