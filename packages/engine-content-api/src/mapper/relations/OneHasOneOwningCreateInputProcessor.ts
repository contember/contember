import { ContextWithInput, CreateInputProcessor, OneHasOneOwningContext } from '../../inputProcessing'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationResultList,
} from '../Result'
import { InsertBuilder } from '../insert/InsertBuilder'
import { Mapper } from '../Mapper'
import { Input } from '@contember/schema'
import { AbortDataManipulation } from '../DataManipulationBuilder'

export class OneHasOneOwningCreateInputProcessor {
	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, relation, targetEntity, targetRelation, input }: ContextWithInput<OneHasOneOwningContext, Input.UniqueWhere>,
	) {
		const result: MutationResultList = []
		await this.insertBuilder.addFieldValue(relation.name, async () => {
			const inverseSide = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!inverseSide) {
				result.push(new MutationEntryNotFoundError([], input))
				return AbortDataManipulation
			}
			return this.connectInternal({ entity, relation, targetEntity, targetRelation, input: inverseSide }, result)
		})
		return result
	}

	public async create(context: ContextWithInput<OneHasOneOwningContext, Input.CreateDataInput>) {
		const result: MutationResultList = []
		await this.insertBuilder.addFieldValue(context.relation.name, async () => {
			return await this.createInternal(context, result)
		})
		return result
	}

	public async connectOrCreate(
		{ entity, relation, targetEntity, targetRelation, input }: ContextWithInput<OneHasOneOwningContext, CreateInputProcessor.ConnectOrCreateInput>,
	) {
		const result: MutationResultList = []
		await this.insertBuilder.addFieldValue(relation.name, async () => {
			const inverseSide = await this.mapper.getPrimaryValue(targetEntity, input.connect)
			if (inverseSide) {
				return await this.connectInternal({ entity, relation, targetEntity, targetRelation, input: inverseSide }, result)
			}
			return await this.createInternal({ entity, relation, targetEntity, targetRelation, input: input.create }, result)
		})
		return result
	}

	private async createInternal(
		context: ContextWithInput<OneHasOneOwningContext, Input.CreateDataInput>,
		result: MutationResultList,
	) {
		const insertResult = await this.mapper.insert(context.targetEntity, context.input)
		result.push(...insertResult)
		const primary = getInsertPrimary(insertResult)
		if (!primary) {
			return AbortDataManipulation
		}
		return primary
	}

	private async connectInternal(
		{ entity, relation, targetEntity, input }: ContextWithInput<OneHasOneOwningContext, Input.PrimaryValue>,
		result: MutationResultList,
	) {
		const currentOwnerOfInverseSide = await this.mapper.getPrimaryValue(entity, {
			[relation.name]: { [targetEntity.primary]: input },
		})
		if (!currentOwnerOfInverseSide) {
			return input
		}

		if (!relation.nullable) {
			result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
			return AbortDataManipulation
		}

		const currentOwnerUnique = { [entity.primary]: currentOwnerOfInverseSide }
		const currentOwnerDisconnectResult = await this.mapper.updateInternal(entity, currentOwnerUnique, builder => {
			builder.addPredicates([relation.name])
			builder.addFieldValue(relation.name, null)
		})
		result.push(...currentOwnerDisconnectResult)

		return input
	}
}
