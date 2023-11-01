import { Result } from '@contember/schema'
import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLInt,
	GraphQLInterfaceType,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
	GraphQLUnionType,
} from 'graphql'

export class ResultSchemaTypeProvider {
	private fieldPathFragmentType = new GraphQLObjectType({
		name: '_FieldPathFragment',
		fields: {
			field: { type: new GraphQLNonNull(GraphQLString) },
		},
	})
	private indexPathFragmentType = new GraphQLObjectType({
		name: '_IndexPathFragment',
		fields: {
			index: { type: new GraphQLNonNull(GraphQLInt) },
			alias: { type: GraphQLString },
		},
	})
	private pathFragmentType = new GraphQLUnionType({
		name: '_PathFragment',
		types: () => [
			this.fieldPathFragmentType,
			this.indexPathFragmentType,
		],
	})

	private validationMessageType = new GraphQLObjectType({
		name: '_ValidationMessage',
		fields: {
			text: { type: new GraphQLNonNull(GraphQLString) },
		},
	})
	private validationErrorType = new GraphQLObjectType({
		name: '_ValidationError',
		fields: {
			path: {
				type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.pathFragmentType))),
			},
			message: {
				type: new GraphQLNonNull(this.validationMessageType),
			},
		},
	})
	public validationResultType = new GraphQLObjectType({
		name: '_ValidationResult',
		fields: {
			valid: { type: new GraphQLNonNull(GraphQLBoolean) },
			errors: {
				type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.validationErrorType))),
			},
		},
	})

	private mutationErrorType = new GraphQLEnumType({
		name: '_MutationErrorType',
		values: Object.values(Result.ExecutionErrorType).reduce((acc, type) => ({ ...acc, [type]: {} }), {}),
	})

	public errorResultType = new GraphQLObjectType({
		name: '_MutationError',
		fields: {
			path: {
				deprecationReason: 'Use `paths`.',
				type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.pathFragmentType))),
			},
			paths: {
				type: new GraphQLNonNull(
					new GraphQLList(new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.pathFragmentType)))),
				),
			},
			type: {
				type: new GraphQLNonNull(this.mutationErrorType),
			},
			message: { type: GraphQLString },
		},
	})

	public errorListResultType = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.errorResultType)))

	public mutationResultType = new GraphQLInterfaceType({
		name: 'MutationResult',
		fields: {
			ok: { type: new GraphQLNonNull(GraphQLBoolean) },
			errorMessage: { type: GraphQLString },
			errors: { type: this.errorListResultType },
		},
	})
}
