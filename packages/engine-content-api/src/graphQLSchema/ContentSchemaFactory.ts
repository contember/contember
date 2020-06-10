import { IExecutableSchemaDefinition } from 'graphql-tools'
import schema from './content-schema.graphql'
import * as ContentSchema from './content-schema.types'
import { Model, Validation } from '@contember/schema'
import { assertNever } from '../utils'
import { EntityRulesResolver } from '../input-validation/EntityRulesResolver'
import { getEntity } from '@contember/schema-utils'

export class ContentSchemaFactory {
	constructor(private readonly model: Model.Schema, private readonly rulesResolver: EntityRulesResolver) {}

	createFieldsSchema(entityName: string): readonly ContentSchema._Field[] {
		const entityRules = this.rulesResolver.getEntityRules(entityName)
		return Object.values(getEntity(this.model, entityName).fields).map(it => ({
			name: it.name,
			type: it.type,
			...this.createValidationSchema(entityRules[it.name] || []),
		}))
	}

	createValidationSchema(rules: Validation.ValidationRule[]): Pick<ContentSchema._Field, 'rules' | 'validators'> {
		const validators: ContentSchema._Validator[] = []

		const createValue = (value: number | string | boolean): ContentSchema._AnyValue & { __typename: string } => {
			if (value === undefined) {
				return { __typename: '_UndefinedValue', undefinedValue: true }
			}
			if (typeof value === 'string') {
				return { __typename: '_StringValue', stringValue: value }
			}
			if (typeof value === 'number') {
				return value % 1 === 0
					? { __typename: '_IntValue', intValue: value }
					: { __typename: '_FloatValue', floatValue: value }
			}
			if (typeof value === 'boolean') {
				return { __typename: '_BooleanValue', booleanValue: value }
			}
			throw new Error(`Argument of type ${typeof value} is not supported yet`)
		}

		const processValidator = (validator: Validation.Validator) => {
			const i = validators.length
			const args: (ContentSchema._Argument & { __typename: string })[] = []
			const apiValidator: ContentSchema._Validator = { operation: validator.operation, arguments: args }
			validators.push(apiValidator)
			for (const arg of validator.args) {
				switch (arg.type) {
					case Validation.ArgumentType.path:
						args.push({ __typename: '_PathArgument', path: arg.path })
						break
					case Validation.ArgumentType.literal:
						args.push({ __typename: '_LiteralArgument', value: createValue(arg.value) })
						break
					case Validation.ArgumentType.validator:
						args.push({ __typename: '_ValidatorArgument', validator: processValidator(arg.validator) })
						break
					default:
						assertNever(arg)
				}
			}

			return i
		}

		const processedRules = rules.map(
			(it): ContentSchema._Rule => ({ message: it.message, validator: processValidator(it.validator) }),
		)
		return {
			rules: processedRules,
			validators: validators,
		}
	}

	public create(): IExecutableSchemaDefinition {
		return {
			typeDefs: schema,
			resolvers: {
				Query: {
					schema: (): ContentSchema._Schema => ({
						enums: Object.entries(this.model.enums).map(([name, values]) => ({ name, values })),
						entities: Object.values(this.model.entities).map(entity => ({
							name: entity.name,
							fields: this.createFieldsSchema(entity.name),
						})),
					}),
				},
			},
		}
	}
}
