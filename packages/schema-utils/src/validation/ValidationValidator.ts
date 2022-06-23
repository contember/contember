import { Model, Validation } from '@contember/schema'
import { ErrorBuilder, ValidationError } from './errors.js'
import { acceptFieldVisitor } from '../model/index.js'

export class ValidationValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(schema: Validation.Schema): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], ['validation'])
		for (const entityName in schema) {
			const entity = this.model.entities[entityName]
			const entityErrorBuilder = errorBuilder.for(entityName)
			if (!entity) {
				entityErrorBuilder.add('Entity not found')
			} else {
				this.validateEntityRules(entityErrorBuilder, schema[entityName], entity)
			}
		}
		return errorBuilder.errors
	}

	private validateEntityRules(
		errorBuilder: ErrorBuilder,
		entitySchema: Validation.EntityRules,
		entity: Model.Entity,
	): void {
		for (const fieldName in entitySchema) {
			const field = entity.fields[fieldName]
			const fieldErrorBuilder = errorBuilder.for(fieldName)
			if (!field) {
				fieldErrorBuilder.add('Field not found')
			} else {
				this.validateFieldRules(fieldErrorBuilder, entitySchema[fieldName], entity, field)
			}
		}
	}

	private validateFieldRules(
		errorBuilder: ErrorBuilder,
		fieldSchema: readonly Validation.ValidationRule[],
		entity: Model.Entity,
		field: Model.AnyField,
	): void {
		for (const i in fieldSchema) {
			this.validateFieldRule(errorBuilder.for(i), fieldSchema[i], entity, field)
		}
	}

	private validateFieldRule(
		errorBuilder: ErrorBuilder,
		rule: Validation.ValidationRule,
		entity: Model.Entity,
		field: Model.AnyField,
	): void {
		const errorMessage = acceptFieldVisitor(this.model, entity, field, {
			visitColumn: () => null,
			visitHasOne: () => null,
			visitHasMany: () => {
				return 'Rules on has-many relations are currently not supported.'
			},
		})
		if (errorMessage) {
			return errorBuilder.add(errorMessage)
		}
		this.validateValidator(errorBuilder.for('validator'), rule.validator, entity, field)
	}


	private validateValidator(
		errorBuilder: ErrorBuilder,
		validator: Validation.Validator,
		entity: Model.Entity,
		field: Model.AnyField,
	): void {
		const validatorCast = validator as Validation.Validator
		switch (validatorCast.operation) {
			case 'and':
			case 'or':
				return validatorCast.args
					.forEach((it, index) => this.validateValidatorArgument(errorBuilder.for(String(index)), it, entity, field))
			case 'conditional':
				this.validateValidatorArgument(errorBuilder.for('condition'), validatorCast.args[0], entity, field)
				this.validateValidatorArgument(errorBuilder.for('rule'), validatorCast.args[1], entity, field)
				return
			case 'pattern':
			case 'lengthRange':
			case 'range':
			case 'equals':
			case 'empty':
			case 'defined':
				return
			case 'not':
				return this.validateValidatorArgument(errorBuilder, validatorCast.args[0], entity, field)
			case 'inContext':
				const pathArgResult = this.validatePathArgument(errorBuilder.for('path'), validatorCast.args[0], entity)
				if (pathArgResult === undefined) {
					return undefined
				}
				return this.validateValidatorArgument(
					errorBuilder.for('validator'),
					validatorCast.args[1],
					entity,
					pathArgResult,
				)
			case 'every':
			case 'any':
				return this.validateValidatorArgument(errorBuilder, validatorCast.args[0], entity, field)
			case 'filter':
				this.validateValidatorArgument(
					errorBuilder.for('filter'),
					validatorCast.args[0],
					entity,
					field,
				)
				this.validateValidatorArgument(
					errorBuilder.for('validator'),
					validatorCast.args[1],
					entity,
					field,
				)
				return
			default:
				((_: never) => {
					errorBuilder.for('operation', `Operation ${(validatorCast as any).operation} is not an valid option`)
				})(validatorCast)
		}
	}

	private validateValidatorArgument(
		errorBuilder: ErrorBuilder,
		argument: Validation.ValidatorArgument,
		entity: Model.Entity,
		field: Model.AnyField,
	): void {
		this.validateValidator(errorBuilder.for('validator'), argument.validator, entity, field)
	}


	private validatePathArgument(
		errorBuilder: ErrorBuilder,
		argument: Validation.PathArgument,
		entity: Model.Entity,
	): Model.AnyField | undefined {
		const isRelation = acceptFieldVisitor(this.model, entity, argument.path[0], {
			visitColumn: () => false,
			visitRelation: () => true,
		})
		if (isRelation) {
			errorBuilder.add('Rules depending on relations are currently not supported.')
			return undefined
		}
		return entity.fields[argument.path[0]]
	}
}
