import singletonFactory from "../utils/singletonFactory"
import { GraphQLEnumValueConfigMap } from "graphql/type/definition"
import { GraphQLEnumType } from "graphql"
import { Schema } from "../model"
import { capitalizeFirstLetter } from "../utils/strings";

export default class EnumsProvider
{
  private schema: Schema;

  private enums = singletonFactory(name => this.createEnum(name))

  constructor(schema: Schema)
  {
    this.schema = schema;
  }

  getEnum(name: string): GraphQLEnumType
  {
    return this.enums(name)
  }

  hasEnum(name: string): boolean
  {
    return this.schema.enums[name] !== undefined
  }


  private createEnum(name: string): GraphQLEnumType
  {
    const valuesConfig: GraphQLEnumValueConfigMap = {}
    for (let val of this.schema.enums[name]) {
      valuesConfig[val] = {value: val}
    }

    return new GraphQLEnumType({
      name: capitalizeFirstLetter(name),
      values: valuesConfig
    })
  }

}
