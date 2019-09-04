import { Input, Model } from '@contember/schema'
import UniqueWhereExpander from './UniqueWhereExpander'
import ObjectNode from './ObjectNode'
import Mapper from '../sql/Mapper'

export default class ReadResolver {
	constructor(private readonly mapper: Mapper, private readonly uniqueWhereExpander: UniqueWhereExpander) {}

	public async resolveListQuery(entity: Model.Entity, queryAst: ObjectNode<Input.ListQueryInput>) {
		return await this.mapper.select(entity, queryAst)
	}

	public async resolveGetQuery(entity: Model.Entity, queryAst: ObjectNode<Input.UniqueQueryInput>) {
		return this.mapper.selectUnique(entity, queryAst)
	}
}
