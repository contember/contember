import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLEnumTypeConfig,
	GraphQLInputObjectType,
	GraphQLInputObjectTypeConfig,
	GraphQLFloat,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLNullableType,
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLScalarType,
	GraphQLScalarTypeConfig,
	GraphQLSchema,
	GraphQLSchemaConfig,
	GraphQLString,
	GraphQLType,
	GraphQLUnionType,
	GraphQLUnionTypeConfig,
} from 'graphql'

export interface GraphQLObjectsFactory {
	createObjectType: <TSource, TContext, TArgs = { [key: string]: any }>(
		args: GraphQLObjectTypeConfig<TSource, TContext, TArgs>,
	) => GraphQLObjectType<TSource, TContext, TArgs>
	createScalarType: (args: GraphQLScalarTypeConfig<any, any>) => GraphQLScalarType
	createInputObjectType: (args: GraphQLInputObjectTypeConfig) => GraphQLInputObjectType
	createEnumType: (args: GraphQLEnumTypeConfig) => GraphQLEnumType
	createList: <T extends GraphQLType>(type: T) => GraphQLList<T>
	createNotNull: <T extends GraphQLNullableType>(type: T) => GraphQLNonNull<T>
	createUnion: (config: GraphQLUnionTypeConfig<any, any>) => GraphQLUnionType
	boolean: typeof GraphQLBoolean
	int: typeof GraphQLInt
	string: typeof GraphQLString
	float: typeof GraphQLFloat
	createSchema: (config: GraphQLSchemaConfig) => GraphQLSchema
}
