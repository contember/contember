import model, { acceptFieldVisitor, acceptRelationTypeVisitor, Entity, FieldVisitor, getEntity, RelationByTypeVisitor } from './model';
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
import { Join, JoinMonsterEntityMapping, JoinMonsterFieldMapping, SqlAstNode } from "./joinMonsterHelpers";
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

  return acceptFieldVisitor(model, entity, entity.primary, {
    visitRelation: () => {
      throw new Error('Only simple field can be a primary')
    },
    visitColumn: (entity, column) => ({[column.name]: {type: getBasicType(column.type)}}),
  });
};


const getListQuery = (entityName: string): FieldConfig => {
  return {
    type: new GraphQLList(getEntityType(entityName)),
    args: {
      where: {type: getEntityWhereType(entityName)},
    },
    where: (tableAlias: string, args: any, context: any, sqlAstNode: any) => {

      const usedNames: string[] = []
      const visitNode = (sqlAstNode: any) => {
        if (sqlAstNode.type === 'table' && sqlAstNode.as) {
          usedNames.push(sqlAstNode.as)
        }
        if (sqlAstNode.children) {
          (sqlAstNode.children as any[]).forEach(it => visitNode(it))
        }
      }

      const generateName = (fieldName: string): string => {
        let name = fieldName
        while (usedNames.includes(name)) {
          name += "_"
        }
        return name
      }
      visitNode(sqlAstNode)
      const joiner = (sqlAstNode: SqlAstNode, entity: Entity) => (joinPath: string[]): string => {
        const fieldName = joinPath[0]
        let subNode = sqlAstNode.children.find(it => it.fieldName === fieldName)
        if (!subNode) {
          const notSupported = () => {
            throw new Error('Only has one relation can be joined this way')
          }
          const joiningInfo = acceptRelationTypeVisitor(model, entity, fieldName, {
            visitManyHasManyInversed: notSupported,
            visitManyHasManyOwner: notSupported,
            visitOneHasMany: notSupported,

            visitManyHasOne: (entity, relation, targetEntity, targetRelation) => {
              return {
                name: relation.target,
                sqlJoin: (t1, t2) => `${t1}.${relation.joiningColumn.columnName} = ${t2}.${targetEntity.primary}`
              }
            },
            visitOneHasOneOwner: (entity, relation, targetEntity, targetRelation) => {
              return {
                name: relation.target,
                sqlJoin: (t1, t2) => `${t1}.${relation.joiningColumn.columnName} = ${t2}.${targetEntity.primary}`
              }
            },
            visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
              return {
                name: relation.target,
                sqlJoin: (t1, t2) => `${t1}.${entity.primary} = ${t2}.${targetRelation.joiningColumn.columnName}`
              }
            }
          } as RelationByTypeVisitor<{ name: string, sqlJoin: Join }>)
          subNode = {
            args: {},
            type: "table",
            as: generateName(fieldName),
            children: [],
            fieldName: fieldName,
            grabMany: false,
            ...joiningInfo
          }
          sqlAstNode.children.push(subNode)
        }
        if (joinPath.length > 1) {
          return joiner(subNode, getEntity(model, subNode.name))(joinPath.slice(1))
        }
        return subNode.as
      }

      console.log(JSON.stringify(sqlAstNode, null, 4))

      const entity = getEntity(model, entityName)
      return buildWhere(model, entity, joiner(sqlAstNode, entity))(tableAlias, args.where || {})
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
    whereFieldsPrototype[fieldName] = acceptFieldVisitor(model, name, fieldName, {
      visitColumn: (entity, column) => ({type: getConditionType(column.type)}),
      visitRelation: (entity, relation) => ({type: getEntityWhereType(relation.target)}),
    })
  }
}

const relationFactory = createJoinMonsterRelation(model)

const finalizeEntityType = (entityName: string) => {
  const entity = model.entities[entityName]
  const entityRelationFactory = relationFactory(entity)

  const fieldsConfig = getEntityFieldsPrototype(entityName)
  for (let fieldName in entity.fields) {

    const type: GraphQLOutputType = acceptFieldVisitor(model, entity, fieldName, {
      visitColumn: (entity, column) => {
        const basicType = getBasicType(column.type)
        return column.nullable ? basicType : new GraphQLNonNull(basicType)
      },
      visitHasMany: (entity, relation) => {
        return new GraphQLList(new GraphQLNonNull(getEntityType(relation.target)))
      },
      visitHasOne: (entity, relation) => {
        return relation.nullable ? getEntityType(relation.target) : new GraphQLNonNull(getEntityType(relation.target))
      },
    } as FieldVisitor<GraphQLOutputType>)

    fieldsConfig[fieldName] = acceptFieldVisitor(model, entity, fieldName, {
      visitColumn: (entity, column) => ({
        type: type,
        sqlColumn: column.columnName,
      }),
      visitRelation: (entity, relation) => ({
        type: type,
        args: {
          where: {type: getEntityWhereType(relation.target)},
        },
        where: (tableAlias: string, args: any, context: any, sqlAstNode: any) => {
          return ''
        },
        ...entityRelationFactory(relation)
      })
    } as FieldVisitor<JoinMonsterFieldMapping<any, any> & GraphQLFieldConfig<any, any>>);

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

