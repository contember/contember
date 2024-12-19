import {
	ConstraintType,
	MutationConstraintViolationError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from '../../Result'
import { UpdateInputProcessor } from '../../../inputProcessing'
import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor'
import { CheckedPrimary } from '../../CheckedPrimary'
import { MapperInput } from '../../types'

type Context = Model.OneHasOneInverseContext

export class OneHasOneInverseUpdateInputProcessor implements UpdateInputProcessor.HasOneRelationInputProcessor<Context, SqlUpdateInputProcessorResult>{
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly mapper: Mapper,
	) {
	}

	public async connect({ input, ...ctx  }: Model.OneHasOneInverseContext & { input: Input.UniqueWhere | CheckedPrimary }) {
		return async () => {
			const [newOwner, err] = await this.mapper.getPrimaryValue(ctx.targetEntity, input)
			if (err) return [err]
			return await this.connectInternal(ctx, newOwner)
		}
	}

	public async connectOrCreate(
		{ input, ...ctx }: Model.OneHasOneInverseContext & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async () => {
			const [newOwner] = await this.mapper.getPrimaryValue(ctx.targetEntity, input.connect)
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

	public async update({ entity, targetEntity, targetRelation, input }: Model.OneHasOneInverseContext & { input: MapperInput.UpdateDataInput }) {
		return async () => {
			return await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				input,
			)
		}
	}

	public async upsert(context: Model.OneHasOneInverseContext & { input: UpdateInputProcessor.UpsertInput }) {
		return async () => {
			const { targetEntity, targetRelation, entity, input: { update, create } } = context
			const result = await this.mapper.update(
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

	public async disconnect({ entity, targetEntity, relation, targetRelation }: Model.OneHasOneInverseContext & { input: undefined }) {
		return async () => {
			if (!relation.nullable && !targetRelation.orphanRemoval) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			const [currentOwner] = await this.mapper.getPrimaryValue(targetEntity, {
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
			if (!currentOwner) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			if (currentOwner && !targetRelation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}

			const result = await this.mapper.updateInternal(
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

	public async delete({ entity, targetEntity, relation, targetRelation }: Model.OneHasOneInverseContext & { input: undefined }) {
		return async () => {
			if (!relation.nullable && !targetRelation.orphanRemoval) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			// orphan removal is handled in mapper.delete
			return await this.mapper.delete(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } })
		}
	}

	private async connectInternal(
		{ entity, targetEntity, targetRelation }: Model.OneHasOneInverseContext,
		newOwner: Input.PrimaryValue,
	) {
		const [currentOwner] = await this.mapper.getPrimaryValue(targetEntity, {
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
			const disconnectFromCurrentOwner = await this.mapper.updateInternal(targetEntity, new CheckedPrimary(currentOwner), builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, null)
			})
			result.push(...disconnectFromCurrentOwner)
		}
		const orphanedInverseSide = targetRelation.orphanRemoval
			? await this.mapper.selectField(targetEntity, { [targetEntity.primary]: newOwner }, targetRelation.name)
			: null

		const connectToNewOwner = await this.mapper.updateInternal(targetEntity, new CheckedPrimary(newOwner), builder => {
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

	private async createInternal({ entity, targetEntity, targetRelation, input }: Model.OneHasOneInverseContext & { input: MapperInput.CreateDataInput }) {
		const [currentOwner] = await this.mapper.getPrimaryValue(targetEntity, {
			[targetRelation.name]: { [entity.primary]: this.primaryValue },
		})
		if (currentOwner && !targetRelation.nullable) {
			// todo cascade delete support?
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		const result: MutationResultList = []
		if (currentOwner) {
			const disconnectFromCurrentOwner = await this.mapper.updateInternal(targetEntity, new CheckedPrimary(currentOwner), builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, null)
			})
			result.push(...disconnectFromCurrentOwner)
		}

		const connectToNewlyCreatedOwner = await this.mapper.insert(targetEntity, input, builder => {
			builder.addFieldValue(targetRelation.name, this.primaryValue)
			builder.addPredicates([targetRelation.name])
		})
		result.push(...connectToNewlyCreatedOwner)

		return result
	}
}
