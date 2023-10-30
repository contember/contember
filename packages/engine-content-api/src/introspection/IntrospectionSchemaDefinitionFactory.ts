import * as ContentSchema from './content-schema.types'
import { IntrospectionSchemaFactory } from './IntrospectionSchemaFactory'
import { JSONType } from '@contember/graphql-utils'

import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLFieldResolver,
	GraphQLInt,
	GraphQLInterfaceType,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLSchemaConfig,
	GraphQLString,
	GraphQLUnionType,
} from 'graphql'

const _RuleMessage = new GraphQLObjectType({
	name: '_RuleMessage',
	fields: {
		text: { type: GraphQLString },
	},
})

const _ValidatorArgument = new GraphQLObjectType({
	name: '_ValidatorArgument',
	fields: {
		validator: { type: new GraphQLNonNull(GraphQLInt) },
	},
})

const _PathArgument = new GraphQLObjectType({
	name: '_PathArgument',
	fields: {
		path: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
	},
})

const _LiteralArgument = new GraphQLObjectType({
	name: '_LiteralArgument',
	fields: {
		value: { type: JSONType },
	},
})

const _Argument = new GraphQLUnionType({
	name: '_Argument',
	types: [_ValidatorArgument, _PathArgument, _LiteralArgument],
})

const _Validator = new GraphQLObjectType({
	name: '_Validator',
	fields: {
		operation: { type: new GraphQLNonNull(GraphQLString) },
		arguments: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Argument))) },
	},
})

const _Rule = new GraphQLObjectType({
	name: '_Rule',
	fields: {
		message: { type: _RuleMessage },
		validator: { type: new GraphQLNonNull(GraphQLInt) },
	},
})

const _FieldInterface = new GraphQLInterfaceType({
	name: '_Field',
	fields: {
		name: { type: new GraphQLNonNull(GraphQLString) },
		type: { type: new GraphQLNonNull(GraphQLString) },
		nullable: { type: GraphQLBoolean },
		rules: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Rule))) },
		validators: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Validator))) },
	},
})

const _OrderByDirection = new GraphQLEnumType({
	name: '_OrderByDirection',
	values: {
		asc: {},
		desc: {},
	},
})

const _OrderBy = new GraphQLObjectType({
	name: '_OrderBy',
	fields: {
		path: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
		direction: { type: new GraphQLNonNull(_OrderByDirection) },
	},
})

const _OnDeleteBehaviour = new GraphQLEnumType({
	name: '_OnDeleteBehaviour',
	values: {
		restrict: {},
		cascade: {},
		setNull: {},
	},
})

const _RelationSide = new GraphQLEnumType({
	name: '_RelationSide',
	values: {
		owning: {},
		inverse: {},
	},
})

const _Relation = new GraphQLObjectType({
	name: '_Relation',
	interfaces: [_FieldInterface],
	fields: {
		name: { type: new GraphQLNonNull(GraphQLString) },
		type: { type: new GraphQLNonNull(GraphQLString) },
		side: { type: new GraphQLNonNull(_RelationSide) },
		targetEntity: { type: new GraphQLNonNull(GraphQLString) },
		ownedBy: { type: GraphQLString },
		inversedBy: { type: GraphQLString },
		nullable: { type: GraphQLBoolean },
		onDelete: { type: _OnDeleteBehaviour },
		orphanRemoval: { type: GraphQLBoolean },
		orderBy: { type: new GraphQLList(new GraphQLNonNull(_OrderBy)) },
		rules: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Rule))) },
		validators: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Validator))) },
	},
})

const _Column = new GraphQLObjectType({
	name: '_Column',
	interfaces: [_FieldInterface],
	fields: {
		name: { type: new GraphQLNonNull(GraphQLString) },
		type: { type: new GraphQLNonNull(GraphQLString) },
		enumName: { type: GraphQLString },
		defaultValue: { type: JSONType },
		nullable: { type: new GraphQLNonNull(GraphQLBoolean) },
		rules: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Rule))) },
		validators: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Validator))) },
	},
})

const _UniqueConstraint = new GraphQLObjectType({
	name: '_UniqueConstraint',
	fields: {
		fields: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
	},
})

const _Entity = new GraphQLObjectType({
	name: '_Entity',
	fields: {
		name: { type: new GraphQLNonNull(GraphQLString) },
		customPrimaryAllowed: { type: new GraphQLNonNull(GraphQLBoolean) },
		fields: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_FieldInterface))) },
		unique: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_UniqueConstraint))) },
	},
})

const _Enum = new GraphQLObjectType({
	name: '_Enum',
	fields: {
		name: { type: new GraphQLNonNull(GraphQLString) },
		values: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
	},
})

const _Schema = new GraphQLObjectType({
	name: '_Schema',
	fields: {
		enums: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Enum))) },
		entities: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Entity))) },
	},
})


const createSchemaConfig = (resolver?: GraphQLFieldResolver<any, any>): GraphQLSchemaConfig => {
	return {
		query: new GraphQLObjectType({
			name: 'Query',
			fields: {
				schema: {
					type: _Schema,
					resolve: resolver,
				},
			},
		}),
		types: [_Column, _Relation],
	}
}


export default new GraphQLSchema(createSchemaConfig())

export class IntrospectionSchemaDefinitionFactory {
	constructor(private readonly introspectionSchemaFactory: IntrospectionSchemaFactory) {}

	public create(): GraphQLSchema {
		return new GraphQLSchema(this.createConfig())
	}

	public createConfig(): GraphQLSchemaConfig {
		return createSchemaConfig((): ContentSchema._Schema => {
			return this.introspectionSchemaFactory.create()
		})
	}
}
