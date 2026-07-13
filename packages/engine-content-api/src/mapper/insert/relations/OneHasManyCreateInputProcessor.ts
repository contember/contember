import { Input, Model } from '@contember/schema'
import { MutationAccess } from '../../MutationAccess.js'
import { CreateInputProcessor } from '../../../inputProcessing/index.js'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.OneHasManyContext

export class OneHasManyCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {
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
}
