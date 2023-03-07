import {
	GraphQLBoolean,
	GraphQLFieldConfig, GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLResolveInfo,
	GraphQLString,
} from 'graphql'
import { Acl, Model } from '@contember/schema'
import { Context } from '../types'
import { EntityTypeProvider } from './EntityTypeProvider'
import { WhereTypeProvider } from './WhereTypeProvider'
import { Authorizator } from '../acl'
import { EntityInputProvider, EntityInputType } from './mutations'
import { filterObject } from '../utils'
import { aliasAwareResolver, GqlTypeName } from './utils'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider'
import { MutationOperationInfoExtensionKey, OperationInfo } from './OperationExtension'
import { GraphQLFieldConfigArgumentMap } from 'graphql/type/definition'
import { MutationResolver } from '../resolvers'

type FieldConfig = GraphQLFieldConfig<any, Context>

type MutationOperation = 'create' | 'update' | 'delete' | 'upsert'

export class MutationProvider {
	constructor(
		private readonly authorizator: Authorizator,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly entityTypeProvider: EntityTypeProvider,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputType.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<EntityInputType.update>,
		private readonly resultSchemaTypeProvider: ResultSchemaTypeProvider,
	) {}

	public getMutations(entity: Model.Entity): { [fieldName: string]: FieldConfig } {
		if (entity.view) {
			return {}
		}
		const entityName = entity.name
		const mutations: { [fieldName: string]: FieldConfig | undefined } = {}
		mutations[`create${entityName}`] = this.getCreateMutation(entity)
		mutations[`delete${entityName}`] = this.getDeleteMutation(entity)
		mutations[`update${entityName}`] = this.getUpdateMutation(entity)
		mutations[`upsert${entityName}`] = this.getUpsertMutation(entity)

		return filterObject(mutations, (key, value): value is FieldConfig => value !== undefined)
	}

	protected getCreateMutation(entity: Model.Entity): FieldConfig | undefined {
		const dataType = this.createEntityInputProvider.getInput(entity.name)
		if (dataType === undefined) {
			return undefined
		}

		const args = {
			data: { type: new GraphQLNonNull(dataType) },
		}

		return this.createMutation(entity, 'create', args, (resolver, info) => resolver.resolveCreate(entity, info))
	}

	protected getDeleteMutation(entity: Model.Entity): FieldConfig | undefined {
		const entityName = entity.name
		if (this.authorizator.getEntityPermission(Acl.Operation.delete, entityName) === 'no') {
			return undefined
		}
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		const args = {
			by: {
				type: new GraphQLNonNull(uniqueWhere),
			},
			filter: {
				type: this.whereTypeProvider.getEntityWhereType(entityName),
			},
		}

		return this.createMutation(entity, 'delete', args, (resolver, info) => resolver.resolveDelete(entity, info))
	}


	protected getUpdateMutation(entity: Model.Entity): FieldConfig | undefined {
		const entityName = entity.name
		const dataType = this.updateEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		const args = {
			by: {
				type: new GraphQLNonNull(uniqueWhere),
			},
			filter: {
				type: this.whereTypeProvider.getEntityWhereType(entityName),
			},
			data: { type: new GraphQLNonNull(dataType) },
		}

		return this.createMutation(entity, 'update', args, (resolver, info) => resolver.resolveUpdate(entity, info))
	}

	private getUpsertMutation(entity: Model.Entity): FieldConfig | undefined {
		const entityName = entity.name
		const createInput = this.createEntityInputProvider.getInput(entityName)
		if (createInput === undefined) {
			return undefined
		}
		const updateInput = this.updateEntityInputProvider.getInput(entityName)
		if (updateInput === undefined) {
			return undefined
		}
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		const args = {
			by: {
				type: new GraphQLNonNull(uniqueWhere),
			},
			filter: {
				type: this.whereTypeProvider.getEntityWhereType(entityName),
			},
			update: { type: new GraphQLNonNull(updateInput) },
			create: { type: new GraphQLNonNull(createInput) },
		}
		return this.createMutation(entity, 'upsert', args, (resolver, info) => resolver.resolveUpsert(entity, info))
	}

	private createMutation(entity: Model.Entity, operation: MutationOperation, args: GraphQLFieldConfigArgumentMap, resolve: (resolver: MutationResolver, info: GraphQLResolveInfo) => Promise<unknown>): FieldConfig {
		const resultType = this.createResultType(entity.name, operation)
		return {
			type: new GraphQLNonNull(resultType),
			args,
			extensions: { [MutationOperationInfoExtensionKey]: new OperationInfo(operation, entity) },
			resolve: (parent, args, context: Context, info) => {
				return context.timer(`GraphQL.mutation.${info.fieldName}`, () => {
					if (parent && info.path) {
						return parent[info.path.key]
					}
					return resolve(context.executionContainer.mutationResolver, info)
				})
			},
		}

	}

	private createResultType(entityName: string, operation: MutationOperation): GraphQLObjectType {
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
