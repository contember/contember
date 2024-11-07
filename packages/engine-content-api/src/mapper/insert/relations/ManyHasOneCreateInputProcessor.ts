import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result'
import { Mapper } from '../../Mapper'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'
import { InsertBuilder } from '../InsertBuilder'

type Context = Model.ManyHasOneContext

export class ManyHasOneCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult>  {

	constructor(
		private readonly mapper: Mapper,
		private readonly insertBuilder: InsertBuilder,
	) {
	}
	public async connect(
		{ targetEntity, relation, input }: Context & { input: Input.UniqueWhere },
	) {
		const value = await this.mapper.getPrimaryValue(targetEntity, input)
		if (!value) {
			return [new MutationEntryNotFoundError([], input)]
		}
		this.insertBuilder.addFieldValue(relation.name, value)
		return []
	}

	public async create(
		{ relation, targetEntity, input }: Context & { input: Input.CreateDataInput },
	) {
		const insertResult = await this.mapper.insert(targetEntity, input)
		const value = getInsertPrimary(insertResult)
		if (!value) {
			return insertResult
		}
		this.insertBuilder.addFieldValue(relation.name, value)
		return []
	}

	public async connectOrCreate(
		{ input: { connect, create }, relation, targetEntity }: Context & { input: Input.ConnectOrCreateInput },
	) {
		const value = await this.mapper.getPrimaryValue(targetEntity, connect)
		if (value) {
			this.insertBuilder.addFieldValue(relation.name, value)
		} else {
			const insertResult = await this.mapper.insert(targetEntity, create)
			const primary = getInsertPrimary(insertResult)
			if (!primary) {
				return insertResult
			}

			this.insertBuilder.addFieldValue(relation.name, primary)
		}
		return []
	}
}
