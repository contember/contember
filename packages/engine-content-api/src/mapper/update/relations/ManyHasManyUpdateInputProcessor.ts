import { UpdateInputProcessor } from '../../../inputProcessing'
import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result'
import { Mapper } from '../../Mapper'
import { SqlUpdateInputProcessorResult } from '../../update'
import { CheckedPrimary } from '../../CheckedPrimary'
import { MapperInput } from '../../types'

type Context = Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext

export class ManyHasManyUpdateInputProcessor implements UpdateInputProcessor.HasManyRelationInputProcessor<Context, SqlUpdateInputProcessorResult> {
	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, input)
			if (err) return [err]
			return await this.mapper.connectJunction(entity, relation, primary, otherPrimary)
		}
	}

	public async create(
		{ entity, targetEntity, relation, input }: Context & { input: MapperInput.CreateDataInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const insertResult = await this.mapper.insert(targetEntity, input)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, primary, insertPrimary)),
			]
		}
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			let [otherPrimary] = await this.mapper.getPrimaryValue(context.targetEntity, context.input.connect)
			if (!otherPrimary) {
				const insertResult = await this.mapper.insert(context.targetEntity, context.input.create)
				otherPrimary = getInsertPrimary(insertResult)
				if (!otherPrimary) {
					return insertResult
				}
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary)
		}
	}

	public async update(
		{ entity, targetEntity, relation, input: { where, data } }: Context & { input: UpdateInputProcessor.UpdateManyInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, where)
			if (err) return [err]
			return [
				...(await this.mapper.update(targetEntity, new CheckedPrimary(otherPrimary), data)),
				...(await this.mapper.connectJunction(entity, relation, primary, otherPrimary)),
			]
		}
	}

	public async upsert(
		{ entity, relation, targetEntity, input: { create, update, where } }: Context & { input: UpdateInputProcessor.UpsertManyInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary] = await this.mapper.getPrimaryValue(targetEntity, where)
			if (otherPrimary) {
				const updateResult = await this.mapper.update(targetEntity, new CheckedPrimary(otherPrimary), update)
				const connectResult = await this.mapper.connectJunction(entity, relation, primary, otherPrimary)
				return [...updateResult, ...connectResult]
			} else {
				const insertResult = await this.mapper.insert(targetEntity, create)

				const primaryValue = getInsertPrimary(insertResult)
				if (!primaryValue) {
					return insertResult
				}
				const connectResult = await this.mapper.connectJunction(entity, relation, primary, primaryValue)
				return [...insertResult, ...connectResult]
			}
		}
	}

	public async disconnect(
		{ entity, targetEntity, relation, input }: Context & { input: Input.UniqueWhere },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.getPrimaryValue(targetEntity, input)
			if (err) return [err]

			return await this.mapper.disconnectJunction(entity, relation, primary, otherPrimary)
		}
	}

	public async delete(
		{ entity, targetEntity, relation, targetRelation, input }: Context & { input: Input.UniqueWhere },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.delete(targetEntity, input)
		}
	}
}
