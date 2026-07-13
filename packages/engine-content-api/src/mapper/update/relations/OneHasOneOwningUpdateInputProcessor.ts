import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from '../../Result.js'
import { MutationAccess } from '../../MutationAccess.js'
import { UpdateBuilder } from '../../update/UpdateBuilder.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { MapperInput } from '../../types.js'

type Context = Model.OneHasOneOwningContext

export class OneHasOneOwningUpdateInputProcessor
	implements UpdateInputProcessor.HasOneRelationInputProcessor<Context, SqlUpdateInputProcessorResult>
{
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly mapper: MutationAccess,
		private readonly updateBuilder: UpdateBuilder,
	) {
	}

	public async connect(context: Model.OneHasOneOwningContext & { input: Input.UniqueWhere | CheckedPrimary }) {
		const { entity, relation, targetEntity, targetRelation, input } = context
		const [newInverseSide, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
		if (err) return [err]
		const currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
		const currentOwnerResult = await this.handleStateBeforeConnect(context, currentInverseSide, newInverseSide)
		if (
			currentOwnerResult.some(it => it.error)
			|| (currentOwnerResult.length === 1 && currentOwnerResult[0].result === MutationResultType.nothingToDo)
		) {
			return currentOwnerResult
		}

		this.updateBuilder.addFieldValue(relation.name, newInverseSide)

		return async () => {
			return [
				...currentOwnerResult,
				...(await this.cleanupOrphan(context, currentInverseSide)),
			]
		}
	}

	public async create(context: Model.OneHasOneOwningContext & { input: MapperInput.CreateDataInput }) {
		const { entity, relation, targetEntity, targetRelation } = context
		const currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
		const createResult = await this.createInternal(context, currentInverseSide)
		const newInverseSide = getInsertPrimary(createResult)
		if (!newInverseSide) {
			return createResult
		}
		this.updateBuilder.addFieldValue(relation.name, newInverseSide)

		return async () => {
			return [
				...createResult,
				...(await this.cleanupOrphan(context, currentInverseSide)),
			]
		}
	}

	public async connectOrCreate(
		{ input: { connect, create }, ...context }: Model.OneHasOneOwningContext & { input: MapperInput.ConnectOrCreateInput },
	) {
		const { relation, targetRelation, targetEntity, entity } = context
		const currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
		const [newInverseSide] = await this.mapper.through(context).getPrimaryValue(targetEntity, connect)

		if (newInverseSide) {
			const currentOwnerResult = await this.handleStateBeforeConnect(context, currentInverseSide, newInverseSide)
			if (
				currentOwnerResult.some(it => it.error)
				|| (currentOwnerResult.length === 1 && currentOwnerResult[0].result === MutationResultType.nothingToDo)
			) {
				return currentOwnerResult
			}
			this.updateBuilder.addFieldValue(relation.name, newInverseSide)
			return async () => {
				return [
					...currentOwnerResult,
					...(await this.cleanupOrphan(context, currentInverseSide)),
				]
			}
		}

		const createResult = await this.createInternal({ ...context, input: create }, currentInverseSide)
		const newInverseSideCreate = getInsertPrimary(createResult)
		if (!newInverseSideCreate) {
			return createResult
		}
		this.updateBuilder.addFieldValue(relation.name, newInverseSideCreate)
		return async () => {
			return [
				...createResult,
				...(await this.cleanupOrphan(context, currentInverseSide)),
			]
		}
	}

	public async update(context: Model.OneHasOneOwningContext & { input: MapperInput.UpdateDataInput }) {
		const { entity, relation, targetEntity, input } = context
		return async () => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			if (!inversePrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.through(context).update(targetEntity, new CheckedPrimary(inversePrimary), input)
		}
	}

	public async upsert(
		context: Model.OneHasOneOwningContext & { input: UpdateInputProcessor.UpsertInput },
	) {
		const { entity, relation, targetEntity, input: { create, update } } = context
		const primary = await this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
		if (!primary) {
			const insertResult = await this.mapper.through(context).insert(targetEntity, create)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			this.updateBuilder.addFieldValue(relation.name, insertPrimary)
			return []
		}

		return async () => {
			return await this.mapper.through(context).update(targetEntity, new CheckedPrimary(primary), update)
		}
	}

	public async disconnect(context: Model.OneHasOneOwningContext & { input: undefined }) {
		const { entity, targetEntity, relation, targetRelation } = context
		if (!relation.nullable) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}

		const inversePrimary = (targetRelation && !targetRelation.nullable) || relation.orphanRemoval
			? await this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
			: undefined
		if (inversePrimary && targetRelation && !targetRelation.nullable && !relation.orphanRemoval) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		this.updateBuilder.addFieldValue(relation.name, null)

		if (relation.orphanRemoval && inversePrimary) {
			return async () => {
				return await this.mapper.through(context).delete(targetEntity, new CheckedPrimary(inversePrimary))
			}
		}

		return []
	}

	public async delete(context: Model.OneHasOneOwningContext & { input: undefined }) {
		const { entity, targetEntity, relation } = context
		if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}

		return async () => {
			const targetPrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			if (!targetPrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.through(context).delete(targetEntity, new CheckedPrimary(targetPrimary))
		}
	}

	private async createInternal(
		context: Model.OneHasOneOwningContext & { input: MapperInput.CreateDataInput },
		currentInverseSide: Input.PrimaryValue | undefined,
	): Promise<MutationResultList> {
		const { targetEntity, targetRelation, relation, input } = context
		if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && currentInverseSide) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}

		return await this.mapper.through(context).insert(targetEntity, input)
	}

	private async getCurrentInverseSide(
		targetRelation: Model.OneHasOneInverseRelation | null,
		relation: Model.OneHasOneOwningRelation,
		entity: Model.Entity,
	) {
		if ((targetRelation && !targetRelation.nullable) || relation.orphanRemoval) {
			return this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
		}
		return undefined
	}

	private async cleanupOrphan(
		context: Model.OneHasOneOwningContext,
		currentInverseSide: Input.PrimaryValue | undefined,
	) {
		const { relation, targetEntity } = context
		if (relation.orphanRemoval && currentInverseSide) {
			return await this.mapper.through(context).delete(targetEntity, { [targetEntity.primary]: currentInverseSide })
		}
		return []
	}

	private async handleStateBeforeConnect(
		{ targetEntity, targetRelation, relation, entity }: Model.OneHasOneOwningContext,
		currentInverseSide: Input.PrimaryValue | undefined,
		newInverseSide: Input.PrimaryValue,
	): Promise<MutationResultList> {
		if (currentInverseSide === newInverseSide) {
			return [new MutationNothingToDo([], NothingToDoReason.alreadyExists)]
		}

		const [currentOwnerOfNewInverseSide] = await this.mapper.getPrimaryValue(entity, {
			[relation.name]: { [targetEntity.primary]: newInverseSide },
		})

		if (currentOwnerOfNewInverseSide === this.primaryValue) {
			return [new MutationNothingToDo([], NothingToDoReason.alreadyExists)]
		}

		// orphan removal handled bellow
		if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && currentInverseSide) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}

		if (currentOwnerOfNewInverseSide) {
			if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}

			return await this.mapper.updateInternal(
				entity,
				new CheckedPrimary(currentOwnerOfNewInverseSide),
				builder => {
					builder.addPredicates([relation.name])
					builder.addFieldValue(relation.name, null)
				},
			)
		}
		return []
	}
}
