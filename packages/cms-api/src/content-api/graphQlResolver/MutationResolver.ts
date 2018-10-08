import { Input, Model } from 'cms-common'
import { GraphQLError } from 'graphql'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import ObjectNode from './ObjectNode'
import UniqueWhereExpander from './UniqueWhereExpander'
import Mapper from '../sql/Mapper'
import { UserError } from 'graphql-errors'

export default class MutationResolver {
	constructor(private readonly mapper: Mapper, private readonly uniqueWhereExpander: UniqueWhereExpander) {}

	public async resolveUpdate(entity: Model.Entity, queryAst: ObjectNode<Input.UpdateInput>) {
		if (!isUniqueWhere(entity, queryAst.args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('where', whereExpanded)

		try {
			await this.mapper.update(entity, queryAst.args.where, queryAst.args.data)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		return (await this.mapper.select(entity, queryExpanded))[0] || null
	}

	public async resolveCreate(entity: Model.Entity, queryAst: ObjectNode<Input.CreateInput>) {
		let primary: Input.PrimaryValue
		try {
			primary = await this.mapper.insert(entity, queryAst.args.data)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		const whereArgs = { where: { [entity.primary]: { eq: primary } } }
		const objectWithArgs = queryAst.withArgs(whereArgs)

		return (await this.mapper.select(entity, objectWithArgs))[0] || null
	}

	public async resolveDelete(entity: Model.Entity, queryAst: ObjectNode<Input.DeleteInput>) {
		if (!isUniqueWhere(entity, queryAst.args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('where', whereExpanded)

		const result = (await this.mapper.select(entity, queryExpanded))[0] || null

		try {
			await this.mapper.delete(entity, queryAst.args.where)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		return result
	}
}
