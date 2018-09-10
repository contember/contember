import { Input, Model } from 'cms-common'
import PredicatesInjector from '../../acl/PredicatesInjector'
import UniqueWhereExpander from './UniqueWhereExpander'
import ObjectNode from './ObjectNode'
import MapperRunner from "../sql/MapperRunner"

export default class ReadResolver {
	constructor(
		private readonly mapperRunner: MapperRunner,
		private readonly predicatesInjector: PredicatesInjector,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
	) {
	}

	public async resolveListQuery(entity: Model.Entity, queryAst: ObjectNode<Input.ListQueryInput>) {
		const queryWithPredicates = this.predicatesInjector.inject(entity, queryAst)

		return await this.mapperRunner.run(async mapper => {
			return await mapper.select(entity, queryWithPredicates)
		})
	}

	public async resolveGetQuery(entity: Model.Entity, queryAst: ObjectNode<Input.UniqueQueryInput>) {
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.where)
		const queryExpanded = new ObjectNode(queryAst.name, queryAst.alias, queryAst.fields, {
			...queryAst.args,
			where: whereExpanded
		})
		const queryExpandedWithPredicates = this.predicatesInjector.inject(entity, queryExpanded)

		return await this.mapperRunner.run(async mapper => {
			return (await mapper.select(entity, queryExpandedWithPredicates))[0] || null
		})
	}
}
