import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationResultList,
} from '../../Result'
import { InsertBuilder } from '../../insert'
import { Mapper } from '../../Mapper'
import { Input, Model } from '@contember/schema'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'
import { CheckedPrimary } from '../../CheckedPrimary'
import { MapperInput } from '../../types'

type Context = Model.OneHasOneOwningContext

export class OneHasOneOwningCreateInputProcessor implements CreateInputProcessor.HasOneRelationProcessor<Context, SqlCreateInputProcessorResult>{
	constructor(
		private readonly mapper: Mapper,
		private readonly insertBuilder: InsertBuilder,
	) {
	}

	public async connect(context: Context & { input: Input.UniqueWhere | CheckedPrimary }) {
		const { input, relation, targetEntity } = context
		const [inverseSide, err] = await this.mapper.getPrimaryValue(targetEntity, input)
		if (err) return [err]
		const disconnectResult = await this.disconnectCurrentOwner({ ...context, input: inverseSide })
		if (disconnectResult.some(it => it.error)) {
			return disconnectResult
		}
		this.insertBuilder.addFieldValue(relation.name, inverseSide)
		return disconnectResult
	}

	public async create(context: Context & { input: MapperInput.CreateDataInput }) {
		const insertResult = await this.mapper.insert(context.targetEntity, context.input)
		const primary = getInsertPrimary(insertResult)
		if (!primary) {
			return insertResult
		}
		this.insertBuilder.addFieldValue(context.relation.name, primary)
		return []
	}

	public async connectOrCreate({ input, ...context }: Context & { input: MapperInput.ConnectOrCreateInput }) {
		const [inverseSide] = await this.mapper.getPrimaryValue(context.targetEntity, input.connect)
		if (inverseSide) {
			this.insertBuilder.addFieldValue(context.relation.name, inverseSide)
			const disconnectResult = await this.disconnectCurrentOwner({ ...context, input: inverseSide })
			if (disconnectResult.some(it => it.error)) {
				return disconnectResult
			}
			return []

		} else {
			const insertResult = await this.mapper.insert(context.targetEntity, input.create)
			const primary = getInsertPrimary(insertResult)
			if (primary) {
				this.insertBuilder.addFieldValue(context.relation.name, primary)
			}
			return insertResult
		}
	}

	private async disconnectCurrentOwner(
		{ entity, relation, targetEntity, input }: Context & { input: Input.PrimaryValue },
	): Promise<MutationResultList> {
		const [currentOwnerOfInverseSide] = await this.mapper.getPrimaryValue(entity, {
			[relation.name]: { [targetEntity.primary]: input },
		})
		if (!currentOwnerOfInverseSide) {
			return []
		}

		if (!relation.nullable) {
			return [new MutationConstraintViolationError([], ConstraintType.notNull)]
		}

		const currentOwnerUnique = { [entity.primary]: currentOwnerOfInverseSide }
		return await this.mapper.updateInternal(entity, currentOwnerUnique, builder => {
			builder.addPredicates([relation.name])
			builder.addFieldValue(relation.name, null)
		})
	}
}
