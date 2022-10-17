import {
	GraphQLBoolean,
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLString,
} from 'graphql'
import { Acl, Input, Model } from '@contember/schema'
import { Context } from '../types'
import { EntityTypeProvider } from './EntityTypeProvider'
import { WhereTypeProvider } from './WhereTypeProvider'
import { Authorizator } from '../acl'
import { EntityInputProvider, EntityInputType } from './mutations'
import { filterObject } from '../utils'
import { aliasAwareResolver, GqlTypeName } from './utils'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider'
import { ExtensionKey, Operation, OperationMeta } from './OperationExtension'

type FieldConfig<TArgs> = GraphQLFieldConfig<any, Context, TArgs>

export class MutationProvider {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputType.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<EntityInputType.update>,
		private readonly resultSchemaTypeProvider: ResultSchemaTypeProvider,
	) {}

	public getMutations(entity: Model.Entity): { [fieldName: string]: FieldConfig<any> } {
		const entityName = entity.name
		const mutations: { [fieldName: string]: FieldConfig<any> | undefined } = {}
		mutations[`create${entityName}`] = this.getCreateMutation(entity)
		mutations[`delete${entityName}`] = this.getDeleteMutation(entity)
		mutations[`update${entityName}`] = this.getUpdateMutation(entity)
		mutations[`upsert${entityName}`] = this.getUpsertMutation(entity)

		return filterObject(mutations, (key, value): value is FieldConfig<any> => value !== undefined)
	}

	protected getCreateMutation(entity: Model.Entity): FieldConfig<Input.CreateInput> | undefined {
		const entityName = entity.name
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
			extensions: { [ExtensionKey]: new OperationMeta(Operation.create, entity) },
			resolve: (parent, args, context: Context, info) => {
				return context.timer(`GraphQL.mutation.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.mutationResolver.resolveCreate(entity, info)
				})
			},
		}
	}

	protected getDeleteMutation(entity: Model.Entity): FieldConfig<Input.DeleteInput> | undefined {
		const entityName = entity.name
		if (entity.view) {
			return undefined
		}
		if (this.authorizator.getEntityPermission(Acl.Operation.delete, entityName) === 'no') {
			return undefined
		}
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(this.createResultType(entityName, 'delete')),
			args: {
				by: {
					type: new GraphQLNonNull(uniqueWhere),
				},
				filter: {
					type: this.whereTypeProvider.getEntityWhereType(entityName),
				},
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.delete, entity) },
			resolve: (parent, args, context: Context, info) => {
				return context.timer(`GraphQL.mutation.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.mutationResolver.resolveDelete(entity, info)
				})
			},
		}
	}

	protected getUpdateMutation(entity: Model.Entity): FieldConfig<Input.UpdateInput> | undefined {
		const entityName = entity.name
		const dataType = this.updateEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		const resultType = this.createResultType(entityName, 'update')
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(resultType),
			args: {
				by: {
					type: new GraphQLNonNull(uniqueWhere),
				},
				filter: {
					type: this.whereTypeProvider.getEntityWhereType(entityName),
				},
				data: { type: new GraphQLNonNull(dataType) },
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.update, entity) },
			resolve: (parent, args, context: Context, info) => {
				return context.timer(`GraphQL.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.mutationResolver.resolveUpdate(entity, info)
				})
			},
		}
	}

	private getUpsertMutation(entity: Model.Entity): FieldConfig<Input.UpsertInput> | undefined {
		const entityName = entity.name
		const createInput = this.createEntityInputProvider.getInput(entityName)
		if (createInput === undefined) {
			return undefined
		}
		const updateInput = this.updateEntityInputProvider.getInput(entityName)
		if (updateInput === undefined) {
			return undefined
		}
		const resultType = this.createResultType(entityName, 'upsert')
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(resultType),
			args: {
				by: {
					type: new GraphQLNonNull(uniqueWhere),
				},
				filter: {
					type: this.whereTypeProvider.getEntityWhereType(entityName),
				},
				update: { type: new GraphQLNonNull(updateInput) },
				create: { type: new GraphQLNonNull(createInput) },
			},
			extensions: { [ExtensionKey]: new OperationMeta(Operation.upsert, entity) },
			resolve: (parent, args, context: Context, info) => {
				return context.timer(`GraphQL.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return context.executionContainer.mutationResolver.resolveUpsert(entity, info)
				})
			},
		}
	}

	private createResultType(
		entityName: string,
		operation: 'create' | 'update' | 'delete' | 'upsert',
	): GraphQLObjectType {
		const fields: GraphQLObjectTypeConfig<any, any>['fields'] = {
			ok: { type: new GraphQLNonNull(GraphQLBoolean) },
			errorMessage: { type: GraphQLString },
			errors: { type: this.resultSchemaTypeProvider.errorListResultType },
		}
		if (this.authorizator.getEntityPermission(Acl.Operation.read, entityName) !== 'no') {
			const nodeType = this.entityTypeProvider.getEntity(entityName)
			fields.node = { type: nodeType, resolve: aliasAwareResolver }
		}
		if (operation !== 'delete') {
			fields.validation = {
				type: new GraphQLNonNull(this.resultSchemaTypeProvider.validationResultType),
			}
		}
		return new GraphQLObjectType({
			name: GqlTypeName`${entityName}${operation}Result`,
			fields: fields,
			interfaces: [this.resultSchemaTypeProvider.mutationResultType],
		})
	}
}
