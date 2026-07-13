import { MutationAccess } from '../../MutationAccess.js'
import { ConstraintType, MutationConstraintViolationError, MutationEntryNotFoundError, MutationResultList } from '../../Result.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { Input, Model } from '@contember/schema'
import { CreateInputProcessor } from '../../../inputProcessing/index.js'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor.js'
import { MapperInput } from '../../types.js'

type Context = Model.OneHasOneInverseContext

export class OneHasOneInverseCreateInputProcessor implements CreateInputProcessor.HasOneRelationProcessor<Context, SqlCreateInputProcessorResult> {
	constructor(
		private readonly mapper: MutationAccess,
	) {
	}

	public async connect(context: Context & { input: Input.UniqueWhere | CheckedPrimary }) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const { targetEntity, input } = context
			const [owner, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
			if (err) return [err]

			return await this.connectInternal({ ...context, input: new CheckedPrimary(owner) }, primary)
		}
	}

	public async create(
		context: Context & { input: MapperInput.CreateDataInput },
	) {
		const { input, targetRelation, targetEntity } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).insert(targetEntity, input, builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, primary)
			})
		}
	}

	public async connectOrCreate(
		{ input, ...context }: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [owner] = await this.mapper.through(context).getPrimaryValue(context.targetEntity, input.connect)
			if (owner) {
				return await this.connectInternal({ ...context, input: new CheckedPrimary(owner) }, primary)
			}

			return await this.createInternal({ input: input.create, ...context }, primary)
		}
	}

	private async connectInternal(
		context: Context & { input: CheckedPrimary },
		primary: Input.PrimaryValue,
	) {
		const { entity, targetEntity, targetRelation, relation, input } = context
		const targetAccess = this.mapper.through(context)
		const currentInverseSideOfOwner = await targetAccess.selectField(targetEntity, input, targetRelation.name)
		const orphanResult: MutationResultList = []
		if (currentInverseSideOfOwner) {
			if (targetRelation.orphanRemoval) {
				const orphanUnique = { [entity.primary]: currentInverseSideOfOwner }
				const orphanDelete = await this.mapper.delete(entity, orphanUnique)
				orphanResult.push(...orphanDelete)
			} else if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
		}

		const connectResult = await targetAccess.updateInternal(targetEntity, input, update => {
			update.addPredicates([targetRelation.name])
			update.addFieldValue(targetRelation.name, primary)
		})

		return [
			...connectResult,
			...orphanResult,
		]
	}

	private async createInternal(
		context: Context & { input: MapperInput.CreateDataInput },
		primary: Input.PrimaryValue,
	) {
		return await this.mapper.through(context).insert(context.targetEntity, context.input, builder => {
			builder.addPredicates([context.targetRelation.name])
			builder.addFieldValue(context.targetRelation.name, primary)
		})
	}
}
