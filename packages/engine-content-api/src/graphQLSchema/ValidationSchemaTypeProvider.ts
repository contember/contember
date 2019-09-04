import { GraphQLObjectsFactory } from './GraphQLObjectsFactory'

export class ValidationSchemaTypeProvider {
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

	constructor(private readonly graphqlObjectFactories: GraphQLObjectsFactory) {}
}
