import {
	ContextWithInput,
	CreateInputProcessor,
	OneHasOneOwningContext,
	UpdateInputProcessor,
} from '../../inputProcessing'
import { Input, Model } from '@contember/schema'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	MutationResultList,
	NothingToDoReason,
} from '../Result'
import { Mapper } from '../Mapper'
import { UpdateBuilder } from '../update/UpdateBuilder'
import { CheckedPrimary } from '../CheckedPrimary'
import { AbortDataManipulation } from '../DataManipulationBuilder'

export class OneHasOneOwningUpdateInputProcessor {
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly mapper: Mapper,
		private readonly updateBuilder: UpdateBuilder,
	) {
	}

	public async connect({ entity, relation, targetEntity, targetRelation, input }: ContextWithInput<OneHasOneOwningContext, Input.UniqueWhere>) {
		const result: MutationResultList = []
		let currentInverseSide: Input.PrimaryValue | undefined

		const newInverseSide = await this.updateBuilder.addFieldValue(relation.name, async () => {
			const newInverseSide = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!newInverseSide) {
				result.push(new MutationEntryNotFoundError([], input))
				return AbortDataManipulation
			}
			currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
			return await this.connectInternal({ entity, relation, targetEntity, targetRelation }, currentInverseSide, newInverseSide, result)
		})

		if (newInverseSide) {
			result.push(...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)))
		}

		return result
	}

	public async create({ entity, targetEntity, relation, targetRelation, input }: ContextWithInput<OneHasOneOwningContext, Input.CreateDataInput>) {
		const result: MutationResultList = []
		let currentInverseSide: Input.PrimaryValue | undefined
		await this.updateBuilder.addFieldValue(relation.name, async () => {
			currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
			// orphan removal handled bellow
			return await this.createInternal({ entity, targetRelation, relation, targetEntity, input }, currentInverseSide, result)
		})

		result.push(...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)))
		return result
	}

	public async connectOrCreate({ entity, relation, targetEntity, targetRelation, input: { connect, create } }: ContextWithInput<OneHasOneOwningContext, CreateInputProcessor.ConnectOrCreateInput>) {
		const result: MutationResultList = []
		let currentInverseSide: Input.PrimaryValue | undefined

		const newInverseSide = await this.updateBuilder.addFieldValue(relation.name, async () => {
			const newInverseSide = await this.mapper.getPrimaryValue(targetEntity, connect)
			currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
			if (newInverseSide) {
				return await this.connectInternal({ entity, relation, targetEntity, targetRelation }, currentInverseSide, newInverseSide, result)
			}
			return await this.createInternal({ entity, relation, targetEntity, targetRelation, input: create }, currentInverseSide, result)
		})

		if (newInverseSide) {
			result.push(...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)))
		}

		return result
	}

	private async createInternal(
		{ targetEntity, targetRelation, relation, input }: ContextWithInput<OneHasOneOwningContext, Input.CreateDataInput>,
		currentInverseSide: Input.PrimaryValue | undefined,
		result: MutationResultList,
	) {
		if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && currentInverseSide) {
			result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
			return AbortDataManipulation
		}

		const insertResult = await this.mapper.insert(targetEntity, input)
		result.push(...insertResult)
		const newInverseSide = getInsertPrimary(insertResult)
		if (newInverseSide) {
			return newInverseSide
		}
		return AbortDataManipulation
	}

	private async connectInternal(
		{ targetEntity, targetRelation, relation, entity }: OneHasOneOwningContext,
		currentInverseSide: Input.PrimaryValue | undefined,
		newInverseSide: Input.PrimaryValue,
		result: MutationResultList,
	) {

		if (currentInverseSide === newInverseSide) {
			result.push(new MutationNothingToDo([], NothingToDoReason.alreadyExists))
			return undefined
		}

		const currentOwnerOfNewInverseSide = await this.mapper.getPrimaryValue(entity, {
			[relation.name]: { [targetEntity.primary]: newInverseSide },
		})

		if (currentOwnerOfNewInverseSide === this.primaryValue) {
			result.push(new MutationNothingToDo([], NothingToDoReason.alreadyExists))
			return undefined
		}

		// orphan removal handled bellow
		if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && currentInverseSide) {
			result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
			return AbortDataManipulation
		}

		if (currentOwnerOfNewInverseSide) {
			if (!relation.nullable) {
				result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
				return AbortDataManipulation
			}

			const currentOwnerDisconnect = await this.mapper.updateInternal(
				entity,
				{
					[entity.primary]: currentOwnerOfNewInverseSide,
				},
				builder => {
					builder.addPredicates([relation.name])
					builder.addFieldValue(relation.name, null)
				},
			)
			result.push(...currentOwnerDisconnect)
		}
		return newInverseSide
	}

	private async getCurrentInverseSide(targetRelation: Model.OneHasOneInverseRelation | null, relation: Model.OneHasOneOwningRelation, entity: Model.Entity) {
		if ((targetRelation && !targetRelation.nullable) || relation.orphanRemoval) {
			return this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
		}
		return undefined
	}

	private async cleanupOrphan(relation: Model.OneHasOneOwningRelation, targetEntity: Model.Entity, currentInverseSide: Input.PrimaryValue | undefined) {
		if (relation.orphanRemoval && currentInverseSide) {
			await this.updateBuilder.update
			return await this.mapper.delete(targetEntity, { [targetEntity.primary]: currentInverseSide })
		}
		return []
	}

	public async update({ entity, relation, targetEntity, input }: ContextWithInput<OneHasOneOwningContext, Input.UpdateDataInput>) {
		const inversePrimary = await this.mapper.selectField(
			entity,
			{ [entity.primary]: this.primaryValue },
			relation.name,
		)
		if (!inversePrimary) {
			return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
		}
		return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, input)
	}

	public async upsert({ entity, relation, targetEntity, input: { create, update } }: ContextWithInput<OneHasOneOwningContext, UpdateInputProcessor.UpsertInput>) {
		const select = this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)

		const result: MutationResultList = []
		//addColumnData has to be called synchronously
		await this.updateBuilder.addFieldValue(relation.name, async () => {
			const primary = await select
			if (primary) {
				return undefined
			}
			const insertResult = await this.mapper.insert(targetEntity, create)
			const insertPrimary = getInsertPrimary(insertResult)
			if (insertPrimary) {
				return insertPrimary
			}
			result.push(...insertResult)
			return AbortDataManipulation
		})

		const inversePrimary = await select
		if (inversePrimary) {
			return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, update)
		}
		return result
	}

	public async disconnect({ entity, targetEntity, relation, targetRelation }: ContextWithInput<OneHasOneOwningContext, undefined>) {
		if (!relation.nullable) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		const result: MutationResultList = []

		const currentInverseSide = (targetRelation && !targetRelation.nullable) || relation.orphanRemoval
			? this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
			: Promise.resolve(undefined)

		this.updateBuilder.addFieldValue(relation.name, async () => {
			const inversePrimary = await currentInverseSide
			if (inversePrimary && targetRelation && !targetRelation.nullable && !relation.orphanRemoval) {
				result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
				return AbortDataManipulation
			}
			return null
		})
		if (relation.orphanRemoval) {
			const inversePrimary = await currentInverseSide
			if (inversePrimary) {
				await this.updateBuilder.update
				const deleteOrphanedInverseSide = await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversePrimary })
				result.push(...deleteOrphanedInverseSide)
			}
		}
		return result
	}

	public async delete({ entity, targetEntity, relation, targetRelation }: ContextWithInput<OneHasOneOwningContext, undefined>) {
		if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		if (relation.joiningColumn.onDelete === Model.OnDelete.restrict) {
			// eslint-disable-next-line no-console
			console.error(
				'[DEPRECATED] You are deleting an entity over the relation where onDelete behaviour is set to restrict. This will fail in next version.',
			)
			this.updateBuilder.addFieldValue(relation.name, null)
		}
		const targetPrimary = await this.mapper.selectField(
			entity,
			{ [entity.primary]: this.primaryValue },
			relation.name,
		)
		if (!targetPrimary) {
			return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
		}
		await this.updateBuilder.update
		return await this.mapper.delete(targetEntity, new CheckedPrimary(targetPrimary))
	}
}
