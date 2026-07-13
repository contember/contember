import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result.js'
import { MutationAccess } from '../../MutationAccess.js'
import { CreateInputProcessor } from '../../../inputProcessing/index.js'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor.js'
import { InsertBuilder } from '../InsertBuilder.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'

type Context = Model.ManyHasOneContext

export class ManyHasOneCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult> {
	constructor(
		private readonly mapper: MutationAccess,
		private readonly insertBuilder: InsertBuilder,
	) {
	}
	public async connect(
		context: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		const { targetEntity, relation, input } = context
		const [value, err] = await this.mapper.through(context).getPrimaryValue(targetEntity, input)
		if (err) return [err]
		this.insertBuilder.addFieldValue(relation.name, value)
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
		this.insertBuilder.addFieldValue(relation.name, value)
		return []
	}

	public async connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		const { input: { connect, create }, relation, targetEntity } = context
		const targetAccess = this.mapper.through(context)
		const [value] = await targetAccess.getPrimaryValue(targetEntity, connect)
		if (value) {
			this.insertBuilder.addFieldValue(relation.name, value)
		} else {
			const insertResult = await targetAccess.insert(targetEntity, create)
			const primary = getInsertPrimary(insertResult)
			if (!primary) {
				return insertResult
			}

			this.insertBuilder.addFieldValue(relation.name, primary)
		}
		return []
	}
}
