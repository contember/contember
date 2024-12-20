import { UpdateInputProcessor } from '../../../inputProcessing'
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
} from '../../Result'
import { Mapper } from '../../Mapper'
import { UpdateBuilder } from '../../update/UpdateBuilder'
import { CheckedPrimary } from '../../CheckedPrimary'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor'
import { MapperInput } from '../../types'

type Context = Model.OneHasOneOwningContext

export class OneHasOneOwningUpdateInputProcessor implements UpdateInputProcessor.HasOneRelationInputProcessor<Context, SqlUpdateInputProcessorResult>{
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly mapper: Mapper,
		private readonly updateBuilder: UpdateBuilder,
	) {
	}

	public async connect(context: Model.OneHasOneOwningContext & { input: Input.UniqueWhere | CheckedPrimary }) {
		const { entity, relation, targetEntity, targetRelation, input } = context
		const [newInverseSide, err] = await this.mapper.getPrimaryValue(targetEntity, input)
		if (err) return [err]
		const currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
		const currentOwnerResult = await this.handleStateBeforeConnect(context, currentInverseSide, newInverseSide)
		if (currentOwnerResult.some(it => it.error)
			|| (currentOwnerResult.length === 1 && currentOwnerResult[0].result === MutationResultType.nothingToDo)
		) {
			return currentOwnerResult
		}

		this.updateBuilder.addFieldValue(relation.name, newInverseSide)

		return async () => {
			return [
				...currentOwnerResult,
				...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)),
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
				...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)),
			]
		}
	}

	public async connectOrCreate({ input: { connect, create }, ...context }: Model.OneHasOneOwningContext & { input: MapperInput.ConnectOrCreateInput }) {
		const { relation, targetRelation, targetEntity, entity } = context
		const currentInverseSide = await this.getCurrentInverseSide(targetRelation, relation, entity)
		const [newInverseSide] = await this.mapper.getPrimaryValue(targetEntity, connect)

		if (newInverseSide) {
			const currentOwnerResult = await this.handleStateBeforeConnect(context, currentInverseSide, newInverseSide)
			if (currentOwnerResult.some(it => it.error)
				|| (currentOwnerResult.length === 1 && currentOwnerResult[0].result === MutationResultType.nothingToDo)
			) {
				return currentOwnerResult
			}
			this.updateBuilder.addFieldValue(relation.name, newInverseSide)
			return async () => {
				return [
					...currentOwnerResult,
					...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)),
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
				...(await this.cleanupOrphan(relation, targetEntity, currentInverseSide)),
			]
		}
	}

	public async update({ entity, relation, targetEntity, input }: Model.OneHasOneOwningContext & { input: MapperInput.UpdateDataInput }) {
		return async () => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			if (!inversePrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.update(targetEntity, new CheckedPrimary(inversePrimary), input)
		}
	}

	public async upsert({ entity, relation, targetEntity, input: { create, update } }: Model.OneHasOneOwningContext & { input: UpdateInputProcessor.UpsertInput }) {
		const primary = await this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
		if (!primary) {
			const insertResult = await this.mapper.insert(targetEntity, create)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			this.updateBuilder.addFieldValue(relation.name, insertPrimary)
			return []
		}

		return async () => {
			return await this.mapper.update(targetEntity, new CheckedPrimary(primary), update)
		}
	}

	public async disconnect({ entity, targetEntity, relation, targetRelation }: Model.OneHasOneOwningContext & { input: undefined }) {
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
				return await this.mapper.delete(targetEntity, new CheckedPrimary(inversePrimary))
			}
		}

		return []
	}

	public async delete({ entity, targetEntity, relation, targetRelation }: Model.OneHasOneOwningContext & { input: undefined }) {
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
			return await this.mapper.delete(targetEntity, new CheckedPrimary(targetPrimary))
		}
	}

	private async createInternal(
		{ targetEntity, targetRelation, relation, input }: Model.OneHasOneOwningContext & { input: MapperInput.CreateDataInput },
		currentInverseSide: Input.PrimaryValue | undefined,
	): Promise<MutationResultList> {
		if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && currentInverseSide) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}

		return await this.mapper.insert(targetEntity, input)
	}

	private async getCurrentInverseSide(targetRelation: Model.OneHasOneInverseRelation | null, relation: Model.OneHasOneOwningRelation, entity: Model.Entity) {
		if ((targetRelation && !targetRelation.nullable) || relation.orphanRemoval) {
			return this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
		}
		return undefined
	}

	private async cleanupOrphan(relation: Model.OneHasOneOwningRelation, targetEntity: Model.Entity, currentInverseSide: Input.PrimaryValue | undefined) {
		if (relation.orphanRemoval && currentInverseSide) {
			return await this.mapper.delete(targetEntity, { [targetEntity.primary]: currentInverseSide })
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
