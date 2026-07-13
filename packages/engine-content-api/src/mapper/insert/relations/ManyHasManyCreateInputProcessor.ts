import { Acl, Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result.js'
import { MutationAccess } from '../../MutationAccess.js'
import { CreateInputProcessor } from '../../../inputProcessing/index.js'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext

export class ManyHasManyCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {
	constructor(
		private readonly mapper: MutationAccess,
	) {
	}

	public async connect(
		context: Context & { input: Input.UniqueWhere | CheckedPrimary },
	): Promise<SqlCreateInputProcessorResult> {
		const { entity, targetEntity, relation, input } = context
		return async ({ primary }) => {
			const [otherPrimary, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
			if (err) return [err]
			return await this.mapper.connectJunction(entity, relation, primary, otherPrimary, {
				source: Acl.Operation.create,
				target: Acl.Operation.update,
			})
		}
	}

	public async create(
		context: Context & { input: MapperInput.CreateDataInput },
	) {
		const { entity, targetEntity, relation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const insertResult = await this.mapper.through(context).insert(targetEntity, input)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, primary, insertPrimary, {
					source: Acl.Operation.create,
					target: Acl.Operation.create,
				})),
			]
		}
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const targetAccess = this.mapper.through(context)
			let [otherPrimary] = await targetAccess.getPrimaryValue(context.targetEntity, context.input.connect)
			let targetOperation = Acl.Operation.update
			if (!otherPrimary) {
				const insertResult = await targetAccess.insert(context.targetEntity, context.input.create)
				otherPrimary = getInsertPrimary(insertResult)
				if (!otherPrimary) {
					return insertResult
				}
				targetOperation = Acl.Operation.create
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary, {
				source: Acl.Operation.create,
				target: targetOperation,
			})
		}
	}
}
