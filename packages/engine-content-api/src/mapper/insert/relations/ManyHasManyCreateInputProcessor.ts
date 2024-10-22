import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result'
import { Mapper } from '../../Mapper'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'

type Context = Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext

export class ManyHasManyCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {

	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere },
	): Promise<SqlCreateInputProcessorResult> {
		return async ({ primary }) => {
			const otherPrimary = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!otherPrimary) {
				return [new MutationEntryNotFoundError([], input)]
			}
			return await this.mapper.connectJunction(entity, relation, primary, otherPrimary)
		}
	}

	public async create(
		{ entity, targetEntity, relation, input }: Context & { input: Input.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const insertResult = await this.mapper.insert(targetEntity, input)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, primary, insertPrimary)),
			]
		}
	}

	public async connectOrCreate(
		context: Context & { input: Input.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			let otherPrimary = await this.mapper.getPrimaryValue(context.targetEntity, context.input.connect)
			if (!otherPrimary) {
				const insertResult = await this.mapper.insert(context.targetEntity, context.input.create)
				otherPrimary = getInsertPrimary(insertResult)
				if (!otherPrimary) {
					return insertResult
				}
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary)
		}
	}
}
