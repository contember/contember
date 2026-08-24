import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result.js'
import { Mapper } from '../../Mapper.js'
import { CreateInputProcessor } from '../../../inputProcessing/index.js'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'
import { AclScope } from '../../../acl/index.js'

type Context = Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext

export class ManyHasManyCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {
	constructor(
		private readonly mapper: Mapper,
		/** Scope of the entity being written, the one that declares this relation; the other side of the junction stays nested. */
		private readonly scope: AclScope,
	) {
	}

	public async connect(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere | CheckedPrimary },
	): Promise<SqlCreateInputProcessorResult> {
		return async ({ primary }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, input)
			if (err) return [err]
			return await this.mapper.connectJunction(entity, relation, primary, otherPrimary, this.scope)
		}
	}

	public async create(
		{ entity, targetEntity, relation, input }: Context & { input: MapperInput.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const insertResult = await this.mapper.insert(targetEntity, input, 'nested')
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, primary, insertPrimary, this.scope)),
			]
		}
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			let [otherPrimary] = await this.mapper.getPrimaryValue(context.targetEntity, context.input.connect)
			if (!otherPrimary) {
				const insertResult = await this.mapper.insert(context.targetEntity, context.input.create, 'nested')
				otherPrimary = getInsertPrimary(insertResult)
				if (!otherPrimary) {
					return insertResult
				}
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary, this.scope)
		}
	}
}
