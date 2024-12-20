import { UpdateInputProcessor } from '../../../inputProcessing'
import { Input, Model } from '@contember/schema'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	NothingToDoReason,
} from '../../Result'
import { Mapper } from '../../Mapper'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor'
import { UpdateBuilder } from '../UpdateBuilder'
import { CheckedPrimary } from '../../CheckedPrimary'
import { MapperInput } from '../../types'

type Context = Model.ManyHasOneContext

export class ManyHasOneUpdateInputProcessor implements UpdateInputProcessor.HasOneRelationInputProcessor<Context, SqlUpdateInputProcessorResult>{

	constructor(
		private readonly mapper: Mapper,
		private readonly builder: UpdateBuilder,
		private readonly primary: Input.PrimaryValue,
	) {
	}

	public async connect(
		{ targetEntity, relation, input }: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		const [value, err] = await this.mapper.getPrimaryValue(targetEntity, input)
		if (err) return [err]
		this.builder.addFieldValue(relation.name, value)
		return []
	}

	public async create(
		{ relation, targetEntity, input }: Context & { input: MapperInput.CreateDataInput },
	) {
		const insertResult = await this.mapper.insert(targetEntity, input)
		const value = getInsertPrimary(insertResult)
		if (!value) {
			return insertResult
		}
		this.builder.addFieldValue(relation.name, value)
		return []
	}

	public async connectOrCreate(
		{ input: { connect, create }, relation, targetEntity }: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		const [value] = await this.mapper.getPrimaryValue(targetEntity, connect)
		if (value) {
			this.builder.addFieldValue(relation.name, value)
		} else {
			const insertResult = await this.mapper.insert(targetEntity, create)
			const primary = getInsertPrimary(insertResult)
			if (!primary) {
				return insertResult
			}

			this.builder.addFieldValue(relation.name, primary)
		}
		return []
	}

	public async update(
		{ entity, relation, targetEntity, targetRelation, input }: Context & { input: MapperInput.UpdateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: primary },
				relation.name,
			)
			if (!inversePrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.update(targetEntity, new CheckedPrimary(inversePrimary), input)
		}
	}

	public async upsert(
		{ entity, relation, targetEntity, input: { create, update } }: Context & { input: UpdateInputProcessor.UpsertInput },
	) {
		const inversePrimary = await this.mapper.selectField(entity, { [entity.primary]: this.primary }, relation.name)
		if (!inversePrimary) {
			const insertResult = await this.mapper.insert(targetEntity, create)
			const insertPrimary = getInsertPrimary(insertResult)
			if (insertPrimary) {
				this.builder.addFieldValue(relation.name, insertPrimary)
			}
			return insertResult
		}

		return async () =>
			await this.mapper.update(targetEntity, new CheckedPrimary(inversePrimary), update)
	}

	public async disconnect(
		{ entity, targetEntity, relation, targetRelation }: Context & { input: undefined },
	) {
		if (!relation.nullable) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		this.builder.addFieldValue(relation.name, null)
		return []
	}

	public async delete(
		{ entity, targetEntity, relation, targetRelation }: Context & { input: undefined },
	) {
		if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: primary },
				relation.name,
			)
			return await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversePrimary })
		}
	}
}
