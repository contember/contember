import model, { getEntity, isField, isHasManyInversedRelation, isHasOneOwnerRelation, isManyHasManyOwnerRelation, isRelation } from './model';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLScalarType,
  GraphQLString,
  Kind
} from "graphql";
import { JoinMonsterEntityMapping, JoinMonsterFieldMapping, JoinMonsterRelation } from "./joinMonsterHelpers";
import {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLNonNull,
  GraphQLOutputType
} from "graphql/type/definition";
import joinMonster from 'join-monster'
import createJoinMonsterRelation from "./joinMonster/joinMonsterRelationFactory";
import { buildWhere } from "./whereMonster";

type FieldConfig = JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>

const singletonFactory = <T>(cb: (name: string) => T) => {
  const created: { [name: string]: T } = {}
  const recursionGuard: string[] = []
  return (name: string): T => {
    if (created[name]) {
      return created[name]
    }
    if (recursionGuard.includes(name)) {
      throw new Error(`Recursion for ${name} detected`)
    }
    recursionGuard.push(name)
    const val = cb(name)
    if (recursionGuard.pop() !== name) {
      throw new Error("impl error")
    }
    created[name] = val
    return val
  }
};


const getEnum = singletonFactory(name => {
  if (model.enums[name] === undefined) {
    return undefined
  }

  const valuesConfig: GraphQLEnumValueConfigMap = {}
  for (let val of model.enums[name]) {
    valuesConfig[val] = {value: val}
  }

  return new GraphQLEnumType({
    name: name,
    values: valuesConfig
  })
})

const GraphQLUUID: GraphQLScalarType = new GraphQLScalarType({
  name: 'UUID',
  serialize: str => String(str),
  parseValue: str => String(str),
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === Kind.STRING ? ast.value : undefined;
  }
});

const getBasicType = (type: string): GraphQLScalarType | GraphQLEnumType => {
  switch (type) {
    case 'int':
    case 'integer':
      return GraphQLInt
    case 'string':
      return GraphQLString
    case 'uuid':
      return GraphQLUUID
    case 'float':
      return GraphQLFloat
    case 'bool':
    case 'boolean':
      return GraphQLBoolean
    case 'datetime':
      return GraphQLString //todo
  }
  const enumType = getEnum(type)
  if (enumType !== undefined) {
    return enumType
  }
  throw new Error(`Undefined type ${type}`)
}


const getConditionType = singletonFactory(name => {
  const basicType = getBasicType(name)
  const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: name + "Condition",
    fields: () => ({
      and: {type: new GraphQLList(new GraphQLNonNull(condition))},
      or: {type: new GraphQLList(new GraphQLNonNull(condition))},
      not: {type: condition},

      eq: {type: basicType},
      null: {type: GraphQLBoolean},
      notEq: {type: basicType},
      in: {type: new GraphQLList(new GraphQLNonNull(basicType))},
      notIn: {type: new GraphQLList(new GraphQLNonNull(basicType))},
      lt: {type: basicType},
      lte: {type: basicType},
      gt: {type: basicType},
      gte: {type: basicType},
    })
  })
  return condition
})

const getEntityFieldsPrototype = singletonFactory<GraphQLFieldConfigMap<any, any>>(name => ({}))

const getEntityType = singletonFactory(name => {
  const entity = model.entities[name]
  const entityMapping: JoinMonsterEntityMapping = {
    sqlTable: entity.tableName,
    uniqueKey: entity.primary,
  }

  return new GraphQLObjectType({
    name: name,
    fields: () => getEntityFieldsPrototype(name),
    ...entityMapping
  } as GraphQLObjectTypeConfig<any, any>)
})
const getEntityWhereFieldsPrototype = singletonFactory<GraphQLInputFieldConfigMap>(name => ({}))

const getEntityWhereType = singletonFactory(name => {
  const fieldPrototypes = getEntityWhereFieldsPrototype(name)
  const where: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: name + "Where",
    fields: () => fieldPrototypes,
  })
  fieldPrototypes.and = {type: new GraphQLList(new GraphQLNonNull(where))}
  fieldPrototypes.or = {type: new GraphQLList(new GraphQLNonNull(where))}
  fieldPrototypes.not = {type: where}

  return where;
})

const getPrimaryWhere = (entityName: string): GraphQLFieldConfigArgumentMap => {
  let entity = model.entities[entityName];
  let name = entity.primary
  let field = entity.fields[name];
  if (!isField(field)) {
    throw new Error("Only simple field can be a primary");
  }

  return {
    [name]: {type: getBasicType(field.type)}
  }
};

const getListQuery = (typeName: string): FieldConfig => {
  return {
    type: new GraphQLList(getEntityType(typeName)),
    args: {
      where: {type: getEntityWhereType(typeName)},
    },
    where: (tableAlias: string, args: any, context: any, sqlAstNode: any) => {
      // sqlAstNode.children.push({
      //   "args": {},
      //   "type": "table",
      //   "name": "Author",
      //   "as": "author",
      //   "children": [],
      //   "fieldName": "author",
      //   "grabMany": false,
      //   sqlJoin: (t1: string, t2: string) => `${t1}.author_id = ${t2}.id`
      // })
      // console.log(JSON.stringify(sqlAstNode, null, 4))

      return buildWhere(model, getEntity(model, typeName))(tableAlias, args.where || {})
    },
    resolve: resolver([]),
  }
}


const getByIdQuery = (typeName: string): FieldConfig => {
  return {
    type: getEntityType(typeName),
    args: getPrimaryWhere(typeName),
    where: (tableName: string, args: any, context: any) => {
      return `${tableName}.${model.entities[typeName].primary[0]} = ${args.id}`
    },
    resolve: resolver(null),
  }
}
const finalizeWhereType = (name: string) => {
  const whereFieldsPrototype = getEntityWhereFieldsPrototype(name)
  let entity = model.entities[name];
  for (let fieldName in entity.fields) {
    const field = entity.fields[fieldName]
    if (isField(field)) {
      whereFieldsPrototype[fieldName] = {type: getConditionType(field.type)}
    } else if (isRelation(field)) {
      whereFieldsPrototype[fieldName] = {type: getEntityWhereType(field.target)}
    } else {
      throw new Error();
    }
  }
}

const relationFactory = createJoinMonsterRelation(model)

const finalizeEntityType = (entityName: string) => {
  const entity = model.entities[entityName]
  const entityRelationFactory = relationFactory(entity)

  const fieldsConfig = getEntityFieldsPrototype(entityName)
  for (let fieldName in entity.fields) {
    const field = entity.fields[fieldName]
    let fieldMapping: JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>;
    if (isField(field)) {
      const basicType = getBasicType(field.type)
      const type = field.nullable ? basicType : new GraphQLNonNull(basicType)
      fieldMapping = {
        type: type,
        sqlColumn: field.columnName,
      }
    } else if (isRelation(field)) {
      const targetType = getEntityType(field.target);
      let type: GraphQLOutputType;
      let joinMonsterRelation = entityRelationFactory(field);

      if (isHasOneOwnerRelation(field)) {
        type = field.nullable ? targetType : new GraphQLNonNull(targetType)
      } else if (isManyHasManyOwnerRelation(field)) {
        type = new GraphQLList(new GraphQLNonNull(targetType));
      } else if (isHasManyInversedRelation(field)) {
        type = new GraphQLList(new GraphQLNonNull(targetType))
      } else {
        throw new Error('not impl')
      }
      fieldMapping = {
        type: type,
        args: {
          where: {type: getEntityWhereType(field.target)},
        },
        where: (tableAlias: string, args: any, context: any, sqlAstNode: any) => {
          return ''
        },
        ...joinMonsterRelation
      }
    } else {
      throw new Error();
    }

    fieldsConfig[fieldName] = fieldMapping;
  }
}

const resolver = (result: any) => (parent: any, args: any, context: any, resolveInfo: any) => {
  console.log(arguments)
  return joinMonster(resolveInfo, context, (sql: string) => {
    console.log(sql)
    return Promise.resolve(result)
  })
}

const entityNames = Object.keys(model.entities)
entityNames.forEach(getEntityWhereType)

const queries = entityNames.reduce<{ [queryName: string]: FieldConfig }>((queries, entityName) => {
  queries[entityName + "s"] = getListQuery(entityName)
  queries[entityName] = getByIdQuery(entityName)
  return queries
}, {})

entityNames.forEach(finalizeEntityType)
entityNames.forEach(finalizeWhereType)

export default new GraphQLObjectType({
  description: 'global query object',
  name: 'Query',
  fields: () => ({
    version: {
      type: GraphQLString,
      resolve: () => 1
    },
    ...queries
  })
})

