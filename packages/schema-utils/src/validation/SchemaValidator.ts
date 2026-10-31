import { Schema } from '@contember/schema'
import { ValidationError, ValidationErrorCode } from './errors.js'
import { AclValidator } from './AclValidator.js'
import { ModelValidator } from './ModelValidator.js'
import { ValidationValidator } from './ValidationValidator.js'
import { ActionsValidator } from './ActionsValidator.js'
import { RetentionValidator } from './RetentionValidator.js'

export interface SchemaValidatorSkippedErrors {
	readonly code: ValidationErrorCode
	readonly skipUntil?: string
	readonly path?: string
}

export class SchemaValidator {
	public static validate(schema: Schema, skippedErrors: SchemaValidatorSkippedErrors[] = []): ValidationError[] {
		const modelValidator = new ModelValidator(schema.model)
		const modelErrors = modelValidator.validate()

		const aclValidator = new AclValidator(schema.model)
		const aclErrors = aclValidator.validate(schema.acl)

		const validationValidator = new ValidationValidator(schema.model)
		const validationErrors = validationValidator.validate(schema.validation)

		const actionsValidator = new ActionsValidator(schema.model)
		const actionsErrors = actionsValidator.validate(schema.actions)

		const retentionValidator = new RetentionValidator(schema.model)
		const retentionErrors = retentionValidator.validate(schema.retention)

		const allErrors = [...aclErrors, ...modelErrors, ...validationErrors, ...actionsErrors, ...retentionErrors]
		if (skippedErrors.length === 0) {
			return allErrors
		}
		return allErrors.filter(
			err =>
				!skippedErrors.some(
					rule =>
						err.code === rule.code
						&& (!rule.path || err.path.join('.') === rule.path),
				),
		)
	}
}
