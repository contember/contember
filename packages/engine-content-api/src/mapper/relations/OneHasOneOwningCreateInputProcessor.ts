import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationResultList,
} from '../Result'
import { InsertBuilder } from '../insert/InsertBuilder'
import { Mapper } from '../Mapper'
import { Input, Model } from '@contember/schema'
import { AbortDataManipulation } from '../DataManipulationBuilder'
import { UpdateInputProcessor } from '../../inputProcessing'

export class OneHasOneOwningCreateInputProcessor {
	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
	) {
	}

	public async connect(context: UpdateInputProcessor.ContextWithInput<Model.OneHasOneOwningContext, Input.UniqueWhere>) {
		const { input, relation, targetEntity } = context
		const result: MutationResultList = []
		await this.insertBuilder.addFieldValue(relation.name, async () => {
			const inverseSide = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!inverseSide) {
				result.push(new MutationEntryNotFoundError([], input))
				return AbortDataManipulation
			}
			return this.connectInternal({ ...context, input: inverseSide }, result)
		})
		return result
	}

	public async create(context: UpdateInputProcessor.ContextWithInput<Model.OneHasOneOwningContext, Input.CreateDataInput>) {
		const result: MutationResultList = []
		await this.insertBuilder.addFieldValue(context.relation.name, async () => {
			return await this.createInternal(context, result)
		})
		return result
	}

	private async createInternal(
		context: UpdateInputProcessor.ContextWithInput<Model.OneHasOneOwningContext, Input.CreateDataInput>,
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
		{ entity, relation, targetEntity, input }: UpdateInputProcessor.ContextWithInput<Model.OneHasOneOwningContext, Input.PrimaryValue>,
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
