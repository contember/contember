import { Input, Model } from '@contember/schema'
import { getInsertPrimary, MutationEntryNotFoundError } from '../../Result'
import { Mapper } from '../../Mapper'
import { CreateInputProcessor } from '../../../inputProcessing'
import { SqlCreateInputProcessorResult } from '../SqlCreateInputProcessor'
import { InsertBuilder } from '../InsertBuilder'
import { CheckedPrimary } from '../../CheckedPrimary'
import { MapperInput } from '../../types'

type Context = Model.ManyHasOneContext

export class ManyHasOneCreateInputProcessor implements CreateInputProcessor.HasManyRelationProcessor<Context, SqlCreateInputProcessorResult>  {

	constructor(
		private readonly mapper: Mapper,
		private readonly insertBuilder: InsertBuilder,
	) {
	}
	public async connect(
		{ targetEntity, relation, input }: Context & { input: Input.UniqueWhere | CheckedPrimary },
	) {
		const [value, err] = await this.mapper.getPrimaryValue(targetEntity, input)
		if (err) return [err]
		this.insertBuilder.addFieldValue(relation.name, value)
		return []
	}

	public async create(
		{ relation, targetEntity, input }: Context & { input: MapperInput.CreateDataInput },
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
		{ input: { connect, create }, relation, targetEntity }: Context & { input: MapperInput.ConnectOrCreateInput },
	) {
		const [value] = await this.mapper.getPrimaryValue(targetEntity, connect)
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
