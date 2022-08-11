import { ContextWithInput, CreateInputProcessor, OneHasOneInverseContext } from '../../inputProcessing'
import { InsertBuilder } from '../insert/InsertBuilder'
import { Mapper } from '../Mapper'
import {
	ConstraintType,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationResultList,
} from '../Result'
import { CheckedPrimary } from '../CheckedPrimary'
import { Input } from '@contember/schema'

export class OneHasOneInverseCreateInputProcessor {
	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
	) {
	}

	public async connect(
		{ entity, targetEntity, targetRelation, relation, input }: ContextWithInput<OneHasOneInverseContext, Input.UniqueWhere>,
	) {
		const primary = await this.insertBuilder.insert
		if (!primary) {
			return []
		}
		const owner = await this.mapper.getPrimaryValue(targetEntity, input)
		if (!owner) {
			return [new MutationEntryNotFoundError([], input)]
		}

		return await this.connectInternal({ targetEntity, input: new CheckedPrimary(owner), targetRelation, entity, relation }, primary)
	}


	public async create(
		context: ContextWithInput<OneHasOneInverseContext, Input.CreateDataInput>,
	) {
		const primary = await this.insertBuilder.insert
		if (!primary) {
			return []
		}
		return await this.mapper.insert(context.targetEntity, context.input, builder => {
			builder.addPredicates([context.targetRelation.name])
			builder.addFieldValue(context.targetRelation.name, primary)
		})
	}

	private async connectInternal(
		{ entity, targetEntity, targetRelation, relation, input }: ContextWithInput<OneHasOneInverseContext, CheckedPrimary>,
		primary: Input.PrimaryValue,
	) {

		const currentInverseSideOfOwner = await this.mapper.selectField(targetEntity, input, targetRelation.name)
		const orphanResult: MutationResultList = []
		if (currentInverseSideOfOwner) {
			if (targetRelation.orphanRemoval) {
				const orphanUnique = { [entity.primary]: currentInverseSideOfOwner }
				const orphanDelete = await this.mapper.delete(entity, orphanUnique)
				orphanResult.push(...orphanDelete)
			} else if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
		}

		const connectResult = await this.mapper.updateInternal(targetEntity, input, update => {
			update.addPredicates([targetRelation.name])
			update.addFieldValue(targetRelation.name, primary)
		})

		return [
			...connectResult,
			...orphanResult,
		]
	}

	private async createInternal(
		context: ContextWithInput<OneHasOneInverseContext, Input.CreateDataInput>,
		primary: Input.PrimaryValue,
	) {
		return await this.mapper.insert(context.targetEntity, context.input, builder => {
			builder.addPredicates([context.targetRelation.name])
			builder.addFieldValue(context.targetRelation.name, primary)
		})
	}
}
