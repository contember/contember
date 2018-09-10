import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql'
import { Input, Model } from 'cms-common'
import { getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import ColumnTypeResolver from './ColumnTypeResolver'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import EntityInputProvider from './mutations/EntityInputProvider'
import MutationResolverFactory from "../graphQlResolver/MutationResolverFactory";
import GraphQlQueryAstFactory from "../graphQlResolver/GraphQlQueryAstFactory";

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider {
	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityInputProvider: EntityInputProvider<Authorizator.Operation.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<Authorizator.Operation.update>,
		private readonly queryAstAFactory: GraphQlQueryAstFactory,
		private readonly mutationResolverFactory: MutationResolverFactory,
	) {
	}

	public getMutations(entityName: string): { [fieldName: string]: FieldConfig<any> } {
		const mutations: { [fieldName: string]: FieldConfig<any> } = {}
		if (this.authorizator.isAllowed(Authorizator.Operation.create, entityName)) {
			mutations[`create${entityName}`] = this.getCreateMutation(entityName)
		}
		if (this.authorizator.isAllowed(Authorizator.Operation.delete, entityName)) {
			mutations[`delete${entityName}`] = this.getDeleteMutation(entityName)
		}
		if (this.authorizator.isAllowed(Authorizator.Operation.update, entityName)) {
			mutations[`update${entityName}`] = this.getUpdateMutation(entityName)
		}

		return mutations
	}

	private getCreateMutation(entityName: string): FieldConfig<Input.CreateInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: new GraphQLNonNull(this.entityTypeProvider.getEntity(entityName)),
			args: {
				data: {type: new GraphQLNonNull(this.createEntityInputProvider.getInput(entityName))}
			},
			resolve: (parent, args, context, info) =>
				this.mutationResolverFactory.create(context).resolveCreate(entity, this.queryAstAFactory.create(info))
		}
	}

	private getDeleteMutation(entityName: string): FieldConfig<Input.DeleteInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				where: {type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName))}
			},
			resolve: (parent, args, context, info) =>
				this.mutationResolverFactory.create(context).resolveDelete(entity, this.queryAstAFactory.create(info))
		}
	}

	public getUpdateMutation(entityName: string): FieldConfig<Input.UpdateInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				where: {type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName))},
				data: {type: new GraphQLNonNull(this.updateEntityInputProvider.getInput(entityName))}
			},
			resolve: (parent, args, context, info) =>
				this.mutationResolverFactory.create(context).resolveUpdate(entity, this.queryAstAFactory.create(info))
		}
	}
}
