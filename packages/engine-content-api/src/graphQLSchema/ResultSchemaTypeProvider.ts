import { GraphQLObjectsFactory } from '@contember/graphql-utils'
import { Result } from '@contember/schema'

export class ResultSchemaTypeProvider {
	private pathFragmentType = this.graphqlObjectFactories.createUnion({
		name: '_PathFragment',
		types: () => [
			this.graphqlObjectFactories.createObjectType({
				name: '_FieldPathFragment',
				fields: {
					field: { type: this.graphqlObjectFactories.createNotNull(this.graphqlObjectFactories.string) },
				},
			}),
			this.graphqlObjectFactories.createObjectType({
				name: '_IndexPathFragment',
				fields: {
					index: { type: this.graphqlObjectFactories.createNotNull(this.graphqlObjectFactories.int) },
					alias: { type: this.graphqlObjectFactories.string },
				},
			}),
		],
	})
	private validationErrorType = this.graphqlObjectFactories.createObjectType({
		name: '_ValidationError',
		fields: {
			path: {
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(this.pathFragmentType)),
				),
			},
			message: {
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createObjectType({
						name: '_ValidationMessage',
						fields: {
							text: { type: this.graphqlObjectFactories.createNotNull(this.graphqlObjectFactories.string) },
						},
					}),
				),
			},
		},
	})
	public validationResultType = this.graphqlObjectFactories.createObjectType({
		name: '_ValidationResult',
		fields: {
			valid: { type: this.graphqlObjectFactories.createNotNull(this.graphqlObjectFactories.boolean) },
			errors: {
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(this.validationErrorType)),
				),
			},
		},
	})

	public errorResultType = this.graphqlObjectFactories.createObjectType({
		name: '_MutationError',
		fields: {
			path: {
				deprecationReason: 'Use `paths`.',
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(this.pathFragmentType)),
				),
			},
			paths: {
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createList(
						this.graphqlObjectFactories.createNotNull(
							this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(this.pathFragmentType)),
						),
					),
				),
			},
			type: {
				type: this.graphqlObjectFactories.createNotNull(
					this.graphqlObjectFactories.createEnumType({
						name: '_MutationErrorType',
						values: Object.values(Result.ExecutionErrorType).reduce((acc, type) => ({ ...acc, [type]: {} }), {}),
					}),
				),
			},
			message: { type: this.graphqlObjectFactories.string },
		},
	})

	public errorListResultType = this.graphqlObjectFactories.createNotNull(
		this.graphqlObjectFactories.createList(this.graphqlObjectFactories.createNotNull(this.errorResultType)),
	)

	constructor(private readonly graphqlObjectFactories: GraphQLObjectsFactory) {}
}
