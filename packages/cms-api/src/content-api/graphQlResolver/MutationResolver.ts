import { Input, Model } from 'cms-common'
import { GraphQLError } from 'graphql'
import { isUniqueWhere } from '../../content-schema/inputUtils'
import ObjectNode from './ObjectNode'
import UniqueWhereExpander from './UniqueWhereExpander'
import MapperRunner from "../sql/MapperRunner";

export default class MutationResolver {
	constructor(
		private readonly mapperRunner: MapperRunner,
		private readonly uniqueWhereExpander: UniqueWhereExpander
	) {
	}

	public async resolveUpdate(entity: Model.Entity, queryAst: ObjectNode<Input.UpdateInput>) {
		if (!isUniqueWhere(entity, queryAst.args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('where', whereExpanded)

		return await this.mapperRunner.run(async mapper => {
			await mapper.update(entity, queryAst.args.where, queryAst.args.data)

			return (await mapper.select(entity, queryExpanded))[0] || null
		})
	}

	public async resolveCreate(entity: Model.Entity, queryAst: ObjectNode<Input.CreateInput>) {

		return await this.mapperRunner.run(async mapper => {
			const primary = await mapper.insert(entity, queryAst.args.data)

			const whereArgs = {where: {[entity.primary]: {eq: primary}}}
			const objectWithArgs = new ObjectNode<Input.ListQueryInput>(
				queryAst.name,
				queryAst.alias,
				queryAst.fields,
				whereArgs
			)

			return (await mapper.select(entity, objectWithArgs))[0] || null
		})
	}

	public async resolveDelete(entity: Model.Entity, queryAst: ObjectNode<Input.DeleteInput>) {
		if (!isUniqueWhere(entity, queryAst.args.where)) {
			throw new GraphQLError('Input where is not unique')
		}
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('where', whereExpanded)

		return await this.mapperRunner.run(async mapper => {
			const result = (await mapper.select(entity, queryExpanded))[0] || null

			await mapper.delete(entity, queryAst.args.where)

			return result
		})
	}
}
