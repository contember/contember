import {
	GraphQLBoolean,
	GraphQLEnumType,
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
	GraphQLFloat,
} from 'graphql'
import { GraphQLObjectsFactory } from '@contember/engine-content-api'

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
