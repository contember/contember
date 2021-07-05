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
	private pathFragmentType = new GraphQLUnionType({
		name: '_PathFragment',
		types: () => [
			new GraphQLObjectType({
				name: '_FieldPathFragment',
				fields: {
					field: { type: new GraphQLNonNull(GraphQLString) },
				},
			}),
			new GraphQLObjectType({
				name: '_IndexPathFragment',
				fields: {
					index: { type: new GraphQLNonNull(GraphQLInt) },
					alias: { type: GraphQLString },
				},
			}),
		],
	})
	private validationErrorType = new GraphQLObjectType({
		name: '_ValidationError',
		fields: {
			path: {
				type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.pathFragmentType))),
			},
			message: {
				type: new GraphQLNonNull(
					new GraphQLObjectType({
						name: '_ValidationMessage',
						fields: {
							text: { type: new GraphQLNonNull(GraphQLString) },
						},
					}),
				),
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
				type: new GraphQLNonNull(
					new GraphQLEnumType({
						name: '_MutationErrorType',
						values: Object.values(Result.ExecutionErrorType).reduce((acc, type) => ({ ...acc, [type]: {} }), {}),
					}),
				),
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
