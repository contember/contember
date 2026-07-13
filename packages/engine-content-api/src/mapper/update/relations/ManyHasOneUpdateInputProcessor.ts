import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	NothingToDoReason,
} from '../../Result.js'
import { MutationAccess } from '../../MutationAccess.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { UpdateBuilder } from '../UpdateBuilder.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.ManyHasOneContext

export class ManyHasOneUpdateInputProcessor implements UpdateInputProcessor.HasOneRelationInputProcessor<Context, SqlUpdateInputProcessorResult> {
	constructor(
		private readonly mapper: MutationAccess,
		private readonly builder: UpdateBuilder,
		private readonly primary: Input.PrimaryValue,
	) {
	}

	public async connect(
		context: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		const { targetEntity, relation, input } = context
		const [value, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
		if (err) return [err]
		this.builder.addFieldValue(relation.name, value)
		return []
	}

	public async create(
		context: Context & { input: MapperInput.CreateDataInput },
	) {
		const { relation, targetEntity, input } = context
		const insertResult = await this.mapper.through(context).insert(targetEntity, input)
		const value = getInsertPrimary(insertResult)
		if (!value) {
			return insertResult
		}
		this.builder.addFieldValue(relation.name, value)
		return []
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		const { input: { connect, create }, relation, targetEntity } = context
		const targetAccess = this.mapper.through(context)
		const [value] = await targetAccess.getPrimaryValue(targetEntity, connect)
		if (value) {
			this.builder.addFieldValue(relation.name, value)
		} else {
			const insertResult = await targetAccess.insert(targetEntity, create)
			const primary = getInsertPrimary(insertResult)
			if (!primary) {
				return insertResult
			}

			this.builder.addFieldValue(relation.name, primary)
		}
		return []
	}

	public async update(
		context: Context & { input: MapperInput.UpdateDataInput },
	) {
		const { entity, relation, targetEntity, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: primary },
				relation.name,
			)
			if (!inversePrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.through(context).update(targetEntity, new CheckedPrimary(inversePrimary), input)
		}
	}

	public async upsert(
		context: Context & { input: UpdateInputProcessor.UpsertInput },
	) {
		const { entity, relation, targetEntity, input: { create, update } } = context
		const inversePrimary = await this.mapper.selectField(entity, { [entity.primary]: this.primary }, relation.name)
		if (!inversePrimary) {
			const insertResult = await this.mapper.through(context).insert(targetEntity, create)
			const insertPrimary = getInsertPrimary(insertResult)
			if (insertPrimary) {
				this.builder.addFieldValue(relation.name, insertPrimary)
			}
			return insertResult
		}

		return async () => await this.mapper.through(context).update(targetEntity, new CheckedPrimary(inversePrimary), update)
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
		context: Context & { input: undefined },
	) {
		const { entity, targetEntity, relation } = context
		if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: primary },
				relation.name,
			)
			return await this.mapper.through(context).delete(targetEntity, { [targetEntity.primary]: inversePrimary })
		}
	}
}
