import {
	ContextWithInput,
	CreateInputProcessor,
	ManyHasManyInverseContext,
	ManyHasManyOwningContext,
	UpdateInputProcessor,
} from '../../inputProcessing'
import { Input } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError, MutationResultList } from '../Result'
import { Mapper } from '../Mapper'

export class ManyHasManyInputProcessor {
	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, targetEntity, relation, targetRelation, input }: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, Input.UniqueWhere>,
		primary: Input.PrimaryValue,
	) {
		const otherPrimary = await this.mapper.getPrimaryValue(targetEntity, input)
		if (!otherPrimary) {
			return [new MutationEntryNotFoundError([], input)]
		}
		return await this.mapper.connectJunction(entity, relation, primary, otherPrimary)
	}

	public async create(
		{ entity, targetEntity, relation, input }: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, Input.CreateDataInput>,
		primary: Input.PrimaryValue,
	) {
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

	public async connectOrCreate(
		context: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, CreateInputProcessor.ConnectOrCreateInput>,
		primary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		let otherPrimary = await this.mapper.getPrimaryValue(context.targetEntity, context.input.connect)
		if (!otherPrimary) {
			const insertResult = await this.mapper.insert(context.targetEntity, context.input.create)
			otherPrimary = getInsertPrimary(insertResult)
			if (!otherPrimary) {
				return insertResult
			}
		}
		return await this.mapper.connectJunction(context.entity, context.relation, primary, otherPrimary)
	}

	public async update(
		{ entity, targetEntity, relation, input: { where, data } }: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, UpdateInputProcessor.UpdateManyInput>,
		primary: Input.PrimaryValue,
	) {
		const otherPrimary = await this.mapper.getPrimaryValue(targetEntity, where)
		if (!otherPrimary) {
			return [new MutationEntryNotFoundError([], where)]
		}
		return [
			...(await this.mapper.update(targetEntity, { [targetEntity.primary]: otherPrimary }, data)),
			...(await this.mapper.connectJunction(entity, relation, primary, otherPrimary)),
		]
	}

	public async upsert(
		{ entity, relation, targetEntity, input: { create, update, where } }: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, UpdateInputProcessor.UpsertManyInput>,
		primary: Input.PrimaryValue,
	) {
		const otherPrimary = await this.mapper.getPrimaryValue(targetEntity, where)
		if (otherPrimary) {
			const updateResult = await this.mapper.update(targetEntity, { [targetEntity.primary]: otherPrimary }, update)
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

	public async disconnect(
		{ entity, targetEntity, relation, input }: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, Input.UniqueWhere>,
		primary: Input.PrimaryValue,
	) {
		const otherPrimary = await this.mapper.getPrimaryValue(targetEntity, input)
		if (!otherPrimary) {
			return [new MutationEntryNotFoundError([], input)]
		}

		return await this.mapper.disconnectJunction(entity, relation, primary, otherPrimary)
	}

	public async delete(
		{ entity, targetEntity, relation, targetRelation, input }: ContextWithInput<ManyHasManyOwningContext | ManyHasManyInverseContext, Input.UniqueWhere>,
		primary: Input.PrimaryValue,
	) {
		return await this.mapper.delete(targetEntity, input)
	}
}
