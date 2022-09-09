import { QueryAstFactory } from './QueryAstFactory'
import { Mapper } from '../mapper'
import { Dependencies } from './dependencies'
import { Input, Model, Value } from '@contember/schema'

export class ValidationDataSelector {
	constructor(private readonly model: Model.Schema, private readonly queryAstFactory: QueryAstFactory) {}

	public async getPrimaryValue(mapper: Mapper, entity: Model.Entity, where: Input.UniqueWhere) {
		return mapper.getPrimaryValue(entity, where)
	}

	public async select(
		mapper: Mapper,
		entity: Model.Entity,
		where: Input.UniqueWhere,
		dependencies: Dependencies,
	): Promise<Value.Object | null> {
		if (Object.keys(dependencies).length === 0) {
			return {}
		}
		const queryAst = this.queryAstFactory.create(entity.name, dependencies).withArg('by', where)
		const node = await mapper.selectUnique(entity, queryAst, [])
		if (!node) {
			return null
		}

		return node
	}
}
