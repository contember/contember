import { Mapper } from '../../Mapper'
import { ConstraintType, MutationConstraintViolationError, MutationEntryNotFoundError, MutationResultList } from '../../Result'
import { CheckedPrimary } from '../../CheckedPrimary'
import { Input, Model } from '@contember/schema'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'

type Context = Model.OneHasOneInverseContext

export class OneHasOneInverseCreateInputProcessor implements CreateInputProcessor.HasOneRelationProcessor<Context, SqlCreateInputProcessorResult>  {

	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(context: Context & { input: Input.UniqueWhere }) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const { targetEntity, input } = context
			const owner = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!owner) {
				return [new MutationEntryNotFoundError([], input)]
			}

			return await this.connectInternal({ ...context, input: new CheckedPrimary(owner) }, primary)
		}
	}


	public async create(
		{ input, targetRelation, targetEntity }: Context & { input: Input.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.insert(targetEntity, input, builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, primary)
			})
		}
	}

	public async connectOrCreate(
		{ input, ...context }: Context & { input: Input.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const owner = await this.mapper.getPrimaryValue(context.targetEntity, input.connect)
			if (owner) {
				return await this.connectInternal({ ...context, input: new CheckedPrimary(owner) }, primary)
			}

			return await this.createInternal({ input: input.create, ...context }, primary)
		}
	}

	private async connectInternal(
		{ entity, targetEntity, targetRelation, relation, input }: Context & { input: CheckedPrimary },
		primary: Input.PrimaryValue,
	) {

		const currentInverseSideOfOwner = await this.mapper.selectField(targetEntity, input, targetRelation.name)
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

		const connectResult = await this.mapper.updateInternal(targetEntity, input, update => {
			update.addPredicates([targetRelation.name])
			update.addFieldValue(targetRelation.name, primary)
		})

		return [
			...connectResult,
			...orphanResult,
		]
	}

	private async createInternal(
		context: Context & { input: Input.CreateDataInput },
		primary: Input.PrimaryValue,
	) {
		return await this.mapper.insert(context.targetEntity, context.input, builder => {
			builder.addPredicates([context.targetRelation.name])
			builder.addFieldValue(context.targetRelation.name, primary)
		})
	}
}
