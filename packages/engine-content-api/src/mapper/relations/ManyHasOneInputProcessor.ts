import { ContextWithInput, CreateInputProcessor, ManyHasOneContext, UpdateInputProcessor } from '../../inputProcessing'
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
import { AbortDataManipulation, DataManipulationBuilder } from '../DataManipulationBuilder'
import { UpdateBuilder } from '../update'

export class ManyHasOneInputProcessor {

	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ targetEntity, relation, input }: ContextWithInput<ManyHasOneContext, Input.UniqueWhere>,
		builder: DataManipulationBuilder,
	) {
		const result: MutationResultList = []
		await builder.addFieldValue(relation.name, async () => {
			const value = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!value) {
				result.push(new MutationEntryNotFoundError([], input))
				return AbortDataManipulation
			}
			return value
		})
		return result
	}

	public async create(
		{ relation, targetEntity, input }: ContextWithInput<ManyHasOneContext, Input.CreateDataInput>,
		builder: DataManipulationBuilder,
	) {
		const result: MutationResultList = []
		await builder.addFieldValue(relation.name, async () => {
			const insertResult = await this.mapper.insert(targetEntity, input)
			const value = getInsertPrimary(insertResult)
			if (!value) {
				result.push(...insertResult)
				return AbortDataManipulation
			}
			return value
		})
		return result
	}

	public async connectOrCreate(
		{ input: { connect, create }, relation, targetEntity }: ContextWithInput<ManyHasOneContext, CreateInputProcessor.ConnectOrCreateInput>,
		builder: DataManipulationBuilder,
	) {
		const result: MutationResultList = []
		await builder.addFieldValue(relation.name, async () => {
			const value = await this.mapper.getPrimaryValue(targetEntity, connect)
			if (value) {
				return value
			}
			const insertPromise = this.mapper.insert(targetEntity, create)
			const insertResult = await insertPromise
			const primary = getInsertPrimary(insertResult)
			if (!primary) {
				result.push(...insertResult)
				return AbortDataManipulation
			}
			return primary
		})
		return result
	}

	public async update(
		{ entity, relation, targetEntity, targetRelation, input }: ContextWithInput<ManyHasOneContext, Input.UpdateDataInput>,
		primary: Input.PrimaryValue,
	) {
		const inversePrimary = await this.mapper.selectField(
			entity,
			{ [entity.primary]: primary },
			relation.name,
		)
		if (!inversePrimary) {
			return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
		}
		return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, input)
	}

	public async upsert(
		{ entity, relation, targetEntity, input: { create, update } }: ContextWithInput<ManyHasOneContext, UpdateInputProcessor.UpsertInput>,
		builder: DataManipulationBuilder,
		primary: Input.PrimaryValue,
	) {
		const select = this.mapper.selectField(entity, { [entity.primary]: primary }, relation.name)

		const result: MutationResultList = []
		// addFieldValue has to be called immediately
		await builder.addFieldValue(relation.name, async () => {
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
		} else {
			return result
		}
	}

	public async disconnect(
		{ entity, targetEntity, relation, targetRelation }: ContextWithInput<ManyHasOneContext, undefined>,
		builder: DataManipulationBuilder,
	) {
		if (!relation.nullable) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		builder.addFieldValue(relation.name, null)
		return []
	}

	public async delete(
		{ entity, targetEntity, relation, targetRelation }: ContextWithInput<ManyHasOneContext, undefined>,
		builder: UpdateBuilder,
		primary: Input.PrimaryValue,
	) {
		if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		if (relation.joiningColumn.onDelete === Model.OnDelete.restrict) {
			// eslint-disable-next-line no-console
			console.error(
				'[DEPRECATED] You are deleting an entity over the relation where onDelete behaviour is set to restrict. This will fail in next version.',
			)
			builder.addFieldValue(relation.name, null)
		}
		const inversePrimary = await this.mapper.selectField(
			entity,
			{ [entity.primary]: primary },
			relation.name,
		)
		await builder.update
		return await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversePrimary })
	}
}
