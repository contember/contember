import {
	ConstraintType,
	MutationConstraintViolationError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from '../../Result.js'
import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import { MutationAccess } from '../../MutationAccess.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.OneHasOneInverseContext

export class OneHasOneInverseUpdateInputProcessor
	implements UpdateInputProcessor.HasOneRelationInputProcessor<Context, SqlUpdateInputProcessorResult>
{
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly mapper: MutationAccess,
	) {
	}

	public async connect({ input, ...ctx }: Model.OneHasOneInverseContext & { input: Input.UniqueWhere | CheckedPrimary }) {
		return async () => {
			const [newOwner, err] = await this.mapper.through(ctx).getPrimaryValue(ctx.targetEntity, input)
			if (err) return [err]
			return await this.connectInternal(ctx, newOwner)
		}
	}

	public async connectOrCreate(
		{ input, ...ctx }: Model.OneHasOneInverseContext & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async () => {
			const [newOwner] = await this.mapper.through(ctx).getPrimaryValue(ctx.targetEntity, input.connect)
			if (newOwner) {
				return await this.connectInternal(ctx, newOwner)
			}
			return await this.createInternal({ ...ctx, input: input.create })
		}
	}

	public async create(ctx: Model.OneHasOneInverseContext & { input: MapperInput.CreateDataInput }) {
		return async () => {
			return await this.createInternal(ctx)
		}
	}

	public async update(context: Model.OneHasOneInverseContext & { input: MapperInput.UpdateDataInput }) {
		const { entity, targetEntity, targetRelation, input } = context
		return async () => {
			return await this.mapper.through(context).update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				input,
			)
		}
	}

	public async upsert(context: Model.OneHasOneInverseContext & { input: UpdateInputProcessor.UpsertInput }) {
		return async () => {
			const { targetEntity, targetRelation, entity, input: { update, create } } = context
			const result = await this.mapper.through(context).update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				update,
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await this.createInternal({
					...context,
					input: create,
				})
			}
			return result
		}
	}

	public async disconnect(context: Model.OneHasOneInverseContext & { input: undefined }) {
		const { entity, targetEntity, relation, targetRelation } = context
		return async () => {
			if (!relation.nullable && !targetRelation.orphanRemoval) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			const targetAccess = this.mapper.through(context)
			const [currentOwner] = await targetAccess.getPrimaryValue(targetEntity, {
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
			if (!currentOwner) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			if (currentOwner && !targetRelation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}

			const result = await targetAccess.updateInternal(
				targetEntity,
				new CheckedPrimary(currentOwner),
				builder => {
					builder.addPredicates([targetRelation.name])
					builder.addFieldValue(targetRelation.name, null)
				},
			)
			if (targetRelation.orphanRemoval) {
				result.push(...(await this.mapper.delete(entity, { [entity.primary]: this.primaryValue })))
			}
			return result
		}
	}

	public async delete(context: Model.OneHasOneInverseContext & { input: undefined }) {
		const { entity, targetEntity, relation, targetRelation } = context
		return async () => {
			if (!relation.nullable && !targetRelation.orphanRemoval) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			// orphan removal is handled in mapper.delete
			return await this.mapper.through(context).delete(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } })
		}
	}

	private async connectInternal(
		context: Model.OneHasOneInverseContext,
		newOwner: Input.PrimaryValue,
	) {
		const { entity, targetEntity, targetRelation } = context
		const targetAccess = this.mapper.through(context)
		const [currentOwner] = await targetAccess.getPrimaryValue(targetEntity, {
			[targetRelation.name]: { [entity.primary]: this.primaryValue },
		})
		if (newOwner === currentOwner) {
			return [new MutationNothingToDo([], NothingToDoReason.alreadyExists)]
		}
		const result: MutationResultList = []
		if (currentOwner) {
			if (!targetRelation.nullable) {
				// todo cascade delete support?
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			const disconnectFromCurrentOwner = await targetAccess.updateInternal(targetEntity, new CheckedPrimary(currentOwner), builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, null)
			})
			result.push(...disconnectFromCurrentOwner)
		}
		const orphanedInverseSide = targetRelation.orphanRemoval
			? await targetAccess.selectField(targetEntity, { [targetEntity.primary]: newOwner }, targetRelation.name)
			: null

		const connectToNewOwner = await targetAccess.updateInternal(targetEntity, new CheckedPrimary(newOwner), builder => {
			builder.addPredicates([targetRelation.name])
			builder.addFieldValue(targetRelation.name, this.primaryValue)
		})
		result.push(...connectToNewOwner)

		if (orphanedInverseSide) {
			const deleteOrphanedInverseSide = await this.mapper.delete(entity, { [entity.primary]: orphanedInverseSide })
			result.push(...deleteOrphanedInverseSide)
		}
		return result
	}

	private async createInternal(
		context: Model.OneHasOneInverseContext & { input: MapperInput.CreateDataInput },
	) {
		const { entity, targetEntity, targetRelation, input } = context
		const targetAccess = this.mapper.through(context)
		const [currentOwner] = await targetAccess.getPrimaryValue(targetEntity, {
			[targetRelation.name]: { [entity.primary]: this.primaryValue },
		})
		if (currentOwner && !targetRelation.nullable) {
			// todo cascade delete support?
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		const result: MutationResultList = []
		if (currentOwner) {
			const disconnectFromCurrentOwner = await targetAccess.updateInternal(targetEntity, new CheckedPrimary(currentOwner), builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, null)
			})
			result.push(...disconnectFromCurrentOwner)
		}

		const connectToNewlyCreatedOwner = await targetAccess.insert(targetEntity, input, builder => {
			builder.addFieldValue(targetRelation.name, this.primaryValue)
			builder.addPredicates([targetRelation.name])
		})
		result.push(...connectToNewlyCreatedOwner)

		return result
	}
}
