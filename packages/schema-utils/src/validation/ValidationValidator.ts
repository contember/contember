import { Model, Validation } from '@contember/schema'
import { ErrorBuilder, ValidationError } from './errors'
import { everyIs, hasArrayProperty, hasStringProperty, isArray, isObject } from './utils'
import { acceptFieldVisitor } from '../model'

export class ValidationValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(schema: unknown): [Validation.Schema, ValidationError[]] {
		const errorBuilder = new ErrorBuilder([], ['validation'])
		let validSchema: Validation.Schema
		if (!isObject(schema)) {
			errorBuilder.add('Must be an object')
			validSchema = { roles: {} }
		} else {
			validSchema = {}
			for (const entityName in schema) {
				const entity = this.model.entities[entityName]
				const entityErrorBuilder = errorBuilder.for(entityName)
				if (!entity) {
					entityErrorBuilder.add('Entity not found')
				} else {
					validSchema[entityName] = this.validateEntityRules(entityErrorBuilder, schema[entityName], entity)
				}
			}
		}
		return [validSchema, errorBuilder.errors]
	}

	private validateEntityRules(
		errorBuilder: ErrorBuilder,
		entitySchema: unknown,
		entity: Model.Entity,
	): Validation.EntityRules {
		if (!isObject(entitySchema)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		const validRules: Validation.EntityRules = {}
		for (const fieldName in entitySchema) {
			const field = entity.fields[fieldName]
			const fieldErrorBuilder = errorBuilder.for(fieldName)
			if (!field) {
				fieldErrorBuilder.add('Field not found')
			} else {
				validRules[fieldName] = this.validateFieldRules(fieldErrorBuilder, entitySchema[fieldName], entity, field)
			}
		}
		return validRules
	}

	private validateFieldRules(
		errorBuilder: ErrorBuilder,
		fieldSchema: unknown,
		entity: Model.Entity,
		field: Model.AnyField,
	): Validation.ValidationRule[] {
		if (!isArray(fieldSchema)) {
			errorBuilder.add('Must be an array')
			return []
		}
		const validRules = []
		for (const i in fieldSchema) {
			const rule = this.validateFieldRule(errorBuilder.for(i), fieldSchema[i], entity, field)
			if (rule !== undefined) {
				validRules.push(rule)
			}
		}
		return validRules
	}

	private validateFieldRule(
		errorBuilder: ErrorBuilder,
		rule: unknown,
		entity: Model.Entity,
		field: Model.AnyField,
	): Validation.ValidationRule | undefined {
		if (!isObject(rule)) {
			errorBuilder.add('Must be an object')
			return undefined
		}
		const errorMessage = acceptFieldVisitor(this.model, entity, field, {
			visitColumn: () => null,
			visitHasOne: () => null,
			visitHasMany: () => {
				return 'Rules on has-many relations are currently not supported.'
			},
		})
		if (errorMessage) {
			errorBuilder.add(errorMessage)
			return undefined
		}
		const validMessage = this.validateFieldRuleMessage(errorBuilder.for('message'), rule.message)
		if (!validMessage) {
			return undefined
		}

		const validValidator = this.validateValidator(errorBuilder.for('validator'), rule.validator, entity, field)
		if (!validValidator) {
			return undefined
		}
		return { message: validMessage, validator: validValidator }
	}

	private validateFieldRuleMessage(errorBuilder: ErrorBuilder, message: unknown): Validation.Message | undefined {
		if (!isObject(message)) {
			errorBuilder.add('Must be an object')
			return undefined
		}
		if (!hasStringProperty(message, 'text')) {
			errorBuilder.for('text').add('Must be a string')
			return undefined
		}
		let validMessage: Validation.Message = { text: message.text }
		if (message.parameters) {
			if (!hasArrayProperty(message, 'parameters')) {
				errorBuilder.for('parameters').add('Must be an array')
				return undefined
			}
			validMessage.parameters = message.parameters as string[]
		}

		return validMessage
	}

	private validateValidator(
		errorBuilder: ErrorBuilder,
		validator: unknown,
		entity: Model.Entity,
		field: Model.AnyField,
	): Validation.Validator | undefined {
		if (!isObject(validator)) {
			errorBuilder.add('Must be an object')
			return undefined
		}
		const validatorCast = validator as Validation.Validator
		switch (validatorCast.operation) {
			case 'and':
				const andArgs = validatorCast.args
					.map((it, index) => this.validateValidatorArgument(errorBuilder.for(String(index)), it, entity, field))
					.filter((it): it is Validation.ValidatorArgument => it !== undefined)
				return { operation: 'and' as const, args: andArgs }
			case 'or':
				const orArgs = validatorCast.args
					.map((it, index) => this.validateValidatorArgument(errorBuilder.for(String(index)), it, entity, field))
					.filter((it): it is Validation.ValidatorArgument => it !== undefined)
				return { operation: 'or' as const, args: orArgs }
			case 'conditional':
				const argA = this.validateValidatorArgument(errorBuilder.for('condition'), validatorCast.args[0], entity, field)
				const argB = this.validateValidatorArgument(errorBuilder.for('rule'), validatorCast.args[1], entity, field)
				if (argA === undefined || argB === undefined) {
					return undefined
				}

				return { operation: 'conditional', args: [argA, argB] }
			case 'pattern':
				const patternLiteral = this.validateLiteralArgument(errorBuilder, validatorCast.args[0])
				if (!patternLiteral) {
					return undefined
				}
				if (
					!isArray(patternLiteral.value) ||
					patternLiteral.value.length !== 2 ||
					typeof patternLiteral.value[0] !== 'string' ||
					typeof patternLiteral.value[1] !== 'string'
				) {
					errorBuilder.add('Invalid pattern value')
					return undefined
				}
				return { operation: 'pattern', args: [patternLiteral as Validation.LiteralArgument<[string, string]>] }
			case 'lengthRange':
				const lengthArgA = this.validateLiteralArgument(errorBuilder.for('min'), validatorCast.args[0])
				const lengthArgB = this.validateLiteralArgument(errorBuilder.for('max'), validatorCast.args[1])
				if (lengthArgA === undefined || lengthArgB === undefined) {
					return undefined
				}
				return {
					operation: 'lengthRange',
					args: [lengthArgA as Validation.LiteralArgument<number>, lengthArgB as Validation.LiteralArgument<number>],
				}
			case 'range':
				const rangeArgA = this.validateLiteralArgument(errorBuilder.for('min'), validatorCast.args[0])
				const rangeArgB = this.validateLiteralArgument(errorBuilder.for('max'), validatorCast.args[1])
				if (lengthArgA === undefined || lengthArgB === undefined) {
					return undefined
				}
				return {
					operation: 'range',
					args: [rangeArgA as Validation.LiteralArgument<number>, rangeArgB as Validation.LiteralArgument<number>],
				}
			case 'equals':
				const eqArg = this.validateLiteralArgument(errorBuilder, validatorCast.args[0])
				if (eqArg === undefined) {
					return undefined
				}
				return {
					operation: 'equals',
					args: [eqArg],
				}
			case 'not':
				const notArg = this.validateValidatorArgument(errorBuilder, validatorCast.args[0], entity, field)
				if (notArg === undefined) {
					return undefined
				}
				return { operation: 'not', args: [notArg] }
			case 'empty':
				return { operation: 'empty', args: [] }
			case 'defined':
				return { operation: 'defined', args: [] }
			case 'inContext':
				const pathArgResult = this.validatePathArgument(errorBuilder.for('path'), validatorCast.args[0], entity)
				if (pathArgResult === undefined) {
					return undefined
				}
				const [pathArg, inField] = pathArgResult

				const inValidatorArg = this.validateValidatorArgument(
					errorBuilder.for('validator'),
					validatorCast.args[1],
					entity,
					inField,
				)
				if (inValidatorArg === undefined) {
					return undefined
				}
				return { operation: 'inContext', args: [pathArg, inValidatorArg] }
			case 'every':
				const everyArg = this.validateValidatorArgument(errorBuilder, validatorCast.args[0], entity, field)
				if (everyArg === undefined) {
					return undefined
				}
				return { operation: 'every', args: [everyArg] }
			case 'any':
				const anyArg = this.validateValidatorArgument(errorBuilder, validatorCast.args[0], entity, field)
				if (anyArg === undefined) {
					return undefined
				}
				return { operation: 'any', args: [anyArg] }
			case 'filter':
				const filterArgA = this.validateValidatorArgument(
					errorBuilder.for('filter'),
					validatorCast.args[0],
					entity,
					field,
				)
				const filterArgB = this.validateValidatorArgument(
					errorBuilder.for('validator'),
					validatorCast.args[1],
					entity,
					field,
				)
				if (filterArgA === undefined || filterArgB === undefined) {
					return undefined
				}

				return { operation: 'filter', args: [filterArgA, filterArgB] }
			default:
				;((_: never) => {
					errorBuilder.for('operation', `Operation ${(validatorCast as any).operation} is not an valid option`)
				})(validatorCast)
		}
	}

	private validateValidatorArgument(
		errorBuilder: ErrorBuilder,
		argument: unknown,
		entity: Model.Entity,
		field: Model.AnyField,
	): Validation.ValidatorArgument | undefined {
		if (!isObject(argument)) {
			errorBuilder.add('Must be an object')
			return undefined
		}
		if (!hasStringProperty(argument, 'type') || argument.type !== Validation.ArgumentType.validator) {
			errorBuilder.for('type').add(`Invalid value ${argument.type}`)
			return undefined
		}
		const validator = this.validateValidator(errorBuilder.for('validator'), argument.validator, entity, field)
		if (!validator) {
			return undefined
		}
		return { validator, type: argument.type }
	}

	private validateLiteralArgument(
		errorBuilder: ErrorBuilder,
		argument: unknown,
	): Validation.LiteralArgument<unknown> | undefined {
		if (!isObject(argument)) {
			errorBuilder.add('Must be an object')
			return undefined
		}
		if (!hasStringProperty(argument, 'type') || argument.type !== Validation.ArgumentType.literal) {
			errorBuilder.for('type').add(`Invalid value ${argument.type}`)
			return undefined
		}
		if (!('value' in argument)) {
			errorBuilder.for('value').add('Undefined literal value')
			return undefined
		}
		return { type: argument.type, value: argument.value }
	}

	private validatePathArgument(
		errorBuilder: ErrorBuilder,
		argument: unknown,
		entity: Model.Entity,
	): [Validation.PathArgument, Model.AnyField] | undefined {
		if (!isObject(argument)) {
			errorBuilder.add('Must be an object')
			return undefined
		}
		if (!hasStringProperty(argument, 'type') || argument.type !== Validation.ArgumentType.path) {
			errorBuilder.for('type').add(`Invalid value ${argument.type}`)
			return undefined
		}
		if (!hasArrayProperty(argument, 'path')) {
			errorBuilder.add('Undefined path')
			return undefined
		}
		if (!everyIs(argument.path, (it): it is string => typeof it === 'string')) {
			errorBuilder.add('Invalid path')
			return undefined
		}
		const isRelation = acceptFieldVisitor(this.model, entity, argument.path[0], {
			visitColumn: () => false,
			visitRelation: () => true,
		})
		if (isRelation) {
			errorBuilder.add('Rules depending on relations are currently not supported.')
			return undefined
		}
		return [{ type: argument.type, path: argument.path }, entity.fields[argument.path[0]]]
	}
}
