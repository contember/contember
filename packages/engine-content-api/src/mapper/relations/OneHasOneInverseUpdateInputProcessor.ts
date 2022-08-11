import {
	ConstraintType,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from '../Result'
import { ContextWithInput, OneHasOneInverseContext, UpdateInputProcessor } from '../../inputProcessing'
import { Input } from '@contember/schema'
import { Mapper } from '../Mapper'

export class OneHasOneInverseUpdateInputProcessor {
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly mapper: Mapper,
	) {
	}

	public async connect({ input, ...ctx  }: ContextWithInput<OneHasOneInverseContext, Input.UniqueWhere>) {
		const newOwner = await this.mapper.getPrimaryValue(ctx.targetEntity, input)
		if (!newOwner) {
			return [new MutationEntryNotFoundError([], input)]
		}
		return await this.connectInternal(ctx, newOwner)
	}


	private async connectInternal(
		{ entity, targetEntity, targetRelation }: OneHasOneInverseContext,
		newOwner: Input.PrimaryValue,
	) {
		const currentOwner = await this.mapper.getPrimaryValue(targetEntity, {
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
			const disconnectFromCurrentOwner = await this.mapper.updateInternal(targetEntity, { [targetEntity.primary]: currentOwner }, builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, null)
			})
			result.push(...disconnectFromCurrentOwner)
		}
		const orphanedInverseSide = targetRelation.orphanRemoval
			? await this.mapper.selectField(targetEntity, { [targetEntity.primary]: newOwner }, targetRelation.name)
			: null

		const connectToNewOwner = await this.mapper.updateInternal(targetEntity, { [targetEntity.primary]: newOwner }, builder => {
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

	public async create({ entity, targetEntity, targetRelation, input }: ContextWithInput<OneHasOneInverseContext, Input.CreateDataInput>) {
		const currentOwner = await this.mapper.getPrimaryValue(targetEntity, {
			[targetRelation.name]: { [entity.primary]: this.primaryValue },
		})
		if (currentOwner && !targetRelation.nullable) {
			// todo cascade delete support?
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		const result: MutationResultList = []
		if (currentOwner) {
			const disconnectFromCurrentOwner = await this.mapper.updateInternal(targetEntity, { [targetEntity.primary]: currentOwner }, builder => {
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

	public async update({ entity, targetEntity, targetRelation, input }: ContextWithInput<OneHasOneInverseContext, Input.UpdateDataInput>) {
		return await this.mapper.update(
			targetEntity,
			{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
			input,
		)
	}

	public async upsert({ entity, relation, targetEntity, targetRelation, input: { create, update } }: ContextWithInput<OneHasOneInverseContext, UpdateInputProcessor.UpsertInput>) {
		const result = await this.mapper.update(
			targetEntity,
			{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
			update,
		)
		if (result[0].result === MutationResultType.notFoundError) {
			return await this.create({
				entity,
				targetEntity,
				targetRelation,
				relation,
				input: create,
			})
		}
		return result
	}

	public async disconnect({ entity, targetEntity, relation, targetRelation }: ContextWithInput<OneHasOneInverseContext, undefined>) {
		if (!relation.nullable && !targetRelation.orphanRemoval) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		const currentOwner = await this.mapper.getPrimaryValue(targetEntity, {
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
			{ [targetEntity.primary]: currentOwner },
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

	public async delete({ entity, targetEntity, relation, targetRelation }: ContextWithInput<OneHasOneInverseContext, undefined>) {
		if (!relation.nullable && !targetRelation.orphanRemoval) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		// orphan removal is handled in mapper.delete
		return await this.mapper.delete(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } })
	}
}
