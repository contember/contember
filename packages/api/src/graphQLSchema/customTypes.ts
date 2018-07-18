import { GraphQLScalarType, Kind } from "graphql"

export const GraphQLUUID: GraphQLScalarType = new GraphQLScalarType({
  name: "UUID",
  serialize: str => String(str),
  parseValue: str => String(str),
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === Kind.STRING ? ast.value : undefined
  }
})
