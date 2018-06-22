import model, { isField, isHasManyInversedRelation, isHasOneOwnerRelation, isManyHasManyOwnerRelation, isRelation } from './model';
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


const finalizeEntityType = (entityName: string) => {
  const entity = model.entities[entityName]
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
      const targetEntity = model.entities[field.target]
      let type: GraphQLOutputType;
      let joinMonsterRelation: JoinMonsterRelation<any, any>;
      if (isHasOneOwnerRelation(field)) {
        type = field.nullable ? targetType : new GraphQLNonNull(targetType)
        joinMonsterRelation = {
          sqlJoin: (tableName, secondTableName) => {
            return `${tableName}.${field.joiningColumn.columnName} = ${secondTableName}.${targetEntity.primary}`
          }
        }
      } else if (isManyHasManyOwnerRelation(field)) {
        type = new GraphQLList(new GraphQLNonNull(targetType));
        joinMonsterRelation = {
          junction: {
            sqlTable: field.joiningTable.tableName,
            uniqueKey: [field.joiningTable.joiningColumn.columnName, field.joiningTable.inverseJoiningColumn.columnName],
            sqlBatch: {
              parentKey: entity.primary,
              thisKey: field.joiningTable.joiningColumn.columnName,
              sqlJoin: (tableName, targetTable) => {
                return `${tableName}.${field.joiningTable.inverseJoiningColumn.columnName} = ${targetTable}.${targetEntity.primary}`
              }
            }
          }
        }
      } else if (isHasManyInversedRelation(field)) {
        type = new GraphQLList(new GraphQLNonNull(targetType))

        const targetRelation = targetEntity.fields[field.ownedBy]
        if (!isRelation(targetRelation)) {
          throw new Error('definition error')
        } else if (isManyHasManyOwnerRelation(targetRelation)) {
          joinMonsterRelation = {
            junction: {
              sqlTable: targetRelation.joiningTable.tableName,
              uniqueKey: [targetRelation.joiningTable.joiningColumn.columnName, targetRelation.joiningTable.inverseJoiningColumn.columnName],
              sqlBatch: {
                parentKey: entity.primary,
                thisKey: targetRelation.joiningTable.inverseJoiningColumn.columnName,
                sqlJoin: (tableName, targetTable) => {
                  return `${tableName}.${targetRelation.joiningTable.joiningColumn.columnName} = ${targetTable}.${targetEntity.primary}`
                }
              }
            }
          }
        } else if (isHasOneOwnerRelation(targetRelation)) {
          joinMonsterRelation = {
            sqlBatch: {
              thisKey: targetRelation.joiningColumn.columnName,
              parentKey: entity.primary,
            }
          }
        } else {
          throw new Error('impl error')
        }

      } else {
        throw new Error('not impl')
      }
      fieldMapping = {
        type: type,
        args: {
          where: {type: getEntityWhereType(field.target)},
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

