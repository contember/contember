import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { Acl, Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result.js'
import { MutationAccess } from '../../MutationAccess.js'
import { SqlUpdateInputProcessorResult } from '../../update/index.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext

export class ManyHasManyUpdateInputProcessor implements UpdateInputProcessor.HasManyRelationInputProcessor<Context, SqlUpdateInputProcessorResult> {
	constructor(
		private readonly mapper: MutationAccess,
	) {
	}

	public async connect(
		context: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		const { entity, targetEntity, relation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
			if (err) return [err]
			return await this.mapper.connectJunction(entity, relation, primary, otherPrimary, {
				source: Acl.Operation.update,
				target: Acl.Operation.update,
			})
		}
	}

	public async create(
		context: Context & { input: MapperInput.CreateDataInput },
	) {
		const { entity, targetEntity, relation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const insertResult = await this.mapper.through(context).insert(targetEntity, input)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, primary, insertPrimary, {
					source: Acl.Operation.update,
					target: Acl.Operation.create,
				})),
			]
		}
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const targetAccess = this.mapper.through(context)
			let [otherPrimary] = await targetAccess.getPrimaryValue(context.targetEntity, context.input.connect)
			let targetOperation = Acl.Operation.update
			if (!otherPrimary) {
				const insertResult = await targetAccess.insert(context.targetEntity, context.input.create)
				otherPrimary = getInsertPrimary(insertResult)
				if (!otherPrimary) {
					return insertResult
				}
				targetOperation = Acl.Operation.create
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary, {
				source: Acl.Operation.update,
				target: targetOperation,
			})
		}
	}

	public async update(
		context: Context & { input: UpdateInputProcessor.UpdateManyInput },
	) {
		const { entity, targetEntity, relation, input: { where, data } } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const targetAccess = this.mapper.through(context)
			const [otherPrimary, err] = await targetAccess.getPrimaryValue(targetEntity, where)
			if (err) return [err]
			return [
				...(await targetAccess.update(targetEntity, new CheckedPrimary(otherPrimary), data)),
				...(await this.mapper.connectJunction(entity, relation, primary, otherPrimary, {
					source: Acl.Operation.update,
					target: Acl.Operation.update,
				})),
			]
		}
	}

	public async upsert(
		context: Context & { input: UpdateInputProcessor.UpsertManyInput },
	) {
		const { entity, relation, targetEntity, input: { create, update, where } } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const targetAccess = this.mapper.through(context)
			const [otherPrimary] = await targetAccess.getPrimaryValue(targetEntity, where)
			if (otherPrimary) {
				const updateResult = await targetAccess.update(targetEntity, new CheckedPrimary(otherPrimary), update)
				const connectResult = await this.mapper.connectJunction(entity, relation, primary, otherPrimary, {
					source: Acl.Operation.update,
					target: Acl.Operation.update,
				})
				return [...updateResult, ...connectResult]
			} else {
				const insertResult = await targetAccess.insert(targetEntity, create)

				const primaryValue = getInsertPrimary(insertResult)
				if (!primaryValue) {
					return insertResult
				}
				const connectResult = await this.mapper.connectJunction(entity, relation, primary, primaryValue, {
					source: Acl.Operation.update,
					target: Acl.Operation.create,
				})
				return [...insertResult, ...connectResult]
			}
		}
	}

	public async disconnect(
		context: Context & { input: Input.UniqueWhere },
	) {
		const { entity, targetEntity, relation, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			const [otherPrimary, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
			if (err) return [err]

			return await this.mapper.disconnectJunction(entity, relation, primary, otherPrimary)
		}
	}

	public async delete(
		context: Context & { input: Input.UniqueWhere },
	) {
		const { targetEntity, input } = context
		return async ({ primary }: { primary: Input.PrimaryValue }) => {
			return await this.mapper.through(context).delete(targetEntity, input)
		}
	}
}
