import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result.js'
import { Mapper } from '../../Mapper.js'
import { SqlUpdateInputProcessorResult } from '../../update/index.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'
import { AclScope } from '../../../acl/index.js'
import { UpdateBuilder } from '../UpdateBuilder.js'

type Context = Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext

export class ManyHasManyUpdateInputProcessor implements UpdateInputProcessor.HasManyRelationInputProcessor<Context, SqlUpdateInputProcessorResult> {
	constructor(
		private readonly mapper: Mapper,
		/** Scope of the entity being written, the one that declares this relation; the other side of the junction stays nested. */
		private readonly scope: AclScope,
		private readonly updateBuilder: UpdateBuilder,
	) {
	}

	public async connect(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		this.updateBuilder.markPredicateCheckedElsewhere(relation.name)
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, input)
			if (err) return [err]
			return await this.mapper.connectJunction(entity, relation, primary, otherPrimary, this.scope)
		}
	}

	public async create(
		{ entity, targetEntity, relation, input }: Context & { input: MapperInput.CreateDataInput },
	) {
		this.updateBuilder.markPredicateCheckedElsewhere(relation.name)
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const insertResult = await this.mapper.insert(targetEntity, input, 'nested')
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, primary, insertPrimary, this.scope)),
			]
		}
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		this.updateBuilder.markPredicateCheckedElsewhere(context.relation.name)
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			let [otherPrimary] = await this.mapper.getPrimaryValue(context.targetEntity, context.input.connect)
			if (!otherPrimary) {
				const insertResult = await this.mapper.insert(context.targetEntity, context.input.create, 'nested')
				otherPrimary = getInsertPrimary(insertResult)
				if (!otherPrimary) {
					return insertResult
				}
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary, this.scope)
		}
	}

	public async update(
		{ entity, targetEntity, relation, input: { where, data } }: Context & { input: UpdateInputProcessor.UpdateManyInput },
	) {
		this.updateBuilder.markPredicateCheckedElsewhere(relation.name)
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, where)
			if (err) return [err]
			return [
				...(await this.mapper.update(targetEntity, new CheckedPrimary(otherPrimary), data, 'nested')),
				...(await this.mapper.connectJunction(entity, relation, primary, otherPrimary, this.scope)),
			]
		}
	}

	public async upsert(
		{ entity, relation, targetEntity, input: { create, update, where } }: Context & { input: UpdateInputProcessor.UpsertManyInput },
	) {
		this.updateBuilder.markPredicateCheckedElsewhere(relation.name)
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary] = await this.mapper.getPrimaryValue(targetEntity, where)
			if (otherPrimary) {
				const updateResult = await this.mapper.update(targetEntity, new CheckedPrimary(otherPrimary), update, 'nested')
				const connectResult = await this.mapper.connectJunction(entity, relation, primary, otherPrimary, this.scope)
				return [...updateResult, ...connectResult]
			} else {
				const insertResult = await this.mapper.insert(targetEntity, create, 'nested')

				const primaryValue = getInsertPrimary(insertResult)
				if (!primaryValue) {
					return insertResult
				}
				const connectResult = await this.mapper.connectJunction(entity, relation, primary, primaryValue, this.scope)
				return [...insertResult, ...connectResult]
			}
		}
	}

	public async disconnect(
		{ entity, targetEntity, relation, input }: Context & { input: Input.UniqueWhere },
	) {
		this.updateBuilder.markPredicateCheckedElsewhere(relation.name)
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, input)
			if (err) return [err]

			return await this.mapper.disconnectJunction(entity, relation, primary, otherPrimary, this.scope)
		}
	}

	public async delete(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.delete(targetEntity, input, 'nested')
		}
	}
}
