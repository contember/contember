import {
  GraphQLBoolean,
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLFieldResolver,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLNonNull
} from "graphql"
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers"
import { CreateInput, DeleteInput, UpdateInput } from "../schema/input"
import { isUniqueWhere } from "../schema/inputUtils"
import { FieldVisitor, Schema } from "../schema/model"
import { acceptFieldVisitor, getEntity } from "../schema/modelUtils"
import { deleteData, insertData, updateData } from "../sql/mapper"
import { Context } from "../types"
import singletonFactory from "../utils/singletonFactory"
import buildUniqueWhere from "../whereMonster/uniqueWhereBuilder"
import ColumnTypeResolver from "./ColumnTypeResolver"
import EntityTypeProvider from "./EntityTypeProvider"
import CreateEntityInputFieldVisitor from "./mutations/CreateEntityInputFieldVisitor"
import CreateEntityRelationInputFieldVisitor from "./mutations/CreateEntityRelationInputFieldVisitor"
import UpdateEntityInputFieldVisitor from "./mutations/UpdateEntityInputFieldVisitor"
import UpdateEntityRelationInputFieldVisitor from "./mutations/UpdateEntityRelationInputFieldVisitor"
import { GqlTypeName } from "./utils"
import WhereTypeProvider from "./WhereTypeProvider"
import { GraphQLInputType } from "graphql/type/definition";

interface RelationDefinition
{
  entityName: string,
  relationName: string
}

interface EntityDefinition
{
  entityName: string
  withoutRelation?: string
}

type FieldConfig<TArgs> = JoinMonsterFieldMapping<Context, TArgs> & GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider
{
  private schema: Schema
  private whereTypeProvider: WhereTypeProvider
  private entityTypeProvider: EntityTypeProvider
  private columnTypeResolver: ColumnTypeResolver
  private resolver: GraphQLFieldResolver<any, any>

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
    schema: Schema,
    whereTypeProvider: WhereTypeProvider,
    entityTypeProvider: EntityTypeProvider,
    columnTypeResolver: ColumnTypeResolver,
    resolver: GraphQLFieldResolver<any, any>
  )
  {
    this.schema = schema
    this.whereTypeProvider = whereTypeProvider
    this.entityTypeProvider = entityTypeProvider
    this.columnTypeResolver = columnTypeResolver
    this.resolver = resolver
  }

  public getMutations(entityName: string): { [fieldName: string]: FieldConfig<any> }
  {
    return {
      [`create${entityName}`]: this.getCreateMutation(entityName),
      [`delete${entityName}`]: this.getDeleteMutation(entityName),
      [`update${entityName}`]: this.getUpdateMutation(entityName),
    }
  }

  public getCreateMutation(entityName: string): FieldConfig<CreateInput>
  {
    return {
      type: new GraphQLNonNull(this.entityTypeProvider.getEntity(entityName)),
      args: {
        data: {type: new GraphQLNonNull(this.getCreateEntityInput(entityName))}
      },
      where: (tableName: string, args: any, context: any) => {
        const entity = this.schema.entities[entityName]
        return buildUniqueWhere(this.schema, entity)(tableName, {[entity.primary]: context.primary})
      },
      resolve: async (parent, args, context: Context, resolveInfo) => {
        const primary = await insertData(this.schema, context.db)(entityName, args.data)
        return await this.resolver(parent, args, {...context, primary}, resolveInfo)
      },
    }
  }

  public getDeleteMutation(entityName: string): FieldConfig<DeleteInput>
  {
    const entity = getEntity(this.schema, entityName)
    return {
      type: this.entityTypeProvider.getEntity(entityName),
      args: {
        where: {type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName))},
      },
      where: (tableName, args) => {
        return buildUniqueWhere(this.schema, entity)(tableName, args.where)
      },
      resolve: async (parent, args, context, resolveInfo) => {
        if (!isUniqueWhere(entity, args.where)) {
          throw new GraphQLError("Input where is not unique")
        }
        const response = await this.resolver(parent, args, context, resolveInfo)
        await deleteData(this.schema, context.db)(entityName, args.where)

        return response
      },
    }
  }

  public getUpdateMutation(entityName: string): FieldConfig<UpdateInput>
  {
    const entity = getEntity(this.schema, entityName)
    return {
      type: this.entityTypeProvider.getEntity(entityName),
      args: {
        where: {type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName))},
        data: {type: new GraphQLNonNull(this.getUpdateEntityInput(entityName))}
      },
      where: (tableName: string, args) => {
        return buildUniqueWhere(this.schema, entity)(tableName, args.where)
      },
      resolve: async (parent, args, context, resolveInfo) => {
        if (!isUniqueWhere(entity, args.where)) {
          throw new GraphQLError("Input where is not unique")
        }
        await updateData(this.schema, context.db)(entityName, args.where, args.data)

        return await this.resolver(parent, args, context, resolveInfo)
      },
    }
  }

  public getCreateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputType
  {
    return this.createEntityInputs({entityName, withoutRelation})
  }

  public createCreateEntityInput(entityName: string, withoutRelation?: string)
  {
    const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ""

    const entity = getEntity(this.schema, entityName)
    if (Object.keys(entity.fields).filter(it => it !== entity.primary && it !== withoutRelation).length === 0) {
      return GraphQLBoolean
    }
    const visitor = new CreateEntityInputFieldVisitor(this.columnTypeResolver, this)

    return new GraphQLInputObjectType({
      name: GqlTypeName`${entityName}${withoutSuffix}CreateInput`,
      fields: () => this.createEntityFields(visitor, entityName, withoutRelation),
    })
  }

  public getUpdateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputType
  {
    return this.updateEntityInputs({entityName, withoutRelation})
  }

  public getCreateEntityRelationInput(entityName: string, relationName: string)
  {
    return this.createEntityRelationInputs({entityName, relationName})
  }

  private createCreateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType
  {
    const visitor = new CreateEntityRelationInputFieldVisitor(this.schema, this.whereTypeProvider, this)
    return acceptFieldVisitor(this.schema, entityName, relationName, visitor)
  }

  public getUpdateEntityRelationInput(entityName: string, relationName: string)
  {
    return this.updateEntityRelationInputs({entityName, relationName})
  }

  private createUpdateEntityInput(entityName: string, withoutRelation?: string)
  {
    const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ""

    const entity = getEntity(this.schema, entityName)
    if (Object.keys(entity.fields).filter(it => it !== entity.primary && it !== withoutRelation).length === 0) {
      return GraphQLBoolean
    }

    const visitor = new UpdateEntityInputFieldVisitor(this.columnTypeResolver, this)
    return new GraphQLInputObjectType({
      name: GqlTypeName`${entityName}${withoutSuffix}UpdateInput`,
      fields: () => this.createEntityFields(visitor, entityName, withoutRelation),
    })
  }

  private createEntityFields(visitor: FieldVisitor<GraphQLInputFieldConfig | undefined>, entityName: string, withoutRelation?: string)
  {
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

  private createUpdateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType
  {
    const visitor = new UpdateEntityRelationInputFieldVisitor(this.schema, this.whereTypeProvider, this)
    return acceptFieldVisitor(this.schema, entityName, relationName, visitor)
  }
}
