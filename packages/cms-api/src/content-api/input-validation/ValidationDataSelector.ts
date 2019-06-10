import QueryAstFactory from './QueryAstFactory'
import Mapper from '../sql/Mapper'
import DependencyCollector from './DependencyCollector'
import { Input, Model, Value } from 'cms-common'

export default class ValidationDataSelector {
	constructor(
		private readonly model: Model.Schema,
		private readonly queryAstFactory: QueryAstFactory,
		private readonly mapper: Mapper
	) {}

	public async getPrimaryValue(entity: Model.Entity, where: Input.UniqueWhere) {
		return this.mapper.getPrimaryValue(entity, where)
	}

	public async select(
		entity: Model.Entity,
		where: Input.UniqueWhere,
		dependencies: DependencyCollector.Dependencies
	): Promise<Value.Object | null> {
		const queryAst = this.queryAstFactory.create(entity.name, dependencies).withArg('by', where)
		return this.mapper.selectUnique(entity, queryAst)
	}
}
