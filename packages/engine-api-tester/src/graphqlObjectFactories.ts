import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLFloat,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLNullableType,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	GraphQLType,
	GraphQLUnionType,
} from 'graphql'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'

export const graphqlObjectFactories: GraphQLObjectsFactory = {
	createObjectType: args => new GraphQLObjectType(args),
	createScalarType: args => new GraphQLScalarType(args),
	createInputObjectType: args => new GraphQLInputObjectType(args),
	createEnumType: args => new GraphQLEnumType(args),
	createList: <T extends GraphQLType>(type: T): GraphQLList<T> => new GraphQLList(type) as GraphQLList<T>,
	createNotNull: <T extends GraphQLNullableType>(type: T): GraphQLNonNull<T> =>
		new GraphQLNonNull(type) as GraphQLNonNull<T>,
	createUnion: config => new GraphQLUnionType(config),
	boolean: GraphQLBoolean,
	int: GraphQLInt,
	string: GraphQLString,
	float: GraphQLFloat,
	createSchema: config => new GraphQLSchema(config),
}
