import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql'
import { Input, Model } from 'cms-common'
import { getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import ColumnTypeResolver from './ColumnTypeResolver'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import EntityInputProvider from './mutations/EntityInputProvider'
import MutationResolver from '../graphQlResolver/MutationResolver'

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider {
	constructor(
		private schema: Model.Schema,
		private authorizator: Authorizator,
		private whereTypeProvider: WhereTypeProvider,
		private entityTypeProvider: EntityTypeProvider,
		private columnTypeResolver: ColumnTypeResolver,
		private createEntityInputProvider: EntityInputProvider<Authorizator.Operation.create>,
		private updateEntityInputProvider: EntityInputProvider<Authorizator.Operation.update>,
		private readonly mutationResolver: MutationResolver
	) {}

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
				data: { type: new GraphQLNonNull(this.createEntityInputProvider.getInput(entityName)) }
			},
			resolve: this.mutationResolver.resolveCreate(entity)
		}
	}

	private getDeleteMutation(entityName: string): FieldConfig<Input.DeleteInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				where: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) }
			},
			resolve: this.mutationResolver.resolveDelete(entity)
		}
	}

	public getUpdateMutation(entityName: string): FieldConfig<Input.UpdateInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: this.entityTypeProvider.getEntity(entityName),
			args: {
				where: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) },
				data: { type: new GraphQLNonNull(this.updateEntityInputProvider.getInput(entityName)) }
			},
			resolve: this.mutationResolver.resolveUpdate(entity)
		}
	}
}
