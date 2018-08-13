import {
	GraphQLBoolean,
	GraphQLFieldConfig,
	GraphQLInputFieldConfig,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType,
	GraphQLNonNull
} from 'graphql'
import { Input, Model } from 'cms-common'
import { acceptFieldVisitor, getEntity } from '../../content-schema/modelUtils'
import { Context } from '../types'
import singletonFactory from '../../utils/singletonFactory'
import ColumnTypeResolver from './ColumnTypeResolver'
import EntityTypeProvider from './EntityTypeProvider'
import CreateEntityInputFieldVisitor from './mutations/CreateEntityInputFieldVisitor'
import CreateEntityRelationInputFieldVisitor from './mutations/CreateEntityRelationInputFieldVisitor'
import UpdateEntityInputFieldVisitor from './mutations/UpdateEntityInputFieldVisitor'
import UpdateEntityRelationInputFieldVisitor from './mutations/UpdateEntityRelationInputFieldVisitor'
import { GqlTypeName } from './utils'
import WhereTypeProvider from './WhereTypeProvider'
import { GraphQLInputType } from 'graphql/type/definition'
import MutationResolver from '../graphQlResolver/MutationResolver'

interface RelationDefinition {
	entityName: string
	relationName: string
}

interface EntityDefinition {
	entityName: string
	withoutRelation?: string
}

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider {
	private createEntityInputs = singletonFactory<GraphQLInputType, EntityDefinition>(id =>
		this.createCreateEntityInput(id.entityName, id.withoutRelation)
	)

	private updateEntityInputs = singletonFactory<GraphQLInputType, EntityDefinition>(id =>
		this.createUpdateEntityInput(id.entityName, id.withoutRelation)
	)

	private createEntityRelationInputs = singletonFactory<GraphQLInputObjectType, RelationDefinition>(id =>
		this.createCreateEntityRelationInput(id.entityName, id.relationName)
	)

	private updateEntityRelationInputs = singletonFactory<GraphQLInputObjectType, RelationDefinition>(id =>
		this.createUpdateEntityRelationInput(id.entityName, id.relationName)
	)

	constructor(
		private schema: Model.Schema,
		private whereTypeProvider: WhereTypeProvider,
		private entityTypeProvider: EntityTypeProvider,
		private columnTypeResolver: ColumnTypeResolver,
		private readonly mutationResolver: MutationResolver
	) {}

	public getMutations(entityName: string): { [fieldName: string]: FieldConfig<any> } {
		return {
			[`create${entityName}`]: this.getCreateMutation(entityName),
			[`delete${entityName}`]: this.getDeleteMutation(entityName),
			[`update${entityName}`]: this.getUpdateMutation(entityName)
		}
	}

	public getCreateMutation(entityName: string): FieldConfig<Input.CreateInput> {
		const entity = getEntity(this.schema, entityName)
		return {
			type: new GraphQLNonNull(this.entityTypeProvider.getEntity(entityName)),
			args: {
				data: { type: new GraphQLNonNull(this.getCreateEntityInput(entityName)) }
			},
			resolve: this.mutationResolver.resolveCreate(entity)
		}
	}

	public getDeleteMutation(entityName: string): FieldConfig<Input.DeleteInput> {
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
				data: { type: new GraphQLNonNull(this.getUpdateEntityInput(entityName)) }
			},
			resolve: this.mutationResolver.resolveUpdate(entity)
		}
	}

	public getCreateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputType {
		return this.createEntityInputs({ entityName, withoutRelation })
	}

	public createCreateEntityInput(entityName: string, withoutRelation?: string) {
		const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ''

		const entity = getEntity(this.schema, entityName)
		if (Object.keys(entity.fields).filter(it => it !== entity.primary && it !== withoutRelation).length === 0) {
			return GraphQLBoolean
		}
		const visitor = new CreateEntityInputFieldVisitor(this.columnTypeResolver, this)

		return new GraphQLInputObjectType({
			name: GqlTypeName`${entityName}${withoutSuffix}CreateInput`,
			fields: () => this.createEntityFields(visitor, entityName, withoutRelation)
		})
	}

	public getUpdateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputType {
		return this.updateEntityInputs({ entityName, withoutRelation })
	}

	public getCreateEntityRelationInput(entityName: string, relationName: string) {
		return this.createEntityRelationInputs({ entityName, relationName })
	}

	private createCreateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType {
		const visitor = new CreateEntityRelationInputFieldVisitor(this.schema, this.whereTypeProvider, this)
		return acceptFieldVisitor(this.schema, entityName, relationName, visitor)
	}

	public getUpdateEntityRelationInput(entityName: string, relationName: string) {
		return this.updateEntityRelationInputs({ entityName, relationName })
	}

	private createUpdateEntityInput(entityName: string, withoutRelation?: string) {
		const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ''

		const entity = getEntity(this.schema, entityName)
		if (Object.keys(entity.fields).filter(it => it !== entity.primary && it !== withoutRelation).length === 0) {
			return GraphQLBoolean
		}

		const visitor = new UpdateEntityInputFieldVisitor(this.columnTypeResolver, this)
		return new GraphQLInputObjectType({
			name: GqlTypeName`${entityName}${withoutSuffix}UpdateInput`,
			fields: () => this.createEntityFields(visitor, entityName, withoutRelation)
		})
	}

	private createEntityFields(
		visitor: Model.FieldVisitor<GraphQLInputFieldConfig | undefined>,
		entityName: string,
		withoutRelation?: string
	) {
		const fields: GraphQLInputFieldConfigMap = {}
		const entity = getEntity(this.schema, entityName)
		for (const fieldName in entity.fields) {
			if (withoutRelation && fieldName === withoutRelation) {
				continue
			}
			const result = acceptFieldVisitor(this.schema, entityName, fieldName, visitor)
			if (result !== undefined) {
				fields[fieldName] = result
			}
		}

		return fields
	}

	private createUpdateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType {
		const visitor = new UpdateEntityRelationInputFieldVisitor(this.schema, this.whereTypeProvider, this)
		return acceptFieldVisitor(this.schema, entityName, relationName, visitor)
	}
}
