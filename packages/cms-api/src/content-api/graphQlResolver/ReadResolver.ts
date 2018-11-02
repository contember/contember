import { Input, Model } from 'cms-common'
import UniqueWhereExpander from './UniqueWhereExpander'
import ObjectNode from './ObjectNode'
import Mapper from '../sql/Mapper'

export default class ReadResolver {
	constructor(private readonly mapper: Mapper, private readonly uniqueWhereExpander: UniqueWhereExpander) {}

	public async resolveListQuery(entity: Model.Entity, queryAst: ObjectNode<Input.ListQueryInput>) {
		return await this.mapper.select(entity, queryAst)
	}

	public async resolveGetQuery(entity: Model.Entity, queryAst: ObjectNode<Input.UniqueQueryInput>) {
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.by)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('filter', whereExpanded)

		return (await this.mapper.select(entity, queryExpanded))[0] || null
	}
}
