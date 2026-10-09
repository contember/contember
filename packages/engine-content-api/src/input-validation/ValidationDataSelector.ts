import { QueryAstFactory } from './QueryAstFactory.js'
import { Mapper } from '../mapper/index.js'
import { Dependencies } from './dependencies/index.js'
import { Input, Model, Value } from '@contember/schema'
import { AclScope } from '../acl/index.js'

export class ValidationDataSelector {
	constructor(private readonly model: Model.Schema, private readonly queryAstFactory: QueryAstFactory) {}

	public async getPrimaryValue(mapper: Mapper, entity: Model.Entity, where: Input.UniqueWhere, scope: AclScope) {
		return mapper.getPrimaryValue(entity, where, scope)
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
