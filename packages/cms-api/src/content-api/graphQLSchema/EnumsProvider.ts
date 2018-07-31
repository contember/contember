import { GraphQLEnumType } from "graphql"
import { GraphQLEnumValueConfigMap } from "graphql/type/definition"
import { Schema } from "../../content-schema/model"
import singletonFactory from "../../utils/singletonFactory"
import { capitalizeFirstLetter } from "../../utils/strings"

export default class EnumsProvider
{
  private schema: Schema

  private enums = singletonFactory(name => this.createEnum(name))

  constructor(schema: Schema)
  {
    this.schema = schema
  }

  public getEnum(name: string): GraphQLEnumType
  {
    return this.enums(name)
  }

  public hasEnum(name: string): boolean
  {
    return this.schema.enums[name] !== undefined
  }

  private createEnum(name: string): GraphQLEnumType
  {
    const valuesConfig: GraphQLEnumValueConfigMap = {}
    for (const val of this.schema.enums[name]) {
      valuesConfig[val] = {value: val}
    }

    return new GraphQLEnumType({
      name: capitalizeFirstLetter(name),
      values: valuesConfig
    })
  }

}
