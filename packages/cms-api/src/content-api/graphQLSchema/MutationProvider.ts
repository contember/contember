import {
	GraphQLBoolean,
	GraphQLFieldConfig,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
	GraphQLUnionType,
} from 'graphql'
import { Acl, Input, Model } from 'cms-common'
import { getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import ColumnTypeResolver from './ColumnTypeResolver'
import EntityTypeProvider from './EntityTypeProvider'
import WhereTypeProvider from './WhereTypeProvider'
import Authorizator from '../../acl/Authorizator'
import EntityInputProvider from './mutations/EntityInputProvider'
import GraphQlQueryAstFactory from '../graphQlResolver/GraphQlQueryAstFactory'
import { filterObject } from '../../utils/object'
import { aliasAwareResolver, GqlTypeName } from './utils'

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider {
	private static pathFragmentType = new GraphQLUnionType({
		name: '_PathFragment',
		types: () => [
			new GraphQLObjectType({
				name: '_FieldPathFragment',
				fields: {
					field: { type: new GraphQLNonNull(GraphQLString) },
				},
			}),
			new GraphQLObjectType({
				name: '_IndexPathFragment',
				fields: {
					index: { type: new GraphQLNonNull(GraphQLInt) },
				},
			}),
		],
	})
	private static validationErrorType = new GraphQLObjectType({
		name: '_ValidationError',
		fields: {
			path: {
				type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MutationProvider.pathFragmentType))),
			},
			message: {
				type: new GraphQLNonNull(
					new GraphQLObjectType({
						name: '_ValidationMessage',
						fields: {
							text: { type: new GraphQLNonNull(GraphQLString) },
						},
					})
				),
			},
		},
	})
	private static validationResultType = new GraphQLObjectType({
		name: '_ValidationResult',
		fields: {
			valid: { type: new GraphQLNonNull(GraphQLBoolean) },
			errors: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MutationProvider.validationErrorType))) },
		},
	})

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly columnTypeResolver: ColumnTypeResolver,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.update>,
		private readonly queryAstAFactory: GraphQlQueryAstFactory
	) {}

	public getMutations(entityName: string): { [fieldName: string]: FieldConfig<any> } {
		const mutations: { [fieldName: string]: FieldConfig<any> | undefined } = {}
		mutations[`create${entityName}`] = this.getCreateMutation(entityName)
		mutations[`delete${entityName}`] = this.getDeleteMutation(entityName)
		mutations[`update${entityName}`] = this.getUpdateMutation(entityName)

		return filterObject(mutations, (key, value): value is FieldConfig<any> => value !== undefined)
	}

	private getCreateMutation(entityName: string): FieldConfig<Input.CreateInput> | undefined {
		const entity = getEntity(this.schema, entityName)
		const dataType = this.createEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		const resultType = this.createResultType(entityName, 'create')
		return {
			type: new GraphQLNonNull(resultType),
			args: {
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.executionContainer.get('mutationResolver').resolveCreate(
					entity,
					args,
					this.queryAstAFactory.create(info, (node, path) => {
						return path.length !== 1 || node.name.value === 'node'
					})
				),
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
		const resultType = this.createResultType(entityName, 'update')
		return {
			type: new GraphQLNonNull(resultType),
			args: {
				by: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) },
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.executionContainer.get('mutationResolver').resolveUpdate(
					entity,
					args,
					this.queryAstAFactory.create(info, (node, path) => {
						return path.length !== 1 || node.name.value === 'node'
					})
				),
		}
	}

	private createResultType(entityName: string, operation: string): GraphQLObjectType {
		const nodeType = this.entityTypeProvider.getEntity(entityName)
		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}${operation}Result`,
			fields: {
				ok: { type: new GraphQLNonNull(GraphQLBoolean) },
				validation: { type: new GraphQLNonNull(MutationProvider.validationResultType) },
				node: { type: nodeType, resolve: aliasAwareResolver },
			},
		})
	}
}
