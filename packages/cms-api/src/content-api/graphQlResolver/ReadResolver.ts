import { Input, Model } from 'cms-common'
import UniqueWhereExpander from './UniqueWhereExpander'
import ObjectNode from './ObjectNode'
import MapperRunner from '../sql/MapperRunner'

export default class ReadResolver {
	constructor(private readonly mapperRunner: MapperRunner, private readonly uniqueWhereExpander: UniqueWhereExpander) {}

	public async resolveListQuery(entity: Model.Entity, queryAst: ObjectNode<Input.ListQueryInput>) {
		return await this.mapperRunner.run(async mapper => {
			return await mapper.select(entity, queryAst)
		})
	}

	public async resolveGetQuery(entity: Model.Entity, queryAst: ObjectNode<Input.UniqueQueryInput>) {
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.where)
		const queryExpanded = new ObjectNode(queryAst.name, queryAst.alias, queryAst.fields, {
			...queryAst.args,
			where: whereExpanded
		})

		return await this.mapperRunner.run(async mapper => {
			return (await mapper.select(entity, queryExpanded))[0] || null
		})
	}
}
