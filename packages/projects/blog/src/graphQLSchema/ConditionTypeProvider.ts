import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList } from "graphql"
import { GraphQLNonNull } from "graphql/type/definition"
import singletonFactory from "../utils/singletonFactory"
import { capitalizeFirstLetter } from "../utils/strings"
import ColumnTypeResolver from "./ColumnTypeResolver"

export default class ConditionTypeProvider
{
  private columnTypeResolver: ColumnTypeResolver
  private conditions = singletonFactory(name => this.createCondition(name))

  constructor(columnTypeResolver: ColumnTypeResolver)
  {
    this.columnTypeResolver = columnTypeResolver
  }

  public getCondition(typeName: string): GraphQLInputObjectType
  {
    return this.conditions(typeName)
  }

  private createCondition(typeName: string)
  {
    const basicType = this.columnTypeResolver.getType(typeName)
    const condition: GraphQLInputObjectType = new GraphQLInputObjectType({
      name: capitalizeFirstLetter(typeName) + "Condition",
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
  }
}
