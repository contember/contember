import { FieldVisitor, Schema } from "../schema/model";
import {
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLFieldResolver,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLNonNull
} from "graphql";
import singletonFactory from "../utils/singletonFactory";
import { capitalizeFirstLetter } from "../utils/strings";
import { Context } from "../types";
import { JoinMonsterFieldMapping } from "../joinMonsterHelpers";
import { deleteData, insertData, updateData } from "../sql/mapper";
import WhereTypeProvider from "./WhereTypeProvider";
import EntityTypeProvider from "./EntityTypeProvider";
import ColumnTypeResolver from "./ColumnTypeResolver";
import CreateEntityRelationInputFieldVisitor from "./mutations/CreateEntityRelationInputFieldVisitor";
import CreateEntityInputFieldVisitor from "./mutations/CreateEntityInputFieldVisitor";
import UpdateEntityRelationInputFieldVisitor from "./mutations/UpdateEntityRelationInputFieldVisitor";
import UpdateEntityInputFieldVisitor from "./mutations/UpdateEntityInputFieldVisitor";
import { acceptFieldVisitor, getEntity } from "../schema/modelUtils";
import { CreateInput, DeleteInput, UpdateInput } from "../schema/input";
import buildUniqueWhere from "../whereMonster/uniqueWhereBuilder";
import { isUniqueWhere } from "../schema/inputUtils";


type RelationDefinition = { entityName: string, relationName: string }
type FieldConfig<TArgs> = JoinMonsterFieldMapping<Context, TArgs> & GraphQLFieldConfig<Context, any, TArgs>

export default class MutationProvider
{
  private schema: Schema
  private whereTypeProvider: WhereTypeProvider
  private entityTypeProvider: EntityTypeProvider
  private columnTypeResolver: ColumnTypeResolver
  private resolver: GraphQLFieldResolver<any, any>;

  private createEntityInputs = singletonFactory<GraphQLInputObjectType, { entityName: string, withoutRelation?: string }>(id =>
    this.createCreateEntityInput(id.entityName, id.withoutRelation)
  )

  private updateEntityInputs = singletonFactory<GraphQLInputObjectType, { entityName: string, withoutRelation?: string }>(id =>
    this.createUpdateEntityInput(id.entityName, id.withoutRelation)
  )

  private createEntityRelationInputs = singletonFactory((id: RelationDefinition) => this.createCreateEntityRelationInput(id.entityName, id.relationName))
  private updateEntityRelationInputs = singletonFactory((id: RelationDefinition) => this.createUpdateEntityRelationInput(id.entityName, id.relationName))

  constructor(schema: Schema, whereTypeProvider: WhereTypeProvider, entityTypeProvider: EntityTypeProvider, columnTypeResolver: ColumnTypeResolver, resolver: GraphQLFieldResolver<any, any>)
  {
    this.schema = schema
    this.whereTypeProvider = whereTypeProvider
    this.entityTypeProvider = entityTypeProvider
    this.columnTypeResolver = columnTypeResolver
    this.resolver = resolver;
  }

  getMutations(entityName: string): { [fieldName: string]: FieldConfig<any> }
  {
    return {
      [`create${entityName}`]: this.getCreateMutation(entityName),
      [`delete${entityName}`]: this.getDeleteMutation(entityName),
      [`update${entityName}`]: this.getUpdateMutation(entityName),
    }
  }

  getCreateMutation(entityName: string): FieldConfig<CreateInput>
  {
    return {
      type: new GraphQLNonNull(this.entityTypeProvider.getEntity(entityName)),
      args: {
        data: {type: new GraphQLNonNull(this.getCreateEntityInput(entityName))}
      },
      where: (tableName: string, args: any, context: any) => {
        const entity = this.schema.entities[entityName];
        return buildUniqueWhere(this.schema, entity)(tableName, {[entity.primary]: context.primary})
      },
      resolve: async (parent, args, context: Context, resolveInfo) => {
        const primary = await insertData(this.schema, context.db)(entityName, args.data)
        return await this.resolver(parent, args, {...context, primary}, resolveInfo)
      },
    }
  }

  getDeleteMutation(entityName: string): FieldConfig<DeleteInput>
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
          throw new GraphQLError('Input where is not unique')
        }
        const response = await this.resolver(parent, args, context, resolveInfo)
        await deleteData(this.schema, context.db)(entityName, args.where)

        return response
      },
    }
  }

  getUpdateMutation(entityName: string): FieldConfig<UpdateInput>
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
          throw new GraphQLError('Input where is not unique')
        }
        await updateData(this.schema, context.db)(entityName, args.where, args.data)

        return await this.resolver(parent, args, context, resolveInfo)
      },
    }
  }

  getCreateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputObjectType
  {
    return this.createEntityInputs({entityName, withoutRelation})
  }

  createCreateEntityInput(entityName: string, withoutRelation?: string)
  {
    const withoutSuffix = withoutRelation ? "Without" + capitalizeFirstLetter(withoutRelation) : ''

    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entityName) + withoutSuffix + "CreateInput",
      fields: () => this.createEntityFields(new CreateEntityInputFieldVisitor(this.columnTypeResolver, this), entityName, withoutRelation),
    })
  }


  getUpdateEntityInput(entityName: string, withoutRelation?: string): GraphQLInputObjectType
  {
    return this.updateEntityInputs({entityName, withoutRelation})
  }

  private createUpdateEntityInput(entityName: string, withoutRelation?: string)
  {
    const withoutSuffix = withoutRelation ? "Without" + capitalizeFirstLetter(withoutRelation) : ''

    return new GraphQLInputObjectType({
      name: capitalizeFirstLetter(entityName) + withoutSuffix + "UpdateInput",
      fields: () => this.createEntityFields(new UpdateEntityInputFieldVisitor(this.columnTypeResolver, this), entityName, withoutRelation),
    })
  }

  private createEntityFields(visitor: FieldVisitor<GraphQLInputFieldConfig | undefined>, entityName: string, withoutRelation?: string)
  {
    const fields: GraphQLInputFieldConfigMap = {}
    let entity = getEntity(this.schema, entityName);
    for (let fieldName in entity.fields) {
      if (withoutRelation && fieldName === withoutRelation) {
        continue
      }
      const result = acceptFieldVisitor(this.schema, entityName, fieldName, visitor);
      if (result !== undefined) {
        fields[fieldName] = result
      }
    }

    return fields
  }


  getCreateEntityRelationInput(entityName: string, relationName: string)
  {
    return this.createEntityRelationInputs({entityName, relationName})
  }

  private createCreateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType
  {
    return acceptFieldVisitor(this.schema, entityName, relationName, new CreateEntityRelationInputFieldVisitor(this.schema, this.whereTypeProvider, this))
  }


  getUpdateEntityRelationInput(entityName: string, relationName: string)
  {
    return this.updateEntityRelationInputs({entityName, relationName})
  }

  private createUpdateEntityRelationInput(entityName: string, relationName: string): GraphQLInputObjectType
  {
    return acceptFieldVisitor(this.schema, entityName, relationName, new UpdateEntityRelationInputFieldVisitor(this.schema, this.whereTypeProvider, this))
  }
}
