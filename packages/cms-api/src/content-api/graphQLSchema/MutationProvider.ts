import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql'
import { Acl, Input, Model } from 'cms-common'
import { getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import ColumnTypeResolver from './ColumnTypeResolver'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import EntityInputProvider from './mutations/EntityInputProvider'
import MutationResolverFactory from '../graphQlResolver/MutationResolverFactory'
import GraphQlQueryAstFactory from '../graphQlResolver/GraphQlQueryAstFactory'
import { filterObject } from '../../utils/object'

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.update>,
		private readonly queryAstAFactory: GraphQlQueryAstFactory,
	) {}

	public getMutations(entityName: string): { [fieldName: string]: FieldConfig<any> } {
		const mutations: { [fieldName: string]: FieldConfig<any> | undefined } = {}
		mutations[`create${entityName}`] = this.getCreateMutation(entityName)
		mutations[`delete${entityName}`] = this.getDeleteMutation(entityName)
		mutations[`update${entityName}`] = this.getUpdateMutation(entityName)

		return filterObject<FieldConfig<any>, FieldConfig<any> | undefined>(
			mutations,
			(key, value): value is FieldConfig<any> => value !== undefined
		)
	}

	private getCreateMutation(entityName: string): FieldConfig<Input.CreateInput> | undefined {
		const entity = getEntity(this.schema, entityName)
		const dataType = this.createEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(this.entityTypeProvider.getEntity(entityName)),
			args: {
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.executionContainer.get('mutationResolver').resolveCreate(entity, this.queryAstAFactory.create(info)),
		}
	}

	private getDeleteMutation(entityName: string): FieldConfig<Input.DeleteInput> | undefined {
		if (!this.authorizator.isAllowed(Acl.Operation.delete, entityName)) {
			return undefined
		}
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				by: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.executionContainer.get('mutationResolver').resolveDelete(entity, this.queryAstAFactory.create(info)),
		}
	}

	public getUpdateMutation(entityName: string): FieldConfig<Input.UpdateInput> | undefined {
		const entity = getEntity(this.schema, entityName)
		const dataType = this.updateEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				by: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) },
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.executionContainer.get('mutationResolver').resolveUpdate(entity, this.queryAstAFactory.create(info)),
		}
	}
}
